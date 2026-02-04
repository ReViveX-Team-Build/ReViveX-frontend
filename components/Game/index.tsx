"use client";

import React, { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Player } from "../../util/game-core/SynapsePlayer";
import { SynapseBackground } from "../../util/game-core/SyanpseBackground";
import { SeaGrass } from "../../util/game-core/SynapseSeaGrass";
import { Particle } from "../../util/game-core/SynapseParticles";
import { SynapseCorals } from "../../util/game-core/SynapseCorals";

type CountdownValue = number | "GO!" | null;

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

  /* =================== START / RESET =================== */
  const startGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 1024;
    canvas.height = 600;

    playerRef.current = new Player(canvas.width, canvas.height);
    bgRef.current = new SynapseBackground(canvas.width, canvas.height);
    coralsRef.current = new SynapseCorals(canvas.width, canvas.height);
    grassRef.current = new SeaGrass(canvas.width, canvas.height);
    particlesRef.current = [];

    setGameOver(false);
    setGameOverMsg("");
    setWarningMsg("");
    setIsPaused(false);

    startTimeRef.current = Date.now();
    lastFrameRef.current = performance.now();

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);

    /* --- DRAW STATIC FRAME --- */
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bgRef.current?.draw(ctx, 0);
    grassRef.current?.draw(ctx);
    playerRef.current?.draw(ctx);

    /* --- COUNTDOWN --- */
    setCountdown(3);
    let count = 3;

    countdownTimer.current = setInterval(() => {
      count--;
      if (count > 0) setCountdown(count);
      else if (count === 0) setCountdown("GO!");
      else {
        setCountdown(null);
        clearInterval(countdownTimer.current!);
        rafRef.current = requestAnimationFrame(loop);
      }
    }, 900);
  };

  /* =================== MAIN LOOP =================== */
  const loop = (now: number) => {
    if (isPaused || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const delta = Math.min(32, now - lastFrameRef.current);
    lastFrameRef.current = now;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const elapsed = Date.now() - startTimeRef.current;

    /* --- BACKGROUND --- */
    let nightFactor = 0;
    let sandHeight = 50;

<<<<<<< HEAD:components/Game/index.tsx
    // --- HANDLERS ---
    const handleBackClick = (): void => {
        setIsPaused(true); 
        setShowExitConfirm(true); 
    };

    const confirmExit = (): void => {
        '/patients/home'
        router.push('/patients/home');
    };

    const cancelExit = (): void => {
        setShowExitConfirm(false);
        setIsPaused(false); 
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        startGame();
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }
        };
    }, []);

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

    return (
        <div style={styles.container}>
            <h2 style={{ color: 'rgba(255,255,255,0.7)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '1rem' }}>
                Level 1: The Flow
            </h2>

            {/* BACK BUTTON */}
            <button 
                onClick={handleBackClick} 
                style={styles.backBtn}
                className="hover-scale"
            >
                ←
            </button>
            
            {/* COUNTDOWN (Big & Centered) */}
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

            {/* --- PREMIUM GAME OVER SCREEN --- */}
            {gameOver && (
                <div style={styles.overlayFull}>
                    <h1 style={styles.gameOverTitle}>Mission Failed</h1>
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>
                        {gameOverMsg.includes("stuck") ? "🦀" : gameOverMsg.includes("fly") ? "🦅" : "🐟"}
                    </div>
                    <p style={styles.gameOverText}>{gameOverMsg}</p>
                    
                    <button 
                        onClick={startGame} 
                        style={styles.btnPrimary}
                        className="hover-scale"
                    >
                        Reboot System 🔄
                    </button>
                </div>
            )}

            {/* --- PREMIUM WARNING TOAST --- */}
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

// --- PREMIUM UI STYLES ---
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
    // High-Tech Alert
    warningToast: {
        position: 'absolute',
        top: '15%', 
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(20, 0, 0, 0.8)', // Dark Red tint
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
        animation: 'slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
        minWidth: '300px',
        justifyContent: 'center',
    },
    // Cinematic Game Over
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
        animation: 'fadeIn 0.5s ease',
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
=======
    if (bgRef.current) {
      nightFactor = bgRef.current.update(elapsed);
      bgRef.current.draw(ctx, nightFactor);
      sandHeight = bgRef.current.sandHeight;
>>>>>>> main:components/GameCanvas/index.tsx
    }

    coralsRef.current?.update();
    coralsRef.current?.draw(ctx, nightFactor);

    /* --- SEA GRASS --- */
    if (grassRef.current && playerRef.current) {
      grassRef.current.update(
        playerRef.current.x,
        playerRef.current.y,
        delta
      );
      grassRef.current.draw(ctx);
    }

    /* --- PARTICLES --- */
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.update();
      p.draw(ctx);
      if (p.markedForDeletion) particlesRef.current.splice(i, 1);
    }

    /* --- PLAYER --- */
    const player = playerRef.current;
    if (player) {
      player.update(inputRef.current, delta, sandHeight);
      player.draw(ctx);
      particlesRef.current.push(new Particle(player.x, player.y));

      if (player.isDead) {
        setGameOver(true);
        setGameOverMsg(
          player.deathReason === "dried_out"
            ? "Fish need water to survive 💦"
            : "You hit the ocean floor 🦀"
        );
        return;
      }

      if (player.status === "hit_floor")
        setWarningMsg("Careful! Crabs ahead 🦀");
      else if (player.status === "hit_ceiling")
        setWarningMsg("Too high! 🦅");
      else setWarningMsg("");
    }

    /* --- OVERLAY EFFECT --- */
    ctx.fillStyle = "rgba(0,20,40,0.12)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    rafRef.current = requestAnimationFrame(loop);
  };

  /* =================== INPUT =================== */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        inputRef.current = true;
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") inputRef.current = false;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  /* =================== INIT =================== */
  useEffect(() => {
    startGame();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, []);

  /* =================== UI =================== */
  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={() => setShowExitConfirm(true)}>
        ←
      </button>

      <canvas ref={canvasRef} style={styles.canvas} />

      {countdown && <div style={styles.countdown}>{countdown}</div>}

      {warningMsg && !gameOver && (
        <div style={styles.toast}>⚠️ {warningMsg}</div>
      )}

      {gameOver && (
        <div style={styles.overlay}>
          <h1>Mission Failed</h1>
          <p>{gameOverMsg}</p>
          <button onClick={startGame}>Restart</button>
        </div>
      )}

      {showExitConfirm && (
        <div style={styles.overlay}>
          <p>Leave session?</p>
          <button onClick={() => router.push("/patients/home")}>
            Leave
          </button>
          <button
            onClick={() => {
              setShowExitConfirm(false);
              rafRef.current = requestAnimationFrame(loop);
            }}
          >
            Resume
          </button>
        </div>
      )}
    </div>
  );
};

/* =================== STYLES =================== */
const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    marginTop: "20px",
  },
  canvas: {
    borderRadius: "16px",
    border: "2px solid rgba(0,255,255,0.4)",
    boxShadow: "0 0 40px rgba(0,255,255,0.25)",
  },
  backBtn: {
    position: "absolute",
    left: "-60px",
    top: "20px",
    borderRadius: "50%",
    width: "48px",
    height: "48px",
    fontSize: "22px",
  },
  countdown: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    fontSize: "7rem",
    color: "#00ffff",
    textShadow: "0 0 40px cyan",
  },
  toast: {
    position: "absolute",
    top: "20%",
    background: "rgba(120,0,0,0.85)",
    padding: "12px 24px",
    borderRadius: "10px",
    color: "#fff",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  },
};

export default GameCanvas;
