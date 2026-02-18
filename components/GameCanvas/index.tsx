"use client";

import React, { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, RotateCcw, Zap, Hand, Battery, Signal } from "lucide-react";

// --- IMPORTS ---
import { Player } from "../../util/game-core/SynapsePlayer";
import { SynapseBackground } from "../../util/game-core/SynapseBackground";
import { SeaGrass } from "../../util/game-core/SynapseSeaGrass";
import { Particle } from "../../util/game-core/SynapseParticles";
import { SynapseCorals } from "../../util/game-core/SynapseCorals";
import { Pearl, CognitiveTask } from "../../util/game-core/SynapseCognitive";

// --- WEB SERIAL API TYPE DECLARATIONS ---
interface SerialPort {
  readonly readable: ReadableStream | null;
  readonly writable: WritableStream | null;
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
}
interface Serial extends EventTarget {
  requestPort(): Promise<SerialPort>;
  getPorts(): Promise<SerialPort[]>;
}
declare global {
  interface Navigator {
    serial?: Serial;
  }
}

// --- PRESSURE THRESHOLDS (tune these to match your MPX50dp voltage range) ---
const IDLE_THRESHOLD = 0.5;      // Below this = no squeeze = fish sinks
const DANGER_THRESHOLD = 2.0;    // Above this = over-squeeze = warning state

type CountdownValue = number | "GO!" | null;

interface ClinicalMetrics {
  accuracy: { correct: number; total: number };
  missed: number;
}

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const router = useRouter();

  /* =================== HARDWARE STATE ===================
   * 
   *  THE CORE FIX:
   *  isConnectedRef is a REF that mirrors the isConnected STATE.
   *  The game loop (requestAnimationFrame closure) is captured at mount,
   *  so it can never read React state directly — state values are stale.
   *  By keeping a ref in sync, the loop always sees the live value.
   * 
   *  isConnected (state)  → drives React UI re-renders
   *  isConnectedRef (ref) → read inside the game loop / getShouldSwimUp()
   *
   */
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const isConnectedRef = useRef<boolean>(false);          // ← THE FIX
  const pressureRef = useRef<number>(0);
  const serialPortRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);

  /* =================== GAME REFS =================== */
  const playerRef = useRef<Player | null>(null);
  const bgRef = useRef<SynapseBackground | null>(null);
  const grassRef = useRef<SeaGrass | null>(null);
  const coralsRef = useRef<SynapseCorals | null>(null);

  const particlesRef = useRef<Particle[]>([]);
  const pearlsRef = useRef<Pearl[]>([]);

  const inputRef = useRef<boolean>(false);   // keyboard fallback
  const taskTimerRef = useRef<number>(0);

  // Game State (dual ref+state pattern for loop safety)
  const gameStateRef = useRef<"MENU" | "PLAYING" | "SOFT_FAIL">("MENU");
  const countdownRef = useRef<CountdownValue>(null);

  /* =================== UI STATE =================== */
  const [uiState, setUiState] = useState<"MENU" | "PLAYING" | "SOFT_FAIL">("MENU");
  const [uiCountdown, setUiCountdown] = useState<CountdownValue>(null);

  // HUD
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [failReason, setFailReason] = useState<"floor" | "ceiling" | "pressure" | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [currentTask] = useState<CognitiveTask>({ instruction: "Collect BLUE", targetColor: "#00BFFF" });
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);

  // Pressure visualiser (shown while connected and playing)
  const [pressureDisplay, setPressureDisplay] = useState<number>(0);

  const metricsRef = useRef<ClinicalMetrics>({ accuracy: { correct: 0, total: 0 }, missed: 0 });
  const startTimeRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);

  /* =================== STATE HELPERS =================== */
  const setGameStatus = (status: "MENU" | "PLAYING" | "SOFT_FAIL") => {
    gameStateRef.current = status;
    setUiState(status);
  };

  const setCountdownStatus = (val: CountdownValue) => {
    countdownRef.current = val;
    setUiCountdown(val);
  };

  /* =================== IOT: CONNECT =================== */
  const connectSerial = async () => {
    try {
      if (!navigator.serial) {
        alert("Web Serial API not supported. Please use Chrome or Edge.");
        return;
      }
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      serialPortRef.current = port;

      // Update BOTH state (for UI) and ref (for game loop)
      setIsConnected(true);
      isConnectedRef.current = true;   // ← THE FIX

      const textDecoder = new TextDecoderStream();
      port.readable!.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      readerRef.current = reader;
      readSerialData(reader);
    } catch (err) {
      console.error("Serial connection failed:", err);
    }
  };

  const disconnectSerial = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      if (serialPortRef.current) {
        await serialPortRef.current.close();
        serialPortRef.current = null;
      }
    } catch (err) {
      console.error("Error disconnecting:", err);
    }
    setIsConnected(false);
    isConnectedRef.current = false;  // ← keep ref in sync
    pressureRef.current = 0;
  };

  /* =================== IOT: READ DATA =================== */
  /**
   * Continuously reads lines from ESP32 over Web Serial.
   * Expected format from firmware: "V:1.23\n"
   * where the number is voltage from MPX50dp via ESP32 ADC.
   */
  const readSerialData = async (reader: ReadableStreamDefaultReader<string>) => {
    let buffer = "";
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const match = line.match(/V:([\d.]+)/);
          if (match) {
            pressureRef.current = parseFloat(match[1]);
          }
        }
      }
    } catch (err) {
      console.error("Serial read error:", err);
      // Device was disconnected unexpectedly
      setIsConnected(false);
      isConnectedRef.current = false;
    }
  };

  /* =================== INPUT BRIDGE ===================
   *
   *  This is the single source of truth for "should the fish swim up?"
   *
   *  When hardware is connected  → use pressure sensor value
   *  When hardware is NOT connected → fall back to spacebar (for dev/testing)
   *
   *  IMPORTANT: reads isConnectedRef.current (not isConnected state)
   *  so this is always accurate inside the RAF game loop.
   *
   */
  const getShouldSwimUp = (): boolean => {
    if (isConnectedRef.current) {
      const p = pressureRef.current;
      return p > IDLE_THRESHOLD && p < DANGER_THRESHOLD;
    }
    return inputRef.current; // keyboard spacebar fallback
  };

  /* =================== INITIALIZATION =================== */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 1024;
    canvas.height = 600;

    playerRef.current = new Player(canvas.width, canvas.height);
    bgRef.current = new SynapseBackground(canvas.width, canvas.height);
    grassRef.current = new SeaGrass(canvas.width, canvas.height);
    coralsRef.current = new SynapseCorals(canvas.width, canvas.height);

    startTimeRef.current = Date.now();
    lastFrameRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
      if (readerRef.current) readerRef.current.cancel();
      if (serialPortRef.current) serialPortRef.current.close();
    };
  }, []);

  /* =================== KEYBOARD FALLBACK =================== */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); inputRef.current = true; }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") inputRef.current = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  /* =================== START SESSION =================== */
  const startSession = () => {
    if (playerRef.current) {
      playerRef.current.y = 300;
      playerRef.current.velocity = 0;
      playerRef.current.status = "swimming";
    }
    particlesRef.current = [];
    pearlsRef.current = [];
    metricsRef.current = { accuracy: { correct: 0, total: 0 }, missed: 0 };
    setScore(0);
    setStreak(0);
    setFailReason(null);
    setGameStatus("PLAYING");
    setCountdownStatus(3);

    let count = 3;
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    countdownTimer.current = setInterval(() => {
      count--;
      if (count > 0) setCountdownStatus(count);
      else if (count === 0) setCountdownStatus("GO!");
      else {
        setCountdownStatus(null);
        if (countdownTimer.current) clearInterval(countdownTimer.current);
      }
    }, 900);
  };

  /* =================== MAIN GAME LOOP =================== */
  const loop = (now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const delta = Math.min(32, now - lastFrameRef.current);
    lastFrameRef.current = now;
    const elapsed = Date.now() - startTimeRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- 1. DRAW WORLD ---
    let nightFactor = 0;
    let sandHeight = 50;
    if (bgRef.current) {
      nightFactor = bgRef.current.update(elapsed);
      bgRef.current.draw(ctx, nightFactor);
      sandHeight = bgRef.current.sandHeight;
    }
    if (coralsRef.current) {
      coralsRef.current.update();
      coralsRef.current.draw(ctx, nightFactor);
    }
    if (grassRef.current && playerRef.current) {
      grassRef.current.update(playerRef.current.x, playerRef.current.y, delta);
      grassRef.current.draw(ctx);
    }

    // --- 2. GAME LOGIC ---
    const currentState = gameStateRef.current;
    const isCountingDown = countdownRef.current !== null;
    const physicsActive = currentState === "PLAYING" && !isCountingDown;

    if (playerRef.current) {

      // HARDWARE SAFETY CHECK: overpressure kills the round
      if (isConnectedRef.current && pressureRef.current >= DANGER_THRESHOLD && physicsActive) {
        setFailReason("pressure");
        setGameStatus("SOFT_FAIL");
      }

      if (physicsActive) {
        // ← THE KEY CALL: getShouldSwimUp() reads the ref, always current
        const shouldSwim = getShouldSwimUp();

        playerRef.current.update(
          shouldSwim,
          delta,
          sandHeight,
          particlesRef.current,
          nightFactor
        );

        // Pearl spawn timer
        taskTimerRef.current += delta;
        if (taskTimerRef.current > 2000) {
          spawnPearls(canvas.width, canvas.height);
          taskTimerRef.current = 0;
        }

        // Boundary fail checks
        if (playerRef.current.status === "hit_floor") {
          setFailReason("floor");
          setGameStatus("SOFT_FAIL");
        } else if (playerRef.current.status === "hit_ceiling") {
          setFailReason("ceiling");
          setGameStatus("SOFT_FAIL");
        }

        // Pearl collision
        pearlsRef.current.forEach(pearl => {
          if (!pearl.collected && !pearl.markedForDeletion) {
            const dx = playerRef.current!.x - pearl.x;
            const dy = playerRef.current!.y - pearl.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < playerRef.current!.radius + pearl.radius + 10) {
              collectPearl(pearl);
            }
          }
        });

        // Update pressure display for HUD (throttle to every ~3 frames worth)
        setPressureDisplay(parseFloat(pressureRef.current.toFixed(2)));

      } else if (currentState === "MENU" || isCountingDown) {
        // Idle hover animation on menu/countdown
        playerRef.current.y = canvas.height / 2 + Math.sin(elapsed * 0.003) * 20;
        playerRef.current.velocity = 0;
        playerRef.current.rotation = 0;
      }

      playerRef.current.draw(ctx, nightFactor);
    }

    // --- 3. PEARLS ---
    for (let i = pearlsRef.current.length - 1; i >= 0; i--) {
      const p = pearlsRef.current[i];
      if (physicsActive) p.update(4);
      p.draw(ctx);
      if (p.markedForDeletion) {
        if (!p.collected && p.isTarget) metricsRef.current.missed++;
        pearlsRef.current.splice(i, 1);
      }
    }

    // --- 4. PARTICLES ---
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      if (physicsActive) p.update();
      p.draw(ctx);
      if (p.markedForDeletion) particlesRef.current.splice(i, 1);
    }

    // --- 5. DEPTH TINT ---
    ctx.fillStyle = "rgba(0, 20, 40, 0.12)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    rafRef.current = requestAnimationFrame(loop);
  };

  /* =================== HELPERS =================== */
  const spawnPearls = (w: number, h: number) => {
    const isTopCorrect = Math.random() > 0.5;
    const wrongColor = "#FF4500";
    const startX = w + 50;
    pearlsRef.current.push(new Pearl(startX, h * 0.3, isTopCorrect ? currentTask.targetColor : wrongColor, isTopCorrect));
    pearlsRef.current.push(new Pearl(startX, h * 0.7, !isTopCorrect ? currentTask.targetColor : wrongColor, !isTopCorrect));
  };

  const triggerFeedback = (text: string, color: string) => {
    setFeedback({ text, color });
    setTimeout(() => setFeedback(null), 2000);
  };

  const collectPearl = (pearl: Pearl) => {
    pearl.collected = true;
    metricsRef.current.accuracy.total++;
    if (pearl.isTarget) {
      metricsRef.current.accuracy.correct++;
      setScore(prev => prev + 100);
      setStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak % 5 === 0) triggerFeedback(`${newStreak} Streak! Incredible! 🔥`, "#FFD700");
        else if (newStreak === 3) triggerFeedback("Great Rhythm!", "#2DD4BF");
        return newStreak;
      });
      for (let i = 0; i < 8; i++) particlesRef.current.push(new Particle(pearl.x, pearl.y, 1, true));
    } else {
      setScore(prev => Math.max(0, prev - 50));
      setStreak(0);
      triggerFeedback("Oops! Focus on Blue!", "#FF6B6B");
      for (let i = 0; i < 12; i++) {
        const p = new Particle(pearl.x, pearl.y, 1.5, true);
        p.color = "rgba(255, 69, 0, 0.8)";
        particlesRef.current.push(p);
      }
    }
  };

  const resumeGame = () => {
    if (playerRef.current) {
      playerRef.current.y = 300;
      playerRef.current.velocity = 0;
      playerRef.current.status = "swimming";
      playerRef.current.floorTime = 0;
      playerRef.current.surfaceTime = 0;
    }
    setFailReason(null);
    setGameStatus("PLAYING");
  };

  const handleBackClick = () => {
    if (gameStateRef.current === "PLAYING") {
      setGameStatus("SOFT_FAIL");
      setShowExitConfirm(true);
    } else {
      setShowExitConfirm(true);
    }
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
    if (gameStateRef.current === "SOFT_FAIL" && !failReason) setGameStatus("PLAYING");
  };

  const confirmExit = () => router.push("/patients/home");

  /* =================== PRESSURE BAR COLOUR =================== */
  const getPressureColor = (p: number) => {
    if (p < IDLE_THRESHOLD) return "#4B5563";           // grey  – no input
    if (p < DANGER_THRESHOLD * 0.75) return "#2DD4BF";  // teal  – good zone
    if (p < DANGER_THRESHOLD) return "#FACC15";         // amber – getting high
    return "#EF4444";                                   // red   – danger
  };

  const pressurePct = Math.min(100, (pressureDisplay / DANGER_THRESHOLD) * 100);

  /* =================== RENDER =================== */
  return (
    <div style={styles.container}>
      <canvas ref={canvasRef} style={styles.canvas} />

      {/* ─── DEVICE CONNECTION BADGE (top-right) ─── */}
      <div style={{ position: "absolute", top: 20, right: 20, zIndex: 50 }}>
        {isConnected ? (
          <button
            onClick={disconnectSerial}
            className="flex items-center gap-2 bg-green-500/20 border border-green-500/50 px-4 py-2 rounded-full hover:bg-green-500/30 transition-colors"
            title="Click to disconnect"
          >
            <Signal size={16} className="text-green-400" />
            <span className="text-green-400 text-xs font-bold uppercase tracking-wider">Device Connected</span>
          </button>
        ) : (
          <button
            onClick={connectSerial}
            className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 px-4 py-2 rounded-full hover:bg-red-500/30 transition-colors cursor-pointer"
          >
            <Battery size={16} className="text-red-400" />
            <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Connect Device</span>
          </button>
        )}
      </div>

      {/* ─── MENU SCREEN ─── */}
      {uiState === "MENU" && (
        <div style={styles.overlay}>
          <div className="bg-[#0B1E33]/90 p-8 rounded-3xl border-2 border-[#2DD4BF] text-center max-w-lg backdrop-blur-md shadow-[0_0_50px_rgba(45,212,191,0.3)]">
            <h1 className="text-4xl font-bold text-[#00FFFF] mb-2 tracking-wider">SYNAPSE RACER</h1>
            <p className="text-gray-400 mb-6 uppercase text-sm tracking-widest">Protocol A: Motor &amp; Cognitive</p>

            <div className="grid grid-cols-2 gap-4 mb-8 text-left">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <Hand className="text-[#2DD4BF]" size={24} />
                  <span className="text-white font-bold">CONTROLS</span>
                </div>
                {isConnected ? (
                  <>
                    <p className="text-sm text-gray-300">Squeeze the bulb to swim up.</p>
                    <p className="text-sm text-gray-300">Release to dive down.</p>
                    <p className="text-sm text-[#FACC15] mt-1">Don't over-squeeze!</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-300">Hold <strong className="text-[#2DD4BF]">SPACE</strong> to Swim Up.</p>
                    <p className="text-sm text-gray-300">Release to Dive Down.</p>
                    <p className="text-sm text-gray-500 mt-1">(Connect device for hardware control)</p>
                  </>
                )}
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="text-yellow-400" size={24} />
                  <span className="text-white font-bold">GOAL</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-[#00BFFF] shadow-[0_0_10px_#00BFFF]" />
                  <span className="text-sm text-gray-300">Collect Blue (+100)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF4500] shadow-[0_0_10px_#FF4500]" />
                  <span className="text-sm text-gray-300">Avoid Red (−50)</span>
                </div>
              </div>
            </div>

            <button
              onClick={startSession}
              className="group relative px-8 py-4 bg-[#2DD4BF] text-[#0B1E33] font-black text-xl rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(45,212,191,0.6)]"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Play fill="currentColor" /> START MISSION
              </span>
              <div className="absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* ─── SOFT-FAIL / RESUME SCREEN ─── */}
      {uiState === "SOFT_FAIL" && failReason && (
        <div style={styles.overlay}>
          <div className="bg-[#0B1E33] p-8 rounded-3xl border border-[#FF4500] text-center shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">
              {failReason === "floor"
                ? "🐟 The Fish is Sleeping..."
                : failReason === "pressure"
                ? "💥 TOO MUCH PRESSURE!"
                : "🦅 Too High!"}
            </h2>
            <p className="text-[#2DD4BF] mb-6">
              {failReason === "floor"
                ? "Squeeze harder to wake up!"
                : failReason === "pressure"
                ? "Gently! Don't crush the sensor."
                : "Relax your grip to dive down."}
            </p>
            <button onClick={resumeGame} style={styles.btnPrimary}>
              <RotateCcw size={20} /> Resume
            </button>
          </div>
        </div>
      )}

      {/* ─── PLAYING HUD ─── */}
      {uiState === "PLAYING" && (
        <>
          {/* Score + Streak pills */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-none z-30">
            <div className="bg-[#0B1E33]/60 backdrop-blur-md border border-[#2DD4BF]/30 px-6 py-2 rounded-full shadow-lg flex flex-col items-center">
              <span className="text-[10px] text-[#2DD4BF] uppercase font-bold tracking-widest">Score</span>
              <span className="text-2xl font-mono font-black text-white leading-none">
                {score.toString().padStart(4, "0")}
              </span>
            </div>
            <div className={`bg-[#0B1E33]/60 backdrop-blur-md border px-4 py-2 rounded-full shadow-lg flex flex-col items-center transition-colors ${streak > 5 ? "border-yellow-400/60" : "border-white/10"}`}>
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Streak</span>
              <div className="flex items-center gap-1 leading-none">
                <Zap size={16} className={streak > 5 ? "text-yellow-400 fill-yellow-400" : "text-gray-500"} />
                <span className={`text-2xl font-black ${streak > 5 ? "text-yellow-400" : "text-white"}`}>{streak}</span>
              </div>
            </div>
          </div>

          {/* Pressure Gauge (only when device connected) */}
          {isConnected && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center gap-1">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Grip Pressure</span>
              <div className="w-48 h-3 bg-white/10 rounded-full overflow-hidden border border-white/20">
                <div
                  className="h-full rounded-full transition-all duration-75"
                  style={{
                    width: `${pressurePct}%`,
                    backgroundColor: getPressureColor(pressureDisplay),
                    boxShadow: `0 0 8px ${getPressureColor(pressureDisplay)}`,
                  }}
                />
              </div>
              <span className="text-[10px] font-mono" style={{ color: getPressureColor(pressureDisplay) }}>
                {pressureDisplay.toFixed(2)} V
              </span>
            </div>
          )}

          {/* Feedback toast */}
          {feedback && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 animate-bounce z-40">
              <div
                className="px-6 py-2 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/20 backdrop-blur-md"
                style={{ backgroundColor: "rgba(11, 30, 51, 0.9)", color: feedback.color }}
              >
                {feedback.text}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── COUNTDOWN OVERLAY ─── */}
      {uiCountdown !== null && (
        <div style={styles.countdown}>{uiCountdown}</div>
      )}

      {/* ─── EXIT CONFIRM MODAL ─── */}
      {showExitConfirm && (
        <div style={styles.overlayFull}>
          <div style={styles.modalCard}>
            <h3 style={{ color: "white", marginTop: 0, fontSize: "1.5rem" }}>Pause Session?</h3>
            <div style={{ display: "flex", gap: "20px", justifyContent: "center", marginTop: "20px" }}>
              <button
                onClick={cancelExit}
                style={{ ...styles.btnPrimary, background: "transparent", border: "1px solid #555", color: "#fff", boxShadow: "none" }}
              >
                Resume
              </button>
              <button
                onClick={confirmExit}
                style={{ ...styles.btnPrimary, background: "#FF4500", boxShadow: "0 0 20px rgba(255, 69, 0, 0.4)" }}
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── BACK BUTTON ─── */}
      <button onClick={handleBackClick} style={styles.backBtn} className="hover:bg-white/20">
        <RotateCcw size={16} /> <span>EXIT</span>
      </button>
    </div>
  );
};

/* =================== STYLES =================== */
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: "relative", width: "100%", display: "flex",
    justifyContent: "center", marginTop: "20px",
    flexDirection: "column", alignItems: "center",
  },
  canvas: {
    borderRadius: "20px",
    boxShadow: "0 0 50px rgba(45, 212, 191, 0.2)",
    border: "2px solid rgba(45, 212, 191, 0.3)",
    background: "#020c1b", maxWidth: "100%",
  },
  overlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", background: "rgba(2, 12, 27, 0.8)",
    backdropFilter: "blur(5px)", borderRadius: "20px", zIndex: 20,
  },
  overlayFull: {
    position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
    background: "rgba(2, 12, 27, 0.9)", backdropFilter: "blur(8px)",
    display: "flex", justifyContent: "center", alignItems: "center",
    zIndex: 100, borderRadius: "15px",
  },
  btnPrimary: {
    display: "flex", gap: "10px", alignItems: "center",
    padding: "15px 40px", background: "#2DD4BF", color: "#0B1E33",
    fontWeight: "bold", fontSize: "18px", borderRadius: "50px",
    border: "none", cursor: "pointer",
    boxShadow: "0 0 20px rgba(45, 212, 191, 0.5)", transition: "transform 0.1s",
  },
  countdown: {
    position: "absolute", top: "50%", left: "50%",
    transform: "translate(-50%, -50%)", fontSize: "8rem",
    fontWeight: "900", color: "#00FFFF",
    textShadow: "0 0 50px rgba(0, 255, 255, 0.8)",
    zIndex: 50, animation: "pulse 0.5s infinite alternate",
  },
  modalCard: {
    background: "rgba(20, 20, 30, 0.95)", padding: "30px 40px",
    borderRadius: "20px", border: "1px solid rgba(255, 255, 255, 0.1)",
    textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
  },
  backBtn: {
    position: "absolute", top: "20px", left: "20px",
    background: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    padding: "10px 20px", borderRadius: "30px", cursor: "pointer",
    color: "white", fontSize: "14px", fontWeight: "bold",
    display: "flex", gap: "8px", alignItems: "center",
    backdropFilter: "blur(4px)", zIndex: 30, transition: "all 0.2s ease",
  },
};

export default GameCanvas;