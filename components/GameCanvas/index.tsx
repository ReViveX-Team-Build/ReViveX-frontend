"use client";

import React, { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, RotateCcw } from "lucide-react"; 

// Imports
import { Player } from "../../util/game-core/SynapsePlayer";
import { SynapseBackground } from "../../util/game-core/SynapseBackground";
import { SeaGrass } from "../../util/game-core/SynapseSeaGrass";
import { Particle } from "../../util/game-core/SynapseParticles";
import { SynapseCorals } from "../../util/game-core/SynapseCorals";
import { Pearl, CognitiveTask } from "../../util/game-core/SynapseCognitive";

type CountdownValue = number | "GO!" | null;

interface ClinicalMetrics {
  accuracy: { correct: number; total: number };
}

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const router = useRouter();

  /* =================== GAME REFS (The Logic Fix) =================== */
  const playerRef = useRef<Player | null>(null);
  const bgRef = useRef<SynapseBackground | null>(null);
  const grassRef = useRef<SeaGrass | null>(null);
  const coralsRef = useRef<SynapseCorals | null>(null);
  
  const particlesRef = useRef<Particle[]>([]);
  const pearlsRef = useRef<Pearl[]>([]);
  
  const inputRef = useRef<boolean>(false);
  const taskTimerRef = useRef<number>(0);
  
  // CRITICAL FIX: The loop checks THIS, not the state
  const gameStateRef = useRef<"MENU" | "PLAYING" | "SOFT_FAIL">("MENU"); 
  const countdownRef = useRef<CountdownValue>(null); 

  /* =================== UI STATE (For Visuals Only) =================== */
  const [uiState, setUiState] = useState<"MENU" | "PLAYING" | "SOFT_FAIL">("MENU");
  const [uiCountdown, setUiCountdown] = useState<CountdownValue>(null);
  const [score, setScore] = useState(0);
  const [failReason, setFailReason] = useState<"floor" | "ceiling" | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  const [currentTask, setCurrentTask] = useState<CognitiveTask>({ instruction: "Collect BLUE", targetColor: "#00BFFF" });

  const metricsRef = useRef<ClinicalMetrics>({ accuracy: { correct: 0, total: 0 } });
  const startTimeRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);

  /* =================== STATE MANAGEMENT =================== */
  const setGameStatus = (status: "MENU" | "PLAYING" | "SOFT_FAIL") => {
      gameStateRef.current = status; 
      setUiState(status);            
  };

  const setCountdownStatus = (val: CountdownValue) => {
      countdownRef.current = val;    
      setUiCountdown(val);           
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
    setScore(0);
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

    // --- 1. ALWAYS DRAW BACKGROUND ---
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
    const physicsActive = (currentState === "PLAYING" && !isCountingDown);

    if (playerRef.current) {
        
        // A. PHYSICS UPDATE (Only when actually playing)
        if (physicsActive) {
            // CHANGED: Passed nightFactor to update logic
            playerRef.current.update(inputRef.current, delta, sandHeight, particlesRef.current, nightFactor);
            
            taskTimerRef.current += delta;
            if (taskTimerRef.current > 2000) {  
                spawnPearls(canvas.width, canvas.height);
                taskTimerRef.current = 0;
            }

            // Check Fail
            if (playerRef.current.status === "hit_floor") {
                setFailReason("floor");
                setGameStatus("SOFT_FAIL");
            } else if (playerRef.current.status === "hit_ceiling") {
                setFailReason("ceiling");
                setGameStatus("SOFT_FAIL");
            }

            pearlsRef.current.forEach(pearl => {
                if (!pearl.collected && !pearl.markedForDeletion) {
                    const dx = playerRef.current!.x - pearl.x;
                    const dy = playerRef.current!.y - pearl.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < playerRef.current!.radius + pearl.radius + 10) {
                        collectPearl(pearl);
                    }
                }
            });
        } 
        
        // B. MENU HOVER
        else if (currentState === "MENU" || isCountingDown) {
             // Manual Hover Animation (Sine Wave)
             playerRef.current.y = (canvas.height / 2) + Math.sin(elapsed * 0.003) * 20;
             playerRef.current.velocity = 0;
             playerRef.current.rotation = 0; // Keep fish straight
        }

        // CHANGED: Passed nightFactor to draw logic
        playerRef.current.draw(ctx, nightFactor);
    }

    // --- 3. DRAW PARTICLES & PEARLS ---
    pearlsRef.current.forEach(p => {
        if (physicsActive) p.update(4); 
        p.draw(ctx);
    });
    
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        if (physicsActive) p.update();
        p.draw(ctx);
        if (p.markedForDeletion) particlesRef.current.splice(i, 1);
    }

    // --- 4. DRAW TASK UI ---
    if (currentState === "PLAYING") {
        drawTaskUI(ctx, canvas.width);
    }

    // --- 5. TINT ---
    ctx.fillStyle = "rgba(0, 20, 40, 0.12)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    rafRef.current = requestAnimationFrame(loop);
  };

  /* =================== HELPERS =================== */
  const spawnPearls = (w: number, h: number) => {
      const isTopCorrect = Math.random() > 0.5;
      const wrongColor = currentTask.targetColor === "#00BFFF" ? "#FF4500" : "#00BFFF";
      
      const startX = w + 50;
      pearlsRef.current.push(new Pearl(startX, h * 0.3, isTopCorrect ? currentTask.targetColor : wrongColor, isTopCorrect));
      pearlsRef.current.push(new Pearl(startX, h * 0.7, !isTopCorrect ? currentTask.targetColor : wrongColor, !isTopCorrect));
  };

  const collectPearl = (pearl: Pearl) => {
      pearl.collected = true;
      metricsRef.current.accuracy.total++;
      if (pearl.isTarget) {
          metricsRef.current.accuracy.correct++;
          setScore(prev => prev + 100); 
          for(let i=0; i<8; i++) particlesRef.current.push(new Particle(pearl.x, pearl.y, 1, true));
      } 
  };

  const drawTaskUI = (ctx: CanvasRenderingContext2D, w: number) => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(w/2 - 150, 20, 300, 50, 25);
      else ctx.rect(w/2 - 150, 20, 300, 50);
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.font = "bold 20px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(currentTask.instruction, w/2, 52);
      ctx.fillStyle = currentTask.targetColor;
      ctx.beginPath();
      ctx.arc(w/2 + 100, 45, 10, 0, Math.PI*2);
      ctx.fill();
  };

  const resumeGame = () => {
      if (playerRef.current) {
          playerRef.current.y = 300; 
          playerRef.current.velocity = 0;
          playerRef.current.status = "swimming";
          // Reset Timers
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
      if (gameStateRef.current === "SOFT_FAIL" && !failReason) {
          setGameStatus("PLAYING");
      }
  };

  const confirmExit = () => {
      router.push('/patients/home');
  };

  /* =================== CONTROLS =================== */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); inputRef.current = true; } };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.code === "Space") inputRef.current = false; };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => { window.removeEventListener("keydown", handleKeyDown); window.removeEventListener("keyup", handleKeyUp); };
  }, []);

  return (
    <div style={styles.container}>
        <canvas ref={canvasRef} style={styles.canvas} />

        {uiState === "MENU" && (
            <div style={styles.overlay}>
                <h1 className="text-4xl font-bold text-[#00FFFF] mb-4">Synapse Racer</h1>
                <p className="text-gray-300 mb-8">Protocol A: Memory & Motor Control</p>
                <button onClick={startSession} style={styles.btnPrimary}>
                    <Play size={24} /> Start Session
                </button>
            </div>
        )}

        {uiState === "SOFT_FAIL" && failReason && (
            <div style={styles.overlay}>
                <div className="bg-[#0B1E33] p-8 rounded-3xl border border-[#2DD4BF] text-center shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {failReason === "floor" ? "🐟 The Fish is Sleeping..." : "🦅 Too High!"}
                    </h2>
                    <p className="text-[#2DD4BF] mb-6">
                        {failReason === "floor" ? "Squeeze harder to wake up!" : "Relax your grip to dive down."}
                    </p>
                    <button onClick={resumeGame} style={styles.btnPrimary}>
                        <RotateCcw size={20} /> Resume
                    </button>
                </div>
            </div>
        )}

        {uiState === "PLAYING" && (
            <div style={styles.hud}>
                <div className="text-[#2DD4BF] font-bold text-xl">Score: {score}</div>
                <div className="text-white opacity-50 text-sm">
                    Pearls: {metricsRef.current.accuracy.correct} / {metricsRef.current.accuracy.total}
                </div>
            </div>
        )}

        {uiCountdown !== null && (
            <div style={styles.countdown}>{uiCountdown}</div>
        )}

        {showExitConfirm && (
            <div style={styles.overlayFull}>
                <div style={styles.modalCard}>
                    <h3 style={{ color: 'white', marginTop: 0, fontSize: '1.5rem' }}>Pause Session?</h3>
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
                        <button onClick={cancelExit} style={{...styles.btnPrimary, background: 'transparent', border: '1px solid #555', color: '#fff', boxShadow: 'none'}}>Resume</button>
                        <button onClick={confirmExit} style={{...styles.btnPrimary, background: '#FF4500', boxShadow: '0 0 20px rgba(255, 69, 0, 0.4)'}}>Exit</button>
                    </div>
                </div>
            </div>
        )}

        <button onClick={handleBackClick} style={styles.backBtn}>⬅</button>
        
        <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '15px', fontSize: '0.9rem' }}>
            Hold <strong style={{color:'#00FFFF'}}>SPACE</strong> to Swim Up
        </p>
    </div>
  );
};

// --- STYLES ---
const styles: { [key: string]: React.CSSProperties } = {
    container: { position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', marginTop: '20px', flexDirection: 'column', alignItems: 'center' },
    canvas: { borderRadius: '20px', boxShadow: '0 0 50px rgba(45, 212, 191, 0.2)', border: '2px solid rgba(45, 212, 191, 0.3)', background: '#020c1b', maxWidth: '100%' },
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(2, 12, 27, 0.8)', backdropFilter: 'blur(5px)', borderRadius: '20px', zIndex: 20 },
    overlayFull: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(2, 12, 27, 0.9)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, borderRadius: '15px' },
    btnPrimary: { display: 'flex', gap: '10px', alignItems: 'center', padding: '15px 40px', background: '#2DD4BF', color: '#0B1E33', fontWeight: 'bold', fontSize: '18px', borderRadius: '50px', border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(45, 212, 191, 0.5)', transition: 'transform 0.1s' },
    hud: { position: 'absolute', top: '20px', right: '30px', textAlign: 'right', zIndex: 10 },
    countdown: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '8rem', fontWeight: '900', color: '#00FFFF', textShadow: '0 0 50px rgba(0, 255, 255, 0.8)', zIndex: 50, animation: 'pulse 0.5s infinite alternate' },
    modalCard: { background: 'rgba(20, 20, 30, 0.95)', padding: '30px 40px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' },
    backBtn: { position: 'absolute', top: '20px', left: '20px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '50%', width: '50px', height: '50px', cursor: 'pointer', color: 'white', fontSize: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)', zIndex: 30 }
};

export default GameCanvas;