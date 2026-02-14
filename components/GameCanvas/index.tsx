"use client";

import React, { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, RotateCcw, Zap, AlertCircle, Hand } from "lucide-react"; 

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
  missed: number;
}

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const router = useRouter();

  /* =================== GAME REFS =================== */
  const playerRef = useRef<Player | null>(null);
  const bgRef = useRef<SynapseBackground | null>(null);
  const grassRef = useRef<SeaGrass | null>(null);
  const coralsRef = useRef<SynapseCorals | null>(null);
  
  const particlesRef = useRef<Particle[]>([]);
  const pearlsRef = useRef<Pearl[]>([]);
  
  const inputRef = useRef<boolean>(false);
  const taskTimerRef = useRef<number>(0);
  
  // Game State
  const gameStateRef = useRef<"MENU" | "PLAYING" | "SOFT_FAIL">("MENU"); 
  const countdownRef = useRef<CountdownValue>(null); 

  /* =================== UI STATE =================== */
  const [uiState, setUiState] = useState<"MENU" | "PLAYING" | "SOFT_FAIL">("MENU");
  const [uiCountdown, setUiCountdown] = useState<CountdownValue>(null);
  
  // HUD STATE
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0); // NEW: Streak Counter
  
  const [failReason, setFailReason] = useState<"floor" | "ceiling" | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  const [currentTask, setCurrentTask] = useState<CognitiveTask>({ instruction: "Collect BLUE", targetColor: "#00BFFF" });

  const metricsRef = useRef<ClinicalMetrics>({ accuracy: { correct: 0, total: 0 },
  missed: 0});
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

    // Set canvas to full window size for immersion (optional, currently 1024x600 fixed)
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
    setStreak(0); // Reset streak
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
        
        // A. PHYSICS UPDATE
        if (physicsActive) {
            playerRef.current.update(inputRef.current, delta, sandHeight, particlesRef.current, nightFactor);
            
            // Spawn Pearls Logic
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

            // Check Pearl Collisions
            pearlsRef.current.forEach(pearl => {
                if (!pearl.collected && !pearl.markedForDeletion) {
                    const dx = playerRef.current!.x - pearl.x;
                    const dy = playerRef.current!.y - pearl.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    // Hitbox
                    if (dist < playerRef.current!.radius + pearl.radius + 10) {
                        collectPearl(pearl);
                    }
                }
            });
        } 
        
        // B. MENU HOVER (Manual Animation)
        else if (currentState === "MENU" || isCountingDown) {
             playerRef.current.y = (canvas.height / 2) + Math.sin(elapsed * 0.003) * 20;
             playerRef.current.velocity = 0;
             playerRef.current.rotation = 0; 
        }

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

    // --- 4. TINT (Depth Effect) ---
    ctx.fillStyle = "rgba(0, 20, 40, 0.12)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    rafRef.current = requestAnimationFrame(loop);
  };

  /* =================== HELPERS =================== */
  const spawnPearls = (w: number, h: number) => {
      const isTopCorrect = Math.random() > 0.5;
      // Wrong color is RED (#FF4500) if target is Blue
      const wrongColor = "#FF4500"; 
      
      const startX = w + 50;
      // Spawn two pearls: One target, one wrong
      pearlsRef.current.push(new Pearl(startX, h * 0.3, isTopCorrect ? currentTask.targetColor : wrongColor, isTopCorrect));
      pearlsRef.current.push(new Pearl(startX, h * 0.7, !isTopCorrect ? currentTask.targetColor : wrongColor, !isTopCorrect));
  };

  const collectPearl = (pearl: Pearl) => {
      pearl.collected = true;
      metricsRef.current.accuracy.total++;
      
      if (pearl.isTarget) {
          // --- GOOD PEARL ---
          metricsRef.current.accuracy.correct++;
          setScore(prev => prev + 100); 
          setStreak(prev => prev + 1); // Increase Streak
          
          // Teal Particles (Success)
          for(let i=0; i<8; i++) particlesRef.current.push(new Particle(pearl.x, pearl.y, 1, true));
      
      } else {
          // --- BAD PEARL (The Red Logic) ---
          setScore(prev => Math.max(0, prev - 50)); // Penalty
          setStreak(0); // Reset Streak (Ouch!)
          
          // Red Particles (Explosion)
          for(let i=0; i<12; i++) {
              const p = new Particle(pearl.x, pearl.y, 1.5, true);
              p.color = "rgba(255, 69, 0, 0.8)"; // Override color to Red
              particlesRef.current.push(p);
          }
      }
  };

  // --- RESUME ---
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

  // --- EXIT LOGIC ---
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

  /* =================== RENDER =================== */
  return (
    <div style={styles.container}>
        <canvas ref={canvasRef} style={styles.canvas} />

        {/* --- 1. FUN MANUAL (Tutorial) --- */}
        {uiState === "MENU" && (
            <div style={styles.overlay}>
                <div className="bg-[#0B1E33]/90 p-8 rounded-3xl border-2 border-[#2DD4BF] text-center max-w-lg backdrop-blur-md shadow-[0_0_50px_rgba(45,212,191,0.3)]">
                    <h1 className="text-4xl font-bold text-[#00FFFF] mb-2 tracking-wider">SYNAPSE RACER</h1>
                    <p className="text-gray-400 mb-6 uppercase text-sm tracking-widest">Protocol A: Motor & Cognitive</p>
                    
                    {/* Instructions Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <div className="flex items-center gap-3 mb-2">
                                <Hand className="text-[#2DD4BF]" size={24} />
                                <span className="text-white font-bold">CONTROLS</span>
                            </div>
                            <p className="text-sm text-gray-300">Hold <strong className="text-[#2DD4BF]">SPACE</strong> to Swim Up.</p>
                            <p className="text-sm text-gray-300">Release to Dive Down.</p>
                        </div>

                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <div className="flex items-center gap-3 mb-2">
                                <Zap className="text-yellow-400" size={24} />
                                <span className="text-white font-bold">GOAL</span>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-3 h-3 rounded-full bg-[#00BFFF] shadow-[0_0_10px_#00BFFF]"></div>
                                <span className="text-sm text-gray-300">Collect Blue (+100)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#FF4500] shadow-[0_0_10px_#FF4500]"></div>
                                <span className="text-sm text-gray-300">Avoid Red (-50)</span>
                            </div>
                        </div>
                    </div>

                    <button onClick={startSession} className="group relative px-8 py-4 bg-[#2DD4BF] text-[#0B1E33] font-black text-xl rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(45,212,191,0.6)]">
                        <span className="relative z-10 flex items-center gap-2">
                            <Play fill="currentColor" /> START MISSION
                        </span>
                        <div className="absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    </button>
                </div>
            </div>
        )}

        {/* --- 2. FAIL STATE (Soft Fail) --- */}
        {uiState === "SOFT_FAIL" && failReason && (
            <div style={styles.overlay}>
                <div className="bg-[#0B1E33] p-8 rounded-3xl border border-[#FF4500] text-center shadow-2xl">
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

        {/* --- 3. HUD (Score & Streak) --- */}
        {uiState === "PLAYING" && (
            <div className="absolute top-6 right-6 flex gap-4 pointer-events-none">
                {/* Streak Counter */}
                <div className={`flex flex-col items-center justify-center bg-[#0B1E33]/80 backdrop-blur border border-white/10 px-4 py-2 rounded-xl transition-all ${streak > 5 ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)]' : ''}`}>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Streak</span>
                    <div className="flex items-center gap-1">
                        <Zap size={20} className={streak > 5 ? "text-yellow-400 fill-yellow-400 animate-pulse" : "text-gray-500"} />
                        <span className={`text-2xl font-black ${streak > 5 ? 'text-yellow-400' : 'text-white'}`}>{streak}</span>
                    </div>
                </div>

                {/* Score Counter */}
                <div className="flex flex-col items-end justify-center bg-[#0B1E33]/80 backdrop-blur border border-[#2DD4BF]/30 px-6 py-2 rounded-xl shadow-[0_0_20px_rgba(45,212,191,0.2)]">
                    <span className="text-[10px] text-[#2DD4BF] uppercase tracking-wider font-bold">Current Score</span>
                    <span className="text-3xl font-black text-white font-mono">{score.toString().padStart(4, '0')}</span>
                </div>
            </div>
        )}

        {/* --- 4. COUNTDOWN --- */}
        {uiCountdown !== null && (
            <div style={styles.countdown}>{uiCountdown}</div>
        )}

        {/* --- 5. EXIT CONFIRM --- */}
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
    countdown: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '8rem', fontWeight: '900', color: '#00FFFF', textShadow: '0 0 50px rgba(0, 255, 255, 0.8)', zIndex: 50, animation: 'pulse 0.5s infinite alternate' },
    modalCard: { background: 'rgba(20, 20, 30, 0.95)', padding: '30px 40px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' },
    backBtn: { position: 'absolute', top: '20px', left: '20px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '50%', width: '50px', height: '50px', cursor: 'pointer', color: 'white', fontSize: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)', zIndex: 30 }
};

export default GameCanvas;