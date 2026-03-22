"use client";

import React, { useRef, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Play, RotateCcw, Zap, Hand, Wifi, WifiOff } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/lib/firebase";
import { saveGameSession } from "../../app/lib/db/sessions";
import { updateSessionStatus } from "../../app/lib/db/schedule";
import {
  getActiveProtocol,
  addXpToPatient,
  updateHardwareStatus,
} from "../../app/lib/db/users";
import {
  calculateCognitiveAccuracy,
  calculateEnduranceDrop,
  getPeakGripForce,
} from "../../util/game-core/MetricsCalculator";
import { Timestamp } from "firebase/firestore";
import { Player } from "../../util/game-core/SynapsePlayer";
import { SynapseBackground } from "../../util/game-core/SynapseBackground";
import { SeaGrass } from "../../util/game-core/SynapseSeaGrass";
import { Particle } from "../../util/game-core/SynapseParticles";
import { SynapseCorals } from "../../util/game-core/SynapseCorals";
import { Pearl, CognitiveTask } from "../../util/game-core/SynapseCognitive";
import { TherapyProtocol } from "@/app/lib/db/types";

// ── WEB SERIAL TYPES ──────────────────────────────────────────────────────────
interface SerialPort {
  readonly readable: ReadableStream | null;
  readonly writable: WritableStream | null;
  open(opts: { baudRate: number }): Promise<void>;
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

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const IDLE_THRESHOLD = 0.5;
const DANGER_THRESHOLD = 2.0;

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface ClinicalMetrics {
  accuracy: { correct: number; total: number };
  missed: number;
  jumpPressures: number[]; // peak pressure of every completed squeeze
  currentSqueezePeak: number;
  isSqueezing: boolean;
  reactionTimes: number[]; // ms from pearl spawn to first squeeze
}

type CountdownValue = number | "GO!" | null;

// ── GLOBAL CSS ────────────────────────────────────────────────────────────────
const GAME_CSS = `
  body:has(#synapse-game-root) aside,
  body:has(#synapse-game-root) nav,
  body:has(#synapse-game-root) header { display: none !important; }

  #synapse-game-root {
    position: fixed !important; inset: 0 !important;
    z-index: 9999 !important;
    width: 100vw !important; height: 100vh !important;
    overflow: hidden !important; background: #020c1b;
  }
  #synapse-game-root canvas {
    display: block; width: 100% !important; height: 100% !important;
  }

  @keyframes cdpop {
    0%  { transform:translate(-50%,-50%) scale(0.3); opacity:0 }
    45% { transform:translate(-50%,-50%) scale(1.20); opacity:1 }
    72% { transform:translate(-50%,-50%) scale(0.94) }
    100%{ transform:translate(-50%,-50%) scale(1);   opacity:1 }
  }
  @keyframes goburst {
    0%  { transform:translate(-50%,-50%) scale(0.5); opacity:0 }
    35% { transform:translate(-50%,-50%) scale(1.32); opacity:1 }
    68% { transform:translate(-50%,-50%) scale(1.02) }
    100%{ transform:translate(-50%,-50%) scale(1.12); opacity:0 }
  }
  @keyframes hudin {
    from { opacity:0; transform:translateY(-10px) }
    to   { opacity:1; transform:translateY(0) }
  }
  @keyframes feedin {
    0%  { opacity:0; transform:translate(-50%,-14px) scale(0.84) }
    30% { opacity:1; transform:translate(-50%,0)     scale(1.05) }
    78% { opacity:1; transform:translate(-50%,0)     scale(1) }
    100%{ opacity:0; transform:translate(-50%,8px)   scale(0.94) }
  }
  @keyframes shimmer {
    0%  { transform:translateX(-220%) skewX(-18deg) }
    100%{ transform:translateX(320%)  skewX(-18deg) }
  }
  @keyframes menuin {
    from { opacity:0; transform:translateY(22px) }
    to   { opacity:1; transform:translateY(0) }
  }
  @keyframes scanline {
    0%  { top:-12%; opacity:0 }
    8%  { opacity:.6 }
    92% { opacity:.6 }
    100%{ top:112%;  opacity:0 }
  }
`;

// ── PRESSURE COLOUR ───────────────────────────────────────────────────────────
const pressureColor = (v: number) => {
  if (v < IDLE_THRESHOLD) return { hex: "#64748b", label: "IDLE" };
  if (v < DANGER_THRESHOLD * 0.6) return { hex: "#2DD4BF", label: "GOOD" };
  if (v < DANGER_THRESHOLD * 0.85) return { hex: "#FACC15", label: "HIGH" };
  return { hex: "#EF4444", label: "DANGER" };
};

// ── COMPONENT ─────────────────────────────────────────────────────────────────
const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const scheduledSessionId = searchParams.get("sessionId");

  // ── Auth + protocol — load silently in background, never block the game ──
  // useAuthState is called unconditionally at top level (React hook rules)
  const [user] = useAuthState(auth);
  const [protocol, setProtocol] = useState<TherapyProtocol | null>(null);

  // userRef keeps a stable ref to user.uid so connectSerial / disconnectSerial
  // can call updateHardwareStatus even though they're defined before the effect
  const userUidRef = useRef<string>("");
  useEffect(() => {
    userUidRef.current = user?.uid ?? "";
  }, [user]);

  useEffect(() => {
    if (!user) return;
    getActiveProtocol(user.uid)
      .then((p) => {
        if (p) setProtocol(p);
      })
      .catch(() => {}); // silent — fallbacks used if no protocol found
  }, [user]);

  // ── IoT — ORIGINAL INLINE SERIAL CODE (preserved exactly) ────────────────
  // pressRef is a bare ref mutated directly by _readLoop.
  // The game loop reads pressRef.current — no closure/stale-value issues.
  const [isConnected, setIsConnected] = useState(false);
  const isConnRef = useRef(false);
  const pressRef = useRef(0);
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);

  const connectSerial = async () => {
    try {
      if (!navigator.serial) {
        alert("Web Serial not supported. Use Chrome or Edge.");
        return;
      }
      const port = await navigator.serial.requestPort();
      if (!port.readable) await port.open({ baudRate: 115200 });
      portRef.current = port;
      setIsConnected(true);
      isConnRef.current = true;
      const td = new TextDecoderStream();
      port.readable!.pipeTo(td.writable).catch(() => {});
      const r = td.readable.getReader();
      readerRef.current = r;
      _readLoop(r);
      // Write hardware status to Firestore (fire-and-forget)
      if (userUidRef.current) {
        updateHardwareStatus(userUidRef.current, "connected").catch(() => {});
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "NotFoundError") return;
      alert("Could not connect. Make sure device is plugged in.");
    }
  };

  const disconnectSerial = async () => {
    setIsConnected(false);
    isConnRef.current = false;
    pressRef.current = 0;
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current.releaseLock();
        readerRef.current = null;
      }
    } catch (_) {}
    try {
      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }
    } catch (_) {}
    // Write hardware status to Firestore (fire-and-forget)
    if (userUidRef.current) {
      updateHardwareStatus(userUidRef.current, "offline").catch(() => {});
    }
  };

  // _readLoop: parses "V:X.XX\n" lines from serial, writes to pressRef.current
  // This is the only place pressRef is mutated — no React state, no re-renders
  const _readLoop = async (r: ReadableStreamDefaultReader<string>) => {
    let buf = "";
    try {
      while (true) {
        const { value, done } = await r.read();
        if (done) break;
        buf += value;
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          const m = line.match(/V:([\d.]+)/);
          if (m) pressRef.current = parseFloat(m[1]);
        }
      }
    } catch (_) {
      setIsConnected(false);
      isConnRef.current = false;
    }
  };

  // Game objects
  const playerRef = useRef<Player | null>(null);
  const bgRef = useRef<SynapseBackground | null>(null);
  const grassRef = useRef<SeaGrass | null>(null);
  const coralsRef = useRef<SynapseCorals | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const pearlsRef = useRef<Pearl[]>([]);
  const taskTimerRef = useRef(0);

  const isKeyPressedRef = useRef(false);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        isKeyPressedRef.current = true;
        e.preventDefault(); // Stop page from scrolling
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        isKeyPressedRef.current = false;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // State (dual ref+state for game loop compatibility)
  const gsRef = useRef<"MENU" | "PLAYING" | "SOFT_FAIL">("MENU");
  const cdRef = useRef<CountdownValue>(null);
  const [uiState, setUiState] = useState<"MENU" | "PLAYING" | "SOFT_FAIL">(
    "MENU",
  );
  const [uiCd, setUiCd] = useState<CountdownValue>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [failReason, setFailReason] = useState<
    "floor" | "ceiling" | "pressure" | null
  >(null);
  const [showExit, setShowExit] = useState(false);
  const [currentTask] = useState<CognitiveTask>({
    instruction: "Collect BLUE",
    targetColor: "#00BFFF",
  });
  const [feedback, setFeedback] = useState<{
    text: string;
    color: string;
  } | null>(null);
  const [pressDisp, setPressDisp] = useState(0);

  // Clinical metrics collected during play
  const metricsRef = useRef<ClinicalMetrics>({
    accuracy: { correct: 0, total: 0 },
    missed: 0,
    jumpPressures: [],
    currentSqueezePeak: 0,
    isSqueezing: false,
    reactionTimes: [], // added: ms from pearl spawn → first squeeze
  });

  // lastSpawnTime: set when pearls are spawned, used to compute reaction time
  const lastSpawnTimeRef = useRef(0);

  const startRef = useRef(0);
  const lastRef = useRef(0);
  const cdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const setGs = (s: typeof gsRef.current) => {
    gsRef.current = s;
    setUiState(s);
  };
  const setCd = (v: CountdownValue) => {
    cdRef.current = v;
    setUiCd(v);
  };
// ── swimUp: HARDWARE + KEYBOARD FALLBACK ──────────────────────────────────
  const swimUp = (): boolean => {
    // If connected, use real sensor. If not, simulate a good pressure if spacebar is held.
    const p = isConnRef.current 
      ? pressRef.current 
      : (isKeyPressedRef.current ? (IDLE_THRESHOLD + 0.2) : 0);
      
    const isSwimming = p > IDLE_THRESHOLD && p < DANGER_THRESHOLD;

    if (isSwimming) {
      if (lastSpawnTimeRef.current > 0) {
        const reactionTime = Date.now() - lastSpawnTimeRef.current;
        metricsRef.current.reactionTimes.push(reactionTime);
        lastSpawnTimeRef.current = 0;
      }
      metricsRef.current.isSqueezing = true;
      if (p > metricsRef.current.currentSqueezePeak) {
        metricsRef.current.currentSqueezePeak = p;
      }
    } else if (metricsRef.current.isSqueezing) {
      metricsRef.current.jumpPressures.push(
        metricsRef.current.currentSqueezePeak,
      );
      metricsRef.current.currentSqueezePeak = 0;
      metricsRef.current.isSqueezing = false;
    }

    return isSwimming;
  };

  // ── Resize ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      const c = canvasRef.current;
      if (!c) return;
      c.width = window.innerWidth;
      c.height = window.innerHeight;
      bgRef.current = new SynapseBackground(c.width, c.height);
      grassRef.current = new SeaGrass(c.width, c.height);
      coralsRef.current = new SynapseCorals(c.width, c.height);
      if (playerRef.current) playerRef.current = new Player(c.width, c.height);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Init + game loop ──────────────────────────────────────────────────────
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    playerRef.current = new Player(c.width, c.height);
    bgRef.current = new SynapseBackground(c.width, c.height);
    grassRef.current = new SeaGrass(c.width, c.height);
    coralsRef.current = new SynapseCorals(c.width, c.height);
    startRef.current = Date.now();
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (cdTimerRef.current) clearInterval(cdTimerRef.current);
      const cleanup = async () => {
        try {
          if (readerRef.current) {
            await readerRef.current.cancel();
            readerRef.current.releaseLock();
            readerRef.current = null;
          }
        } catch (_) {}
        try {
          if (portRef.current) {
            await portRef.current.close();
            portRef.current = null;
          }
        } catch (_) {}
      };
      cleanup();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start session ─────────────────────────────────────────────────────────
  const startSession = () => {
    const c = canvasRef.current;
    if (!c) return;
    if (playerRef.current) {
      playerRef.current.y = c.height / 2;
      playerRef.current.velocity = 0;
      playerRef.current.status = "swimming";
    }
    particlesRef.current = [];
    pearlsRef.current = [];

    metricsRef.current = {
      accuracy: { correct: 0, total: 0 },
      missed: 0,
      jumpPressures: [],
      currentSqueezePeak: 0,
      isSqueezing: false,
      reactionTimes: [],
    };
    lastSpawnTimeRef.current = 0;

    setScore(0);
    setStreak(0);
    setFailReason(null);
    setGs("PLAYING");
    setCd(3);
    let count = 3;
    if (cdTimerRef.current) clearInterval(cdTimerRef.current);
    cdTimerRef.current = setInterval(() => {
      count--;
      if (count > 0) setCd(count);
      else if (count === 0) setCd("GO!");
      else {
        setCd(null);
        if (cdTimerRef.current) clearInterval(cdTimerRef.current);
      }
    }, 900);
  };

  // ── Game loop ─────────────────────────────────────────────────────────────
  const loop = (now: number) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const delta = Math.min(32, now - lastRef.current);
    lastRef.current = now;
    const elapsed = Date.now() - startRef.current;

    ctx.clearRect(0, 0, c.width, c.height);

    const state = gsRef.current;
    const isCounting = cdRef.current !== null;
    const physics = state === "PLAYING" && !isCounting;
    const scrollSpeed = physics ? 4.0 : 0.8;

    let nf = 0,
      sandH = 80;
    if (bgRef.current) {
      nf = bgRef.current.update(elapsed, delta, scrollSpeed, streak, pressRef.current / DANGER_THRESHOLD);
      bgRef.current.draw(ctx, nf);
      sandH = bgRef.current.sandHeight;
    }
    if (coralsRef.current) {
      coralsRef.current.update(scrollSpeed);
      coralsRef.current.draw(ctx, nf, c.height - sandH);
    }
    if (grassRef.current && playerRef.current) {
      grassRef.current.update(playerRef.current.x, playerRef.current.y, delta);
      grassRef.current.draw(ctx);
    }

    if (playerRef.current) {
      // Danger pressure check — uses pressRef.current directly
      if (
        isConnRef.current &&
        pressRef.current >= DANGER_THRESHOLD &&
        physics
      ) {
        setFailReason("pressure");
        setGs("SOFT_FAIL");
      }
      if (physics) {
        playerRef.current.update(
          swimUp(),
          delta,
          sandH,
          particlesRef.current,
          nf,
        );
        taskTimerRef.current += delta;
        if (taskTimerRef.current > 2000) {
          spawnPearls(c.width, c.height);
          taskTimerRef.current = 0;
        }
        if (playerRef.current.status === "hit_floor") {
          bgRef.current?.triggerSiltCloud(playerRef.current.x, playerRef.current.y);
          setFailReason("floor");
          setGs("SOFT_FAIL");
        } else {
          (bgRef.current as any)?.clearSiltCloud?.();
        }
        if (playerRef.current.status === "hit_ceiling") {
          setFailReason("ceiling");
          setGs("SOFT_FAIL");
        }
        pearlsRef.current.forEach((pearl) => {
          if (!pearl.collected && !pearl.markedForDeletion) {
            const dx = playerRef.current!.x - pearl.x,
              dy = playerRef.current!.y - pearl.y;
            if (
              Math.hypot(dx, dy) <
              playerRef.current!.radius + pearl.radius + 14
            )
              collectPearl(pearl);
          }
        });
        // Pressure display — reads pressRef.current directly
        setPressDisp(parseFloat(pressRef.current.toFixed(2)));
      } else if (state === "MENU" || isCounting) {
        playerRef.current.y = c.height / 2 + Math.sin(elapsed * 0.003) * 20;
        playerRef.current.velocity = 0;
        playerRef.current.rotation = 0;
      }
      playerRef.current.draw(ctx, nf);
    }

    for (let i = pearlsRef.current.length - 1; i >= 0; i--) {
      const p = pearlsRef.current[i];
      if (physics) p.update(
        4 + scrollSpeed * 0.5,
        playerRef.current?.x ?? -999,
        playerRef.current?.y ?? -999,
      );
      p.draw(ctx);
      if (p.markedForDeletion) {
        if (!p.collected && p.isTarget) metricsRef.current.missed++;
        pearlsRef.current.splice(i, 1);
      }
    }
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      if (physics) p.update();
      p.draw(ctx);
      if (p.markedForDeletion) particlesRef.current.splice(i, 1);
    }

    rafRef.current = requestAnimationFrame(loop);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const spawnPearls = (w: number, h: number) => {
    const top = Math.random() > 0.5;
    pearlsRef.current.push(
      new Pearl(
        w + 50,
        h * 0.3,
        top ? currentTask.targetColor : "#FF4500",
        top,
      ),
    );
    pearlsRef.current.push(
      new Pearl(
        w + 50,
        h * 0.72,
        !top ? currentTask.targetColor : "#FF4500",
        !top,
      ),
    );
    // Record spawn time so swimUp() can compute reaction time
    lastSpawnTimeRef.current = Date.now();
  };

  const triggerFeedback = (text: string, color: string) => {
    setFeedback({ text, color });
    setTimeout(() => setFeedback(null), 2000);
  };

  const collectPearl = (pearl: Pearl) => {
    pearl.collect();
    metricsRef.current.accuracy.total++;
    if (pearl.isTarget) {
      metricsRef.current.accuracy.correct++;
      setScore((p) => p + 100);
      setStreak((p) => {
        const n = p + 1;
        if (n % 5 === 0) triggerFeedback(`${n} Streak! 🔥`, "#FFD700");
        else if (n === 3) triggerFeedback("Great Rhythm!", "#2DD4BF");
        return n;
      });
      for (let i = 0; i < 8; i++)
        particlesRef.current.push(new Particle(pearl.x, pearl.y, 1, true));
    } else {
      setScore((p) => Math.max(0, p - 50));
      setStreak(0);
      triggerFeedback("Oops! Focus on Blue!", "#FF6B6B");
      bgRef.current?.triggerErrorFlash();
      for (let i = 0; i < 12; i++) {
        const p = new Particle(pearl.x, pearl.y, 1.5, true);
        p.color = "rgba(255,69,0,0.8)";
        particlesRef.current.push(p);
      }
    }
  };

  const resumeGame = () => {
    const c = canvasRef.current;
    if (playerRef.current && c) {
      playerRef.current.y = c.height / 2;
      playerRef.current.velocity = 0;
      playerRef.current.status = "swimming";
      playerRef.current.floorTime = 0;
      playerRef.current.surfaceTime = 0;
    }
    (bgRef.current as any)?.clearSiltCloud?.();
    setFailReason(null);
    setGs("PLAYING");
  };

  const handleExit = () => {
    if (gsRef.current === "PLAYING") setGs("SOFT_FAIL");
    setShowExit(true);
  };
  const cancelExit = () => {
    setShowExit(false);
    if (gsRef.current === "SOFT_FAIL" && !failReason) setGs("PLAYING");
  };

  // ── Save & exit — writes all real metrics to Firestore ───────────────────
  const handleSaveAndExit = async () => {
    try {
      const m = metricsRef.current;
      const durationSeconds = Math.floor(
        (Date.now() - startRef.current) / 1000,
      );

      // Clinical metric calculations (unchanged from original)
      const accuracy = calculateCognitiveAccuracy(
        m.accuracy.correct,
        m.accuracy.total,
      );
      const peakForce = getPeakGripForce(m.jumpPressures);
      const enduranceDrop = calculateEnduranceDrop(m.jumpPressures);

      // Average reaction time across all recorded squeezes
      const avgReactionTime =
        m.reactionTimes.length > 0
          ? Math.round(
              m.reactionTimes.reduce((a, b) => a + b, 0) /
                m.reactionTimes.length,
            )
          : 0;

      // Real values from auth + protocol; fallbacks keep this callable during testing
      const uid = user?.uid ?? "dev_test_user";
      const protocolId = protocol?.id ?? "dev_test_protocol";
      const gameId = protocol?.gameId ?? "synapse_racer";
      const level = protocol?.level ?? 1;
      const targetHand = (
        protocol?.targetHand === "left" ? "left" : "right"
      ) as "left" | "right";

      await saveGameSession({
        userId: uid,
        protocolId: protocolId,
        gameId: gameId,
        level: level,
        timestamp: Timestamp.now(),
        durationSeconds: durationSeconds,
        targetHand: targetHand,
        metrics: {
          cognitiveAccuracyPercent: accuracy,
          peakGripForce: peakForce,
          muscleEnduranceDropPercent: enduranceDrop,
          reactionTimeMs: avgReactionTime,
          rawSensorData: m.jumpPressures, // stored; never sent to Gemini raw
        },
      });

      // If gameplay started from a scheduled item, mark it completed.
      if (scheduledSessionId) {
        await updateSessionStatus(scheduledSessionId, "completed");
      }

      // Award XP only to real logged-in users with meaningful sessions
      if (user?.uid && durationSeconds > 30) {
        const xp = 30 + level * 10; // L1=40 … L5=80
        await addXpToPatient(user.uid, xp);
      }

      console.log(
        `✅ Session saved — uid:${uid} | protocol:${protocolId} | level:${level} | duration:${durationSeconds}s`,
      );
      console.log(
        `   accuracy:${accuracy}% | peakForce:${peakForce} | endurance:${enduranceDrop}% | avgReaction:${avgReactionTime}ms`,
      );
      console.log(`   rawSensorData: [${m.jumpPressures.join(", ")}]`);

      router.push("/patients/home");
    } catch (error) {
      console.error("Failed to save session:", error);
      router.push("/patients/home");
    }
  };

  const pInfo = pressureColor(pressDisp);
  const pctBar = Math.min(100, (pressDisp / DANGER_THRESHOLD) * 100);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div id="synapse-game-root">
      <style>{GAME_CSS}</style>
      <canvas ref={canvasRef} />

      {/* ── DEVICE BADGE ── */}
      <div style={{ position: "absolute", top: 14, right: 14, zIndex: 60 }}>
        {isConnected ? (
          <button
            onClick={disconnectSerial}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "rgba(16,200,128,0.13)",
              border: "1px solid rgba(52,211,153,0.40)",
              padding: "7px 15px",
              borderRadius: 999,
              cursor: "pointer",
              backdropFilter: "blur(10px)",
            }}>
            <Wifi size={13} style={{ color: "#34d399" }} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                color: "#34d399",
              }}>
              Connected
            </span>
          </button>
        ) : (
          <button
            onClick={connectSerial}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "rgba(239,68,68,0.13)",
              border: "1px solid rgba(248,113,113,0.40)",
              padding: "7px 15px",
              borderRadius: 999,
              cursor: "pointer",
              backdropFilter: "blur(10px)",
            }}>
            <WifiOff size={13} style={{ color: "#f87171" }} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                color: "#f87171",
              }}>
              Connect Device
            </span>
          </button>
        )}
      </div>

      {/* ── EXIT ── */}
      <button
        onClick={handleExit}
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          gap: 7,
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.14)",
          padding: "8px 16px",
          borderRadius: 999,
          color: "#fff",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.11em",
          textTransform: "uppercase",
          cursor: "pointer",
          backdropFilter: "blur(10px)",
          transition: "background .2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(255,255,255,0.14)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "rgba(255,255,255,0.07)")
        }>
        <RotateCcw size={13} /> EXIT
      </button>

      {/* ── MENU ── */}
      {uiState === "MENU" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(2,8,20,0.62)",
            backdropFilter: "blur(3px)",
            zIndex: 20,
          }}>
          <div
            style={{
              animation: "menuin 0.48s cubic-bezier(0.22,1,0.36,1) both",
              background: "rgba(4,12,28,0.94)",
              border: "1.5px solid rgba(45,212,191,0.30)",
              borderRadius: 26,
              padding: "38px 42px",
              maxWidth: 490,
              width: "90%",
              textAlign: "center",
              backdropFilter: "blur(22px)",
              boxShadow:
                "0 0 70px rgba(45,212,191,0.10),0 32px 80px rgba(0,0,0,0.60)",
              position: "relative",
              overflow: "hidden",
            }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: "32%",
                background:
                  "linear-gradient(to bottom,transparent,rgba(45,212,191,0.04),transparent)",
                animation: "scanline 7s linear infinite",
                pointerEvents: "none",
              }}
            />
            <h1
              style={{
                fontSize: 33,
                fontWeight: 900,
                color: "#00FFFF",
                letterSpacing: "0.07em",
                margin: "0 0 5px",
                textShadow: "0 0 28px rgba(0,255,255,0.40)",
              }}>
              SYNAPSE RACER
            </h1>
            <p
              style={{
                color: "rgba(255,255,255,0.28)",
                fontSize: 10,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                margin: "0 0 26px",
              }}>
              Protocol A · Motor &amp; Cognitive
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 11,
                marginBottom: 26,
                textAlign: "left",
              }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14,
                  padding: "14px 16px",
                }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    marginBottom: 10,
                  }}>
                  <Hand size={17} style={{ color: "#2DD4BF" }} />
                  <span
                    style={{ color: "#fff", fontWeight: 700, fontSize: 12 }}>
                    CONTROLS
                  </span>
                </div>
                {isConnected ? (
                  <>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.58)",
                        fontSize: 11.5,
                        lineHeight: 1.65,
                        margin: 0,
                      }}>
                      Squeeze to swim up.
                    </p>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.58)",
                        fontSize: 11.5,
                        lineHeight: 1.65,
                        margin: 0,
                      }}>
                      Release to dive.
                    </p>
                    <p
                      style={{
                        color: "#FACC15",
                        fontSize: 10.5,
                        marginTop: 5,
                      }}>
                      Don't over-squeeze!
                    </p>
                  </>
                ) : (
                  <>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.58)",
                        fontSize: 11.5,
                        lineHeight: 1.65,
                        margin: 0,
                      }}>
                      Connect the sensor
                    </p>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.58)",
                        fontSize: 11.5,
                        lineHeight: 1.65,
                        margin: 0,
                      }}>
                      to begin therapy.
                    </p>
                    <p
                      style={{
                        color: "rgba(255,100,100,0.70)",
                        fontSize: 10.5,
                        marginTop: 5,
                      }}>
                      Hardware required.
                    </p>
                  </>
                )}
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14,
                  padding: "14px 16px",
                }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    marginBottom: 10,
                  }}>
                  <Zap size={17} style={{ color: "#FFD700" }} />
                  <span
                    style={{ color: "#fff", fontWeight: 700, fontSize: 12 }}>
                    GOAL
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    marginBottom: 6,
                  }}>
                  <div
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: "#00BFFF",
                      boxShadow: "0 0 7px #00BFFF",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{ color: "rgba(255,255,255,0.58)", fontSize: 11.5 }}>
                    Collect Blue (+100)
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: "#FF4500",
                      boxShadow: "0 0 7px #FF4500",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{ color: "rgba(255,255,255,0.58)", fontSize: 11.5 }}>
                    Avoid Red (−50)
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={startSession}
              disabled={false} // UNLOCKED FOR TESTING
              style={{
                position: "relative",
                overflow: "hidden",
                background: isConnected ? "#2DD4BF" : "rgba(99,102,241,0.8)", // Purple if testing
                color: isConnected ? "#061422" : "#fff",
                border: "none",
                borderRadius: 999,
                padding: "15px 50px",
                fontSize: 17,
                fontWeight: 900,
                letterSpacing: "0.07em",
                cursor: "pointer",
                boxShadow: isConnected
                  ? "0 0 38px rgba(45,212,191,0.50)"
                  : "0 0 38px rgba(99,102,241,0.50)",
                display: "inline-flex",
                alignItems: "center",
                gap: 11,
                transition: "transform .14s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
              <Play
                size={20}
                fill={isConnected ? "#061422" : "#fff"}
                style={{ position: "relative", zIndex: 1 }}
              />
              <span style={{ position: "relative", zIndex: 1 }}>
                {isConnected ? "START MISSION" : "TEST (KEYBOARD MODE)"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── SOFT FAIL ── */}
      {uiState === "SOFT_FAIL" && failReason && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(1,5,14,0.75)",
            backdropFilter: "blur(7px)",
            zIndex: 20,
          }}>
          <div
            style={{
              background: "rgba(5,12,28,0.96)",
              border: "1.5px solid rgba(239,68,68,0.40)",
              borderRadius: 26,
              padding: "38px 48px",
              textAlign: "center",
              boxShadow: "0 0 44px rgba(239,68,68,0.10)",
              animation: "menuin 0.32s ease both",
            }}>
            <div style={{ fontSize: 46, marginBottom: 10 }}>
              {failReason === "floor"
                ? "🐟"
                : failReason === "pressure"
                  ? "💥"
                  : "🦅"}
            </div>
            <h2
              style={{
                color: "#fff",
                fontSize: 21,
                fontWeight: 900,
                marginBottom: 7,
                marginTop: 0,
              }}>
              {failReason === "floor"
                ? "The Fish is Sleeping…"
                : failReason === "pressure"
                  ? "TOO MUCH PRESSURE!"
                  : "Too High!"}
            </h2>
            <p style={{ color: "#2DD4BF", marginBottom: 26, fontSize: 13.5 }}>
              {failReason === "floor"
                ? "Squeeze harder to wake up!"
                : failReason === "pressure"
                  ? "Gently! Don't crush the sensor."
                  : "Relax your grip to dive."}
            </p>
            <button
              onClick={resumeGame}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                background: "#2DD4BF",
                color: "#061422",
                border: "none",
                borderRadius: 999,
                padding: "12px 34px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 0 22px rgba(45,212,191,0.40)",
              }}>
              <RotateCcw size={16} /> Resume
            </button>
          </div>
        </div>
      )}

      {/* ── PLAYING HUD ── */}
      {uiState === "PLAYING" && (
        <>
          <div
            style={{
              position: "absolute",
              top: 14,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 10,
              zIndex: 30,
              pointerEvents: "none",
              animation: "hudin 0.38s ease both",
            }}>
            <div
              style={{
                background: "rgba(4,12,28,0.74)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(45,212,191,0.22)",
                borderRadius: 999,
                padding: "7px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxShadow: "0 4px 22px rgba(0,0,0,0.38)",
              }}>
              <span
                style={{
                  fontSize: 8.5,
                  color: "#2DD4BF",
                  fontWeight: 700,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                }}>
                Score
              </span>
              <span
                style={{
                  fontSize: 24,
                  fontFamily: "monospace",
                  fontWeight: 900,
                  color: "#fff",
                  lineHeight: 1.1,
                }}>
                {score.toString().padStart(4, "0")}
              </span>
            </div>
            <div
              style={{
                background: "rgba(4,12,28,0.74)",
                backdropFilter: "blur(16px)",
                border: `1px solid ${streak > 5 ? "rgba(250,204,21,0.44)" : "rgba(255,255,255,0.10)"}`,
                borderRadius: 999,
                padding: "7px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxShadow: "0 4px 22px rgba(0,0,0,0.38)",
                transition: "border-color .35s",
              }}>
              <span
                style={{
                  fontSize: 8.5,
                  color: "rgba(255,255,255,0.36)",
                  fontWeight: 700,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                }}>
                Streak
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  lineHeight: 1.1,
                }}>
                <Zap
                  size={13}
                  style={{
                    color: streak > 5 ? "#FACC15" : "#4B5563",
                    fill: streak > 5 ? "#FACC15" : "none",
                    transition: "color .35s",
                  }}
                />
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: streak > 5 ? "#FACC15" : "#fff",
                    transition: "color .35s",
                  }}>
                  {streak}
                </span>
              </div>
            </div>
          </div>

          {/* Pressure gauge — always shown when playing (hardware required to play) */}
          <div
            style={{
              position: "absolute",
              bottom: 18,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 30,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              pointerEvents: "none",
            }}>
            <span
              style={{
                fontSize: 8.5,
                color: "rgba(255,255,255,0.30)",
                fontWeight: 700,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
              }}>
              Grip Pressure
            </span>
            <div
              style={{
                width: 190,
                height: 9,
                background: "rgba(255,255,255,0.07)",
                borderRadius: 999,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.10)",
              }}>
              <div
                style={{
                  height: "100%",
                  width: `${pctBar}%`,
                  background: pInfo.hex,
                  borderRadius: 999,
                  transition: "width .08s,background .18s",
                  boxShadow: `0 0 9px ${pInfo.hex}`,
                }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span
                style={{
                  fontSize: 9.5,
                  fontFamily: "monospace",
                  color: pInfo.hex,
                  fontWeight: 700,
                }}>
                {pressDisp.toFixed(2)} V
              </span>
              <span
                style={{
                  fontSize: 7.5,
                  color: pInfo.hex,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  background: `${pInfo.hex}1a`,
                  border: `1px solid ${pInfo.hex}38`,
                  borderRadius: 4,
                  padding: "1px 5px",
                }}>
                {pInfo.label}
              </span>
            </div>
          </div>

          {feedback && (
            <div
              style={{
                position: "absolute",
                top: "19%",
                left: "50%",
                zIndex: 40,
                animation: "feedin 2s ease-in-out both",
                pointerEvents: "none",
              }}>
              <div
                style={{
                  background: "rgba(4,12,28,0.93)",
                  color: feedback.color,
                  border: `1px solid ${feedback.color}48`,
                  borderRadius: 999,
                  padding: "9px 26px",
                  fontWeight: 700,
                  fontSize: 15,
                  backdropFilter: "blur(16px)",
                  boxShadow: `0 0 22px ${feedback.color}38`,
                  whiteSpace: "nowrap",
                }}>
                {feedback.text}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── COUNTDOWN ── */}
      {uiCd !== null && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            zIndex: 50,
            fontSize: uiCd === "GO!" ? "6.5rem" : "9.5rem",
            fontWeight: 900,
            color: uiCd === "GO!" ? "#2DD4BF" : "#00FFFF",
            textShadow: `0 0 55px ${uiCd === "GO!" ? "rgba(45,212,191,0.80)" : "rgba(0,255,255,0.80)"}`,
            animation:
              uiCd === "GO!"
                ? "goburst 0.92s ease-out both"
                : "cdpop 0.48s cubic-bezier(0.34,1.56,0.64,1) both",
            userSelect: "none",
            pointerEvents: "none",
          }}>
          {uiCd}
        </div>
      )}

      {/* ── EXIT CONFIRM ── */}
      {showExit && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(1,5,14,0.90)",
            backdropFilter: "blur(12px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 100,
          }}>
          <div
            style={{
              background: "rgba(6,16,32,0.98)",
              padding: "34px 46px",
              borderRadius: 22,
              border: "1px solid rgba(255,255,255,0.09)",
              textAlign: "center",
              boxShadow: "0 30px 80px rgba(0,0,0,0.70)",
              animation: "menuin 0.28s ease both",
            }}>
            <h3
              style={{
                color: "#fff",
                marginTop: 0,
                fontSize: 21,
                fontWeight: 700,
              }}>
              Pause Session?
            </h3>
            <p
              style={{
                color: "rgba(255,255,255,0.36)",
                fontSize: 12.5,
                marginBottom: 26,
              }}>
              Progress this session will be saved.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={cancelExit}
                style={{
                  padding: "11px 30px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "#fff",
                  borderRadius: 999,
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}>
                Resume
              </button>
              <button
                onClick={handleSaveAndExit}
                style={{
                  padding: "11px 30px",
                  background: "#EF4444",
                  border: "none",
                  color: "#fff",
                  borderRadius: 999,
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 0 20px rgba(239,68,68,0.40)",
                }}>
                Save & Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;