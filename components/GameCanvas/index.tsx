"use client";

import React, { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
//  Import Icons for UI
import { Play, RotateCcw } from "lucide-react"; 

// Imports
import { Player } from "../../util/game-core/SynapsePlayer";
import { SynapseBackground } from "../../util/game-core/SynapseBackground";
import { SeaGrass } from "../../util/game-core/SynapseSeaGrass";
import { Particle } from "../../util/game-core/SynapseParticles";
import { SynapseCorals } from "../../util/game-core/SynapseCorals";
// Import Cognitive Logic
import { Pearl, CognitiveTask } from "../../util/game-core/SynapseCognitive";

type CountdownValue = number | "GO!" | null;

//  Interface for internal metrics
interface ClinicalMetrics {
  accuracy: { correct: number; total: number };
}

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const router = useRouter();

  /* =================== GAME OBJECTS =================== */
  const playerRef = useRef<Player | null>(null);
  const bgRef = useRef<SynapseBackground | null>(null);
  const grassRef = useRef<SeaGrass | null>(null);
  const coralsRef = useRef<SynapseCorals | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const inputRef = useRef<boolean>(false);

  //  Refs for Pearls and Task Timer
  const pearlsRef = useRef<Pearl[]>([]);
  const taskTimerRef = useRef<number>(0);

  // Metrics storage
  const metricsRef = useRef<ClinicalMetrics>({
    accuracy: { correct: 0, total: 0 },
  });

  /* =================== STATE =================== */
  const startTimeRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);

  //  Replaced simple 'gameOver' with robust State Machine
  const [gameState, setGameState] = useState<"MENU" | "PLAYING" | "SOFT_FAIL">("MENU");
  const [failReason, setFailReason] = useState<"floor" | "ceiling" | null>(null);
  
  // NEW: Task and Score State
  const [currentTask, setCurrentTask] = useState<CognitiveTask>({ instruction: "Collect BLUE", targetColor: "#00BFFF" });
  const [score, setScore] = useState(0);

  const [countdown, setCountdown] = useState<CountdownValue>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);

  /* =================== HANDLERS =================== */
  const handleBackClick = (): void => {
      // UPDATED: Pause logic uses Soft Fail state visually
      if (gameState === "PLAYING") {
          setGameState("SOFT_FAIL"); 
          setFailReason(null); // Just paused, not failed
          setShowExitConfirm(true);
      } else {
          setShowExitConfirm(true);
      }
  };

  const confirmExit = (): void => {
      router.push('/patients/home');
  };

  const cancelExit = (): void => {
      setShowExitConfirm(false);
      //  Resume only if we weren't actually dead
      if (gameState === "SOFT_FAIL" && failReason === null) {
          setGameState("PLAYING");
          lastFrameRef.current = performance.now();
          rafRef.current = requestAnimationFrame(loop);
      }
  };

  /* =================== START / INIT =================== */
  const initGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 1024;
    canvas.height = 600;

    // Initialize Objects
    playerRef.current = new Player(canvas.width, canvas.height);
    bgRef.current = new SynapseBackground(canvas.width, canvas.height);
    grassRef.current = new SeaGrass(canvas.width, canvas.height);
    coralsRef.current = new SynapseCorals(canvas.width, canvas.height);
    
    //  Reset Arrays
    particlesRef.current = [];
    pearlsRef.current = [];

    //  Reset Metrics
    setScore(0);
    metricsRef.current = { accuracy: { correct: 0, total: 0 } };
    setFailReason(null);

    startTimeRef.current = Date.now();
    lastFrameRef.current = performance.now();

    // Start Countdown
    setCountdown(3);
    let count = 3;
    if (countdownTimer.current) clearInterval(countdownTimer.current);

    countdownTimer.current = setInterval(() => {
      count--;
      if (count > 0) setCountdown(count);
      else if (count === 0) setCountdown("GO!");
      else {
        setCountdown(null);
        if (countdownTimer.current) clearInterval(countdownTimer.current);
        // UPDATED: Set state to PLAYING explicitly
        setGameState("PLAYING");
        rafRef.current = requestAnimationFrame(loop);
      }
    }, 900);
  };

  /* =================== MAIN GAME LOOP =================== */
  const loop = (now: number) => {
    //  Check gameState instead of boolean flags
    if (gameState !== "PLAYING") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const delta = Math.min(32, now - lastFrameRef.current);
    lastFrameRef.current = now;
    const elapsed = Date.now() - startTimeRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Background
    let nightFactor = 0;
    let sandHeight = 50;
    if (bgRef.current) {
        nightFactor = bgRef.current.update(elapsed);
        bgRef.current.draw(ctx, nightFactor);
        sandHeight = bgRef.current.sandHeight;
    }

    // 2. Corals
    if (coralsRef.current) {
        coralsRef.current.update();
        coralsRef.current.draw(ctx, nightFactor);
    }

    // 3. Sea Grass
    if (grassRef.current && playerRef.current) {
      grassRef.current.update(playerRef.current.x, playerRef.current.y, delta);
      grassRef.current.draw(ctx);
    }

    // 4.  Spawn Pearls Logic
    taskTimerRef.current += delta;
    if (taskTimerRef.current > 3000) { // Every 3 seconds
        spawnPearls(canvas.width, canvas.height);
        taskTimerRef.current = 0;
    }

    // 5. Particles (Bubbles)
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.update();
      p.draw(ctx);
      if (p.markedForDeletion) particlesRef.current.splice(i, 1);
    }

    // 6. Player Logic
    if (playerRef.current) {
      //  Pass 'particlesRef.current' so Player can spawn bubbles
      playerRef.current.update(inputRef.current, delta, sandHeight, particlesRef.current);
      playerRef.current.draw(ctx);
      
      // Check for Soft Failures (Nap / Surface)
      if (playerRef.current.status === "hit_floor") {
          setFailReason("floor");
          setGameState("SOFT_FAIL");
          return; // Stop Loop
      }
      if (playerRef.current.status === "hit_ceiling") {
          setFailReason("ceiling");
          setGameState("SOFT_FAIL");
          return; // Stop Loop
      }

      // Pearl Collision Check
      pearlsRef.current.forEach(pearl => {
          if (!pearl.collected && !pearl.markedForDeletion) {
              const dx = playerRef.current!.x - pearl.x;
              const dy = playerRef.current!.y - pearl.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              
              // Collision radius check
              if (dist < playerRef.current!.radius + pearl.radius) {
                  collectPearl(pearl);
              }
          }
      });
    }

    // 7.  Draw Pearls
    for (let i = pearlsRef.current.length - 1; i >= 0; i--) {
        const p = pearlsRef.current[i];
        p.update(3); // Scroll speed
        p.draw(ctx);
        if (p.markedForDeletion) pearlsRef.current.splice(i, 1);
    }

    // 8. NEW: Draw Task UI (The instructions box)
    drawTaskUI(ctx, canvas.width);

    // 9. Overlay Tint
    ctx.fillStyle = "rgba(0, 20, 40, 0.12)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    rafRef.current = requestAnimationFrame(loop);
  };

  /* =================== HELPER FUNCTIONS  =================== */

  // NEW: Spawns one correct pearl and one distractor
  const spawnPearls = (w: number, h: number) => {
      const isTopCorrect = Math.random() > 0.5;
      const wrongColor = currentTask.targetColor === "#00BFFF" ? "#FF4500" : "#00BFFF";

      const topY = h * 0.3;
      const botY = h * 0.7;

      pearlsRef.current.push(new Pearl(w, topY, isTopCorrect ? currentTask.targetColor : wrongColor, isTopCorrect));
      pearlsRef.current.push(new Pearl(w, botY, !isTopCorrect ? currentTask.targetColor : wrongColor, !isTopCorrect));
  };

  //  Handles score and particle burst on collection
  const collectPearl = (pearl: Pearl) => {
      pearl.collected = true;
      metricsRef.current.accuracy.total++;
      
      if (pearl.isTarget) {
          // Correct
          metricsRef.current.accuracy.correct++;
          setScore(prev => prev + 100);
          // Spawn "Happy" particles
          for(let i=0; i<8; i++) {
              particlesRef.current.push(new Particle(pearl.x, pearl.y, 1, true));
          }
      } 
  };

  //  Draws the instruction box at top
  const drawTaskUI = (ctx: CanvasRenderingContext2D, w: number) => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.beginPath();
      if (ctx.roundRect) {
         ctx.roundRect(w/2 - 150, 20, 300, 50, 25);
      } else {
         ctx.rect(w/2 - 150, 20, 300, 50);
      }
      ctx.fill();
      
      ctx.fillStyle = "white";
      ctx.font = "bold 20px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(currentTask.instruction, w/2, 52);

      // Draw color dot
      ctx.fillStyle = currentTask.targetColor;
      ctx.beginPath();
      ctx.arc(w/2 + 100, 45, 10, 0, Math.PI*2);
      ctx.fill();
  };

  //  Resumes game from Soft Fail
  const resumeGame = () => {
      if (playerRef.current) {
          playerRef.current.y = 300; 
          playerRef.current.velocity = 0;
          playerRef.current.status = "swimming";
          playerRef.current.airTime = 0;
          playerRef.current.floorTime = 0;
      }
      setFailReason(null);
      setGameState("PLAYING");
      lastFrameRef.current = performance.now();
      rafRef.current = requestAnimationFrame(loop);
  };

  /* =================== EFFECTS =================== */
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.code === "Space") inputRef.current = true; };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.code === "Space") inputRef.current = false; };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => { 
        window.removeEventListener("keydown", handleKeyDown); 
        window.removeEventListener("keyup", handleKeyUp); 
    };
  }, []);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, []);

  return (
    <div style={styles.container}>
        <canvas ref={canvasRef} style={styles.canvas} />

        {/* --- 1. START MENU --- */}
        {gameState === "MENU" && (
            <div style={styles.overlay}>
                <h1 className="text-4xl font-bold text-[#00FFFF] mb-4">Synapse Racer</h1>
                <p className="text-gray-300 mb-8">Protocol A: Memory & Motor Control</p>
                <button onClick={initGame} style={styles.btnPrimary}>
                    <Play size={24} /> Start Session
                </button>
            </div>
        )}

        {/* --- 2. SOFT FAIL SCREEN  --- */}
        {gameState === "SOFT_FAIL" && failReason && (
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

        {/* --- 3. HUD  --- */}
        {gameState === "PLAYING" && (
            <div style={styles.hud}>
                <div className="text-[#2DD4BF] font-bold text-xl">Score: {score}</div>
                <div className="text-white opacity-50 text-sm">
                    Pearls: {metricsRef.current.accuracy.correct} / {metricsRef.current.accuracy.total}
                </div>
            </div>
        )}

        {/* --- 4. COUNTDOWN --- */}
        {countdown !== null && (
            <div style={styles.countdown}>
                {countdown}
            </div>
        )}

        {/* --- 5. EXIT MODAL --- */}
        {showExitConfirm && (
            <div style={styles.overlayFull}>
                <div style={styles.modalCard}>
                    <h3 style={{ color: 'white', marginTop: 0, fontSize: '1.5rem' }}>Pause Session?</h3>
                    <p style={{ color: '#aaa', marginBottom: '30px' }}>Your progress is saved.</p>
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                        <button onClick={cancelExit} style={{...styles.btnPrimary, background: 'transparent', border: '1px solid #555', color: '#fff', boxShadow: 'none'}}>
                            Resume
                        </button>
                        <button onClick={confirmExit} style={{...styles.btnPrimary, background: '#FF4500', boxShadow: '0 0 20px rgba(255, 69, 0, 0.4)'}}>
                            Exit
                        </button>
                    </div>
                </div>
            </div>
        )}

        <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '15px', fontSize: '0.9rem' }}>
            Hold <strong style={{color:'#00FFFF'}}>SPACE</strong> to Swim Up
        </p>
    </div>
  );
};

// --- STYLES ---
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        position: 'relative',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        marginTop: '20px',
        flexDirection: 'column',
        alignItems: 'center',
    },
    canvas: {
        borderRadius: '20px',
        boxShadow: '0 0 50px rgba(45, 212, 191, 0.2)',
        border: '2px solid rgba(45, 212, 191, 0.3)',
        background: '#020c1b',
        maxWidth: '100%'
    },
    overlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(2, 12, 27, 0.8)',
        backdropFilter: 'blur(5px)',
        borderRadius: '20px',
        zIndex: 20
    },
    overlayFull: {
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(2, 12, 27, 0.85)', 
        backdropFilter: 'blur(8px)', 
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        zIndex: 100, borderRadius: '15px', 
    },
    btnPrimary: {
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        padding: '15px 40px',
        background: '#2DD4BF',
        color: '#0B1E33',
        fontWeight: 'bold',
        fontSize: '18px',
        borderRadius: '50px',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 0 20px rgba(45, 212, 191, 0.5)',
        transition: 'transform 0.1s',
    },
    hud: {
        position: 'absolute',
        top: '20px',
        right: '30px',
        textAlign: 'right',
        zIndex: 10
    },
    countdown: {
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        fontSize: '8rem', fontWeight: '900', color: '#00FFFF', 
        textShadow: '0 0 50px rgba(0, 255, 255, 0.8)', zIndex: 50,
        animation: 'pulse 0.5s infinite alternate'
    },
    modalCard: {
        background: 'rgba(20, 20, 30, 0.95)',
        padding: '30px 40px',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    }
};

export default GameCanvas;