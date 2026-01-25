"use client";
import React, { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Player } from "../game-core/Player";
import { Background } from "../game-core/SynapseBackground";
import { SeaGrass } from "../game-core/SynapseSeaGrass";
import { Particle } from "../game-core/SynapseParticles"; 

const GameCanvas = () => {
    const canvasRef = useRef(null);
    const requestRef = useRef();
    const router = useRouter();
    
    // Game Entities
    const playerRef = useRef(null);
    const bgRef = useRef(null);
    const grassRef = useRef(null);
    const particlesRef = useRef([]);
    const inputRef = useRef(false);
    
    // Time & Pausing
    const startTimeRef = useRef(Date.now());
    const [isPaused, setIsPaused] = useState(false);
    const countdownIntervalRef = useRef(null); 

    // UI States
    const [gameOver, setGameOver] = useState(false);
    const [gameOverMsg, setGameOverMsg] = useState("");
    const [warningMsg, setWarningMsg] = useState(""); 
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    
    // Countdown State
    const [countdown, setCountdown] = useState(null); 

    // --- RESTART FUNCTION ---
    const startGame = () => {
        const canvas = canvasRef.current;
        const width = 1024;
        const height = 600;

        canvas.width = width;
        canvas.height = height;

        // 1. Reset Entities
        playerRef.current = new Player(width, height);
        bgRef.current = new Background(width, height);
        grassRef.current = new SeaGrass(width, height);
        particlesRef.current = [];
        
        startTimeRef.current = Date.now();
        setGameOver(false);
        setGameOverMsg("");
        setWarningMsg("");
        setIsPaused(false);
        
        // Stop any running loops
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        // 2. Draw ONE Static Frame (So user sees the fish while waiting)
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);
        if (bgRef.current) bgRef.current.draw(ctx, 0); // Day mode
        if (grassRef.current) grassRef.current.draw(ctx);
        if (playerRef.current) playerRef.current.draw(ctx);

        // 3. Start Countdown Sequence
        setCountdown(3);
        let count = 3;

        countdownIntervalRef.current = setInterval(() => {
            count--;
            if (count > 0) {
                setCountdown(count);
            } else if (count === 0) {
                setCountdown("GO!");
            } else {
                // 4. Launch Game
                clearInterval(countdownIntervalRef.current);
                setCountdown(null); // Hide Overlay
                animate(); // Start Physics Loop
            }
        }, 1000);
    };

    const animate = () => {
        if (isPaused) return; 

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTimeRef.current;

        try {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 1. Draw Background
            let nightFactor = 0;      
            let currentSandHeight = 50; 

            if (bgRef.current) { 
                nightFactor = bgRef.current.update(elapsedTime); 
                bgRef.current.draw(ctx, nightFactor);
                currentSandHeight = bgRef.current.sandHeight;
            }

            // 2. Draw Sea Grass
            if (grassRef.current) { 
                grassRef.current.update(); 
                grassRef.current.draw(ctx); 
            }

            // 3. Draw Particles
            for (let i = particlesRef.current.length - 1; i >= 0; i--) {
                const p = particlesRef.current[i];
                p.update();
                p.draw(ctx);
                if (p.markedForDeletion) particlesRef.current.splice(i, 1);
            }

            // 4. Update Player
            const player = playerRef.current;
            if (player) {
                player.update(inputRef.current, 16, currentSandHeight); 
                player.draw(ctx);
                particlesRef.current.push(new Particle(player.x, player.y));

                // A. Check for Death
                if (player.isDead) {
                    setGameOver(true);
                    setWarningMsg(""); 
                    if (player.deathReason === "dried_out") {
                        setGameOverMsg("Oops! Fish need water to breathe! 🐟💦");
                    } else {
                        setGameOverMsg("Oops! You got stuck in the sand! 🦀");
                    }
                    return; 
                }

                // B. Check for Warnings
                if (player.status === "hit_floor") {
                    setWarningMsg("Oops! Watch out for the crabs! 🦀");
                } else if (player.status === "hit_ceiling") {
                    setWarningMsg("Too high! Fish can't fly! 🦅");
                } else {
                    setWarningMsg("");
                }
            }

            requestRef.current = requestAnimationFrame(animate);

        } catch (error) {
            console.error("Game Loop Crashed:", error);
        }
    };

    // --- HANDLERS ---
    const handleBackClick = () => {
        setIsPaused(true); 
        setShowExitConfirm(true); 
    };

    const confirmExit = () => {
        router.push('/patient-home'); 
    };

    const cancelExit = () => {
        setShowExitConfirm(false);
        setIsPaused(false); 
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        startGame();
        return () => {
            cancelAnimationFrame(requestRef.current);
            clearInterval(countdownIntervalRef.current);
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => { if (e.code === "Space") { e.preventDefault(); inputRef.current = true; } };
        const handleKeyUp = (e) => { if (e.code === "Space") inputRef.current = false; };
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => { window.removeEventListener("keydown", handleKeyDown); window.removeEventListener("keyup", handleKeyUp); };
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
const styles = {
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
        left: '-80px',
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
    }
};

// --- INJECT ANIMATIONS ---
if (typeof window !== "undefined") {
    const animStyle = document.createElement("style");
    animStyle.innerText = `
      @keyframes slideDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      .hover-scale:hover { transform: scale(1.05); box-shadow: 0 0 30px rgba(0, 255, 255, 0.6) !important; }
    `;
    document.head.appendChild(animStyle);
}
export default GameCanvas;