"use client";

import React, { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Imports
import { Player } from "../../util/game-core/SynapsePlayer";
import { SynapseBackground } from "../../util/game-core/SyanpseBackground";
import { SeaGrass } from "../../util/game-core/SynapseSeaGrass";
import { Particle } from "../../util/game-core/SynapseParticles";
import { SynapseCorals } from "../../util/game-core/SynapseCorals";

type CountdownValue = number | "GO!" | null;

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null); // Animation Frame ID
  const router = useRouter();

  /* =================== GAME OBJECTS =================== */
  const playerRef = useRef<Player | null>(null);
  const bgRef = useRef<SynapseBackground | null>(null);
  const grassRef = useRef<SeaGrass | null>(null);
  const coralsRef = useRef<SynapseCorals | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const inputRef = useRef<boolean>(false);

  /* =================== STATE =================== */
  const startTimeRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);

  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverMsg, setGameOverMsg] = useState("");
  const [warningMsg, setWarningMsg] = useState("");
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [countdown, setCountdown] = useState<CountdownValue>(null);

  const countdownTimer = useRef<NodeJS.Timeout | null>(null);

  /* =================== HANDLERS =================== */
  // These must be OUTSIDE the loop
  const handleBackClick = (): void => {
      setIsPaused(true); 
      setShowExitConfirm(true); 
  };

  const confirmExit = (): void => {
      router.push('/patients/home');
  };

  const cancelExit = (): void => {
      setShowExitConfirm(false);
      setIsPaused(false); 
      // Restart the loop
      if (!gameOver) {
          lastFrameRef.current = performance.now();
          rafRef.current = requestAnimationFrame(loop);
      }
  };

  /* =================== START / RESET =================== */
  const startGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set Resolution
    canvas.width = 1024;
    canvas.height = 600;

    // Initialize Objects
    playerRef.current = new Player(canvas.width, canvas.height);
    bgRef.current = new SynapseBackground(canvas.width, canvas.height);
    coralsRef.current = new SynapseCorals(canvas.width, canvas.height);
    grassRef.current = new SeaGrass(canvas.width, canvas.height);
    particlesRef.current = [];

    // Reset State
    setGameOver(false);
    setGameOverMsg("");
    setWarningMsg("");
    setIsPaused(false);

    startTimeRef.current = Date.now();
    lastFrameRef.current = performance.now();

    // Clear previous timers
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);

    // Initial Draw (Static)
    const ctx = canvas.getContext("2d");
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        bgRef.current?.draw(ctx, 0);
        grassRef.current?.draw(ctx);
        playerRef.current?.draw(ctx);
    }

    // Start Countdown
    setCountdown(3);
    let count = 3;

    countdownTimer.current = setInterval(() => {
      count--;
      if (count > 0) setCountdown(count);
      else if (count === 0) setCountdown("GO!");
      else {
        setCountdown(null);
        if (countdownTimer.current) clearInterval(countdownTimer.current);
        // Start the Loop
        rafRef.current = requestAnimationFrame(loop);
      }
    }, 900);
  };

  /* =================== MAIN GAME LOOP =================== */
  const loop = (now: number) => {
    // Stop if paused or over
    if (isPaused || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate Delta Time
    const delta = Math.min(32, now - lastFrameRef.current);
    lastFrameRef.current = now;

    const elapsed = Date.now() - startTimeRef.current;

    // Clear Screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* --- UPDATE & DRAW --- */
    
    // 1. Background (Returns nightFactor for lighting)
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
      grassRef.current.update(
        playerRef.current.x,
        playerRef.current.y,
        delta
      );
      grassRef.current.draw(ctx);
    }

    // 4. Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.update();
      p.draw(ctx);
      if (p.markedForDeletion) particlesRef.current.splice(i, 1);
    }

    // 5. Player
    const player = playerRef.current;
    if (player) {
      player.update(inputRef.current, delta, sandHeight);
      player.draw(ctx);
      
      // Spawn bubbles/particles from player
      if (Math.random() > 0.8) {
          particlesRef.current.push(new Particle(player.x, player.y));
      }

      // Check Death
      if (player.isDead) {
        setGameOver(true);
        setGameOverMsg(
          player.deathReason === "dried_out"
            ? "Fish need water to survive 🐟"
            : "You hit the ocean floor 🦀"
        );
        return; // Stop the loop here
      }

      // Warnings
      if (player.status === "hit_floor")
        setWarningMsg("Careful! Crabs ahead 🦀");
      else if (player.status === "hit_ceiling")
        setWarningMsg("Too high! 🦅");
      else setWarningMsg("");
    }

    // 6. Overlay Effect (Underwater Tint)
    ctx.fillStyle = "rgba(0, 20, 40, 0.12)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Request Next Frame
    rafRef.current = requestAnimationFrame(loop);
  };

  /* =================== EFFECTS =================== */
  
  // 1. Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => { 
        if (e.code === "Space") { 
            e.preventDefault(); 
            inputRef.current = true; 
        } 
    };
    const handleKeyUp = (e: KeyboardEvent): void => { 
        if (e.code === "Space") inputRef.current = false; 
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => { 
        window.removeEventListener("keydown", handleKeyDown); 
        window.removeEventListener("keyup", handleKeyUp); 
    };
  }, []);

  // 2. Lifecycle (Start/Cleanup)
  useEffect(() => {
    startGame();
    return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, []);

  return (
    <div style={styles.container}>
        <h2 style={{ color: 'rgba(255,255,255,0.7)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '1rem', marginBottom: '10px' }}>
            Level 1: The Flow
        </h2>

        {/* BACK BUTTON */}
        <button 
            onClick={handleBackClick} 
            style={styles.backBtn}
        >
            ⬅
        </button>
        
        {/* COUNTDOWN */}
        {countdown !== null && (
            <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                fontSize: '8rem', fontWeight: '900', color: '#00FFFF', 
                textShadow: '0 0 50px rgba(0, 255, 255, 0.8)', zIndex: 50,
                animation: 'pulse 0.5s infinite alternate'
            }}>
                {countdown}
            </div>
        )}

        {/* EXIT CONFIRMATION MODAL */}
        {showExitConfirm && (
            <div style={styles.overlayFull}>
                <div style={styles.modalCard}>
                    <h3 style={{ color: 'white', marginTop: 0, fontSize: '1.5rem' }}>Leave Session?</h3>
                    <p style={{ color: '#aaa', marginBottom: '30px' }}>Your current progress will be lost.</p>
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                        <button onClick={cancelExit} style={{...styles.btnPrimary, background: 'transparent', border: '1px solid #555', color: '#fff', boxShadow: 'none'}}>
                            Resume
                        </button>
                        <button onClick={confirmExit} style={{...styles.btnPrimary, background: '#FF4500', boxShadow: '0 0 20px rgba(255, 69, 0, 0.4)'}}>
                            Leave
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* GAME OVER SCREEN */}
        {gameOver && (
            <div style={styles.overlayFull}>
                <h1 style={styles.gameOverTitle}>Mission Failed</h1>
                <p style={styles.gameOverText}>{gameOverMsg}</p>
                <button 
                    onClick={startGame} 
                    style={styles.btnPrimary}
                >
                    Reboot System ↻
                </button>
            </div>
        )}

        {/* WARNING TOAST */}
        {!gameOver && warningMsg && (
            <div style={styles.warningToast}>
                <span style={{ fontSize: '24px' }}>⚠️</span>
                <div>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', opacity: 0.7, letterSpacing: '1px' }}>System Alert</div>
                    {warningMsg}
                </div>
            </div>
        )}

        <canvas 
            ref={canvasRef} 
            style={styles.canvas} 
            onClick={() => window.focus()} 
        />
        
        <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '15px', fontSize: '0.9rem' }}>
            Hold <strong style={{color:'#00FFFF'}}>SPACE</strong> to Swim Up
        </p>
    </div>
  );
};

// --- STYLES ---
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: '10px',
        position: 'relative', 
        fontFamily: "'Inter', 'Roboto', sans-serif",
    },
    canvas: {
        border: '3px solid rgba(0, 255, 255, 0.3)', 
        borderRadius: '15px',
        boxShadow: '0 0 40px rgba(0, 255, 255, 0.1)',
        background: 'rgba(0, 10, 30, 0.3)', 
        maxWidth: '100%',
        cursor: 'crosshair', 
        backdropFilter: 'blur(5px)',
    },
    backBtn: {
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        cursor: 'pointer',
        color: 'white',
        fontSize: '24px',
        transition: 'all 0.3s ease',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(4px)',
    },
    warningToast: {
        position: 'absolute',
        top: '15%', 
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(20, 0, 0, 0.8)',
        borderLeft: '5px solid #FF4500', 
        padding: '15px 30px',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '18px',
        fontWeight: '600',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        zIndex: 50,
        minWidth: '300px',
        justifyContent: 'center',
    },
    overlayFull: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(2, 12, 27, 0.85)', 
        backdropFilter: 'blur(8px)', 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        borderRadius: '15px', 
    },
    gameOverTitle: {
        fontSize: '4rem',
        margin: '0 0 20px 0',
        fontFamily: 'sans-serif',
        fontWeight: '800',
        background: 'linear-gradient(180deg, #FF4500 0%, #FF8800 100%)', 
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: '0 10px 30px rgba(255, 69, 0, 0.3)',
        textTransform: 'uppercase',
        letterSpacing: '2px',
    },
    gameOverText: {
        fontSize: '1.5rem',
        color: '#ccc',
        marginBottom: '40px',
        maxWidth: '80%',
        textAlign: 'center',
        lineHeight: '1.5',
    },
    btnPrimary: {
        padding: '18px 50px',
        fontSize: '1.2rem',
        background: 'linear-gradient(90deg, #00FFFF, #0088FF)',
        border: 'none',
        borderRadius: '50px',
        cursor: 'pointer',
        fontWeight: 'bold',
        color: '#000',
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.4)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        textTransform: 'uppercase',
        letterSpacing: '1px',
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