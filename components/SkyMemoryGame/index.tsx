"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Play, RotateCcw, Zap, Hand, Wifi, WifiOff, Brain, Target, Clock } from "lucide-react";
import { saveGameSession } from "../../app/lib/db/sessions";
import { calculateCognitiveAccuracy, calculateEnduranceDrop, getPeakGripForce } from "../../util/game-core/MetricsCalculator";
import { Timestamp } from "firebase/firestore";
import { SkyBird } from "../../util/game-core/SynapseSkyBird";
import { SkyBackground } from "../../util/game-core/SynapseSky";
import { SkyGate, MemoryColor, SKY_COLOR_PALETTE } from "../../util/game-core/SynapseSkyGate";
import { Particle } from "../../util/game-core/SynapseParticles";

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
declare global { interface Navigator { serial?: Serial; } }

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const IDLE_THRESHOLD = 0.5;
const DANGER_THRESHOLD = 2.0;
const SCROLL_SPEED = 2.0; // Slower scroll speed for therapy use

// Difficulty settings - gentle progression for therapy
const DIFFICULTY_SETTINGS = {
    3: { sequenceLength: 2, checkpointCount: 2, colors: 2, showTime: 3000, holdTime: 4000, name: "Memory Trench" },
    4: { sequenceLength: 3, checkpointCount: 3, colors: 3, showTime: 3500, holdTime: 4500, name: "Precision Peaks" },
    5: { sequenceLength: 3, checkpointCount: 3, colors: 4, showTime: 3500, holdTime: 4500, name: "Abyss Mastery" },
};

// ── INTERFACES ───────────────────────────────────────────────────────────────
interface GameMetrics {
    sequencesCompleted: number;
    sequencesFailed: number;
    correctCheckpoints: number;
    wrongCheckpoints: number;
    reactionTimes: number[];
    jumpPressures: number[];
    currentSqueezePeak: number;
    isSqueezing: boolean;
}

type GameState = 'MENU' | 'COUNTDOWN' | 'PLAYING' | 'GAME_OVER';
type CountdownValue = number | 'GO!' | null;

// ── GLOBAL CSS ────────────────────────────────────────────────────────────────
const GAME_CSS = `
  body:has(#skymemory-root) aside,
  body:has(#skymemory-root) nav,
  body:has(#skymemory-root) header { display: none !important; }

  #skymemory-root {
    position: fixed !important; inset: 0 !important;
    z-index: 9999 !important;
    width: 100vw !important; height: 100vh !important;
    overflow: hidden !important; background: #1e40af;
  }
  #skymemory-root canvas {
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

// ── COMPONENT ─────────────────────────────────────────────────────────────────
const SkyMemoryGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Get level from URL params, default to 3
    const levelParam = searchParams?.get('level');
    const gameLevel = levelParam ? parseInt(levelParam) : 3;
    const settings = DIFFICULTY_SETTINGS[gameLevel as keyof typeof DIFFICULTY_SETTINGS] || DIFFICULTY_SETTINGS[3];

    // ── STATE REFS ───────────────────────────────────────────────────────────
    const gameStateRef = useRef<GameState>('MENU');
    const countdownRef = useRef<CountdownValue>(null);
    const jumpPressedRef = useRef(false);
    const ceilingIdleTimerRef = useRef(0);

    // Game objects
    const birdRef = useRef<SkyBird | null>(null);
    const skyRef = useRef<SkyBackground | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const gatesRef = useRef<SkyGate[]>([]);

    // Game tracking
    const scoreRef = useRef(0);
    const streakRef = useRef(0);
    const maxStreakRef = useRef(0);
    const distanceTraveledRef = useRef(0);
    const lastXRef = useRef(0);
    const sequenceRef = useRef<string[]>([]);
    const gateTimerRef = useRef(0);
    const gateSpawnTimerRef = useRef(0);
    const failsRef = useRef(0);

    // Metrics
    const metricsRef = useRef<GameMetrics>({
        sequencesCompleted: 0,
        sequencesFailed: 0,
        correctCheckpoints: 0,
        wrongCheckpoints: 0,
        reactionTimes: [],
        jumpPressures: [],
        currentSqueezePeak: 0,
        isSqueezing: false
    });
    const startTimeRef = useRef(0);
    const lastFrameTimeRef = useRef(0);

    // IoT
    const [isConnected, setIsConnected] = useState(false);
    const isConnRef = useRef(false);
    const pressRef = useRef(0);
    const portRef = useRef<SerialPort | null>(null);
    const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);

    // UI State
    const [uiState, setUiState] = useState<GameState>('MENU');
    const [uiCd, setUiCd] = useState<CountdownValue>(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [level, setLevel] = useState(gameLevel);
    const [showExit, setShowExit] = useState(false);
    const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);
        const [pressDisp, setPressDisp] = useState(0);
        const cdTimerRef = useRef<NodeJS.Timeout | null>(null);

    // ── HELPERS ───────────────────────────────────────────────────────────────
    const setGameState = useCallback((s: GameState) => {
        gameStateRef.current = s;
        setUiState(s);
    }, []);

    const setCountdown = useCallback((v: CountdownValue) => {
        countdownRef.current = v;
        setUiCd(v);
    }, []);

    const triggerFeedback = useCallback((text: string, color: string) => {
        setFeedback({ text, color });
        setTimeout(() => setFeedback(null), 2000);
    }, []);

    // ── IoT SERIAL ───────────────────────────────────────────────────────────
    const connectSerial = async () => {
        try {
            if (!navigator.serial) { alert('Web Serial not supported. Use Chrome or Edge.'); return; }
            const port = await navigator.serial.requestPort();
            if (!port.readable) await port.open({ baudRate: 115200 });
            portRef.current = port;
            setIsConnected(true); isConnRef.current = true;
            const td = new TextDecoderStream();
            port.readable!.pipeTo(td.writable).catch(() => {});
            const r = td.readable.getReader();
            readerRef.current = r;
            _readLoop(r);
        } catch (e: unknown) {
            if (e instanceof Error && e.name === 'NotFoundError') return;
            alert('Could not connect. Make sure device is plugged in.');
        }
    };

    const disconnectSerial = async () => {
        setIsConnected(false); isConnRef.current = false; pressRef.current = 0;
        try { if (readerRef.current) { await readerRef.current.cancel(); readerRef.current.releaseLock(); readerRef.current = null; } } catch (_) {}
        try { if (portRef.current) { await portRef.current.close(); portRef.current = null; } } catch (_) {}
    };

    const _readLoop = async (r: ReadableStreamDefaultReader<string>) => {
        let buf = '';
        try {
            while (true) {
                const { value, done } = await r.read();
                if (done) break;
                buf += value;
                const lines = buf.split('\n'); buf = lines.pop() || '';
                for (const line of lines) {
                    const m = line.match(/V:([\d.]+)/);
                    if (m) pressRef.current = parseFloat(m[1]);
                }
            }
        } catch (_) { setIsConnected(false); isConnRef.current = false; }
    };

    const shouldJump = (): boolean => {
        if (isConnRef.current) {
            const p = pressRef.current;
            const isJumping = p > IDLE_THRESHOLD && p < DANGER_THRESHOLD;
            
            if (isJumping) {
                metricsRef.current.isSqueezing = true;
                if (p > metricsRef.current.currentSqueezePeak) {
                    metricsRef.current.currentSqueezePeak = p;
                }
            } else if (metricsRef.current.isSqueezing) {
                metricsRef.current.jumpPressures.push(metricsRef.current.currentSqueezePeak);
                metricsRef.current.currentSqueezePeak = 0;
                metricsRef.current.isSqueezing = false;
            }
            return isJumping;
        }
        return jumpPressedRef.current;
    };

    // ── RESIZE ────────────────────────────────────────────────────────────────
    useEffect(() => {
        const onResize = () => {
            const c = canvasRef.current; if (!c) return;
            c.width = window.innerWidth; c.height = window.innerHeight;
            skyRef.current = new SkyBackground(c.width, c.height);
            if (birdRef.current) {
                birdRef.current = new SkyBird(c.width, c.height);
            }
        };
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // ── INIT ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        const c = canvasRef.current; if (!c) return;
        c.width = window.innerWidth; c.height = window.innerHeight;
        
        birdRef.current = new SkyBird(c.width, c.height);
        skyRef.current = new SkyBackground(c.width, c.height);
        
        startTimeRef.current = Date.now();
        lastFrameTimeRef.current = performance.now();
        
        rafRef.current = requestAnimationFrame(gameLoop);
        
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (cdTimerRef.current) clearInterval(cdTimerRef.current);
            const cleanup = async () => {
                try { if (readerRef.current) { await readerRef.current.cancel(); readerRef.current.releaseLock(); readerRef.current = null; } } catch (_) {}
                try { if (portRef.current) { await portRef.current.close(); portRef.current = null; } } catch (_) {}
            };
            cleanup();
        };
    }, []);

    // ── INPUT HANDLERS (KEYBOARD + MOUSE + TOUCH) ──────────────────────────
    // Debug state for visual indicator
    const [inputActive, setInputActive] = useState(false);
    
    useEffect(() => {
        // Keyboard handlers with debug logging
        const kd = (e: KeyboardEvent) => { 
            if (e.code === 'Space') { 
                e.preventDefault(); 
                jumpPressedRef.current = true; 
                setInputActive(true);
                console.log('KEYBOARD: Jump pressed'); // Debug
            } 
        };
        const ku = (e: KeyboardEvent) => { 
            if (e.code === 'Space') {
                jumpPressedRef.current = false; 
                setInputActive(false);
                console.log('KEYBOARD: Jump released'); // Debug
            }
        };
        
        window.addEventListener('keydown', kd); 
        window.addEventListener('keyup', ku);
        
        // Mouse/Touch handlers
        const handlePointerDown = (e: PointerEvent) => {
            // Prevent default to avoid scrolling
            e.preventDefault();
            jumpPressedRef.current = true;
            setInputActive(true);
            console.log('POINTER: Jump pressed'); // Debug
        };
        
        const handlePointerUp = (e: PointerEvent) => {
            jumpPressedRef.current = false;
            setInputActive(false);
            console.log('POINTER: Jump released'); // Debug
        };
        
        // Add to canvas when it's available
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.addEventListener('pointerdown', handlePointerDown);
            canvas.addEventListener('pointerup', handlePointerUp);
            canvas.addEventListener('pointerleave', handlePointerUp);
            canvas.addEventListener('pointercancel', handlePointerUp);
        }
        
        return () => { 
            window.removeEventListener('keydown', kd); 
            window.removeEventListener('keyup', ku);
            if (canvas) {
                canvas.removeEventListener('pointerdown', handlePointerDown);
                canvas.removeEventListener('pointerup', handlePointerUp);
                canvas.removeEventListener('pointerleave', handlePointerUp);
                canvas.removeEventListener('pointercancel', handlePointerUp);
            }
        };
    }, []);

    // ── START GAME ───────────────────────────────────────────────────────────
    const startSession = () => {
        const c = canvasRef.current; if (!c) return;
        
        if (birdRef.current) {
            birdRef.current.reset();
            birdRef.current.y = c.height / 2;
        }
        
        particlesRef.current = [];
        gatesRef.current = [];
        scoreRef.current = 0;
        streakRef.current = 0;
        distanceTraveledRef.current = 0;
        lastXRef.current = 120; // bird start X
        failsRef.current = 0;
        
        metricsRef.current = {
            sequencesCompleted: 0,
            sequencesFailed: 0,
            correctCheckpoints: 0,
            wrongCheckpoints: 0,
            reactionTimes: [],
            jumpPressures: [],
            currentSqueezePeak: 0,
            isSqueezing: false
        };
        
        setScore(0);
        setStreak(0);
        ceilingIdleTimerRef.current = 0;
        
        setGameState('COUNTDOWN');
        setCountdown(3);
        
        let count = 3;
        if (cdTimerRef.current) clearInterval(cdTimerRef.current);
        cdTimerRef.current = setInterval(() => {
            count--;
            if (count > 0) setCountdown(count);
            else if (count === 0) setCountdown('GO!');
            else { 
                setCountdown(null); 
                if (cdTimerRef.current) clearInterval(cdTimerRef.current);
                // Start playing immediately after countdown!
                setGameState('PLAYING');
                console.log('Transitioned to PLAYING state');
                // Spawn first gate - skip showing sequence for first gate
                spawnNewGate();
            }
        }, 900);
    };

    // ── SPAWN GATE ───────────────────────────────────────────────────────────
    const spawnNewGate = () => {
        const c = canvasRef.current; if (!c) return;
        
const numGates = gameLevel === 3 ? 3 : gameLevel === 4 ? 4 : 5;  // More gates for Precision Peaks+
const gateSpacing = gameLevel === 3 ? 650 : gameLevel === 4 ? 500 : 450;  // Less distance Precision Peaks+
        for (let i = 0; i < numGates; i++) {
            // Generate proper sequence using settings
            const sequence: MemoryColor[] = [];
            for (let j = 0; j < settings.sequenceLength; j++) {
                const availableColors = j < settings.colors ? SKY_COLOR_PALETTE.slice(0, settings.colors) : SKY_COLOR_PALETTE;
                const colorConfig = availableColors[Math.floor(Math.random() * availableColors.length)];
                sequence.push(colorConfig.name);
            }
            
            const gate = new SkyGate(
                c.width + (i * gateSpacing),
                c.height,
                sequence,
                settings.sequenceLength,
                gameLevel
            );
            gatesRef.current.push(gate);
        }
    };

    // ── GAME LOOP ───────────────────────────────────────────────────────────
    const gameLoop = (now: number) => {
        const c = canvasRef.current; if (!c) return;
        const ctx = c.getContext('2d'); if (!ctx) return;

        const delta = Math.min(32, now - lastFrameTimeRef.current);
        lastFrameTimeRef.current = now;
        const elapsed = Date.now() - startTimeRef.current;

        ctx.clearRect(0, 0, c.width, c.height);

        const state = gameStateRef.current;
        const isCounting = countdownRef.current !== null;
        const physics = state === 'PLAYING';
        const scrollSpeed = physics ? SCROLL_SPEED : 0.8;

        // Sky background
        let nf = 0, groundH = 60;
        if (skyRef.current) {
            nf = skyRef.current.update(elapsed, delta, scrollSpeed);
            skyRef.current.draw(ctx);
            groundH = skyRef.current.sandHeight;
        }

        // Update and draw gates
        if (state === 'PLAYING') {
            gateTimerRef.current += delta;
            
            if (state === 'PLAYING' && gatesRef.current.length === 0) {
                gateSpawnTimerRef.current += delta;
                if (gateSpawnTimerRef.current > 1500) {
                    spawnNewGate();
                    gateSpawnTimerRef.current = 0;
                }
            }
            
            for (let i = gatesRef.current.length - 1; i >= 0; i--) {
                const gate = gatesRef.current[i];
                if (!gate) continue;
                
                gate.update(scrollSpeed);
                gate.draw(ctx);
                
                if (state === 'PLAYING' && birdRef.current) {
                    // Check for collision with pipes (game over) - before checkpoint check
                    const birdX = birdRef.current.x;
                    const birdY = birdRef.current.y;
                    const birdRadius = birdRef.current.radius;
                    
                    if (gate.state === 'waiting' || gate.state === 'passed_checkpoint' || gate.state === 'showing') {
                        const gapTop = gate.pillarTops.length > 0 ? gate.pillarTops[0] : c.height * 0.3;
                        const gapBottom = gate.pillarBottoms.length > 0 ? gate.pillarBottoms[0] : c.height * 0.7;
                        const pipeLeft = gate.x - 35; // Updated from 26 (half of new pillarWidth 70)
                        const pipeRight = gate.x + 35; // Updated from 26
                        
                        // Check if bird is horizontally aligned with pipe
                        if (birdX + birdRadius > pipeLeft && birdX - birdRadius < pipeRight) {
                            // Check if bird is NOT in the gap (collision with pipe)
                            if (birdY - birdRadius < gapTop || birdY + birdRadius > gapBottom) {
                                // Collision! Game over
                                triggerFeedback('CRASH!', '#EF4444');
                                setGameState('GAME_OVER');
                            }
                        }
                    }
                    
                    // Check checkpoint pass (no slowdown, immediate)
                    const result = gate.checkCheckpoint(
                        birdRef.current.x,
                        birdRef.current.y,
                        birdRef.current.radius
                    );
                    
                    if (result.hit) {
                        if (result.correct) {
                            const checkpointBonus = 50;
                            scoreRef.current += checkpointBonus;
                            setScore(scoreRef.current);
                            
                            for (let p = 0; p < 6; p++) {
                                particlesRef.current.push(new Particle(birdRef.current!.x, birdRef.current!.y, 0.8, true));
                            }
                            
                            if (result.isLast) {
                                metricsRef.current.sequencesCompleted++;
                                const newStreak = streakRef.current + 1;
                                streakRef.current = newStreak;
                                setStreak(newStreak);
                                
                                const streakBonus = newStreak * 25;
                                scoreRef.current += 100 + streakBonus;
                                setScore(scoreRef.current);
                                
                                triggerFeedback(
                                    newStreak >= 3 ? `${newStreak}x STREAK! 🔥` : 'Perfect!',
                                    newStreak >= 3 ? '#FFD700' : '#22C55E'
                                );
                                
                                // Remove gate immediately when all checkpoints passed
                                gatesRef.current.splice(i, 1);
                            }
                        } else {
                            metricsRef.current.wrongCheckpoints++;
                            streakRef.current = 0;
                            setStreak(0);
                            scoreRef.current = Math.max(0, scoreRef.current - 25);
                            setScore(scoreRef.current);
                            
                            triggerFeedback('Wrong Color!', '#EF4444');
                            
                            for (let p = 0; p < 8; p++) {
                                const particle = new Particle(birdRef.current!.x, birdRef.current!.y, 1, true);
                                particle.color = 'rgba(239, 68, 68, 0.8)';
                                particlesRef.current.push(particle);
                            }
                        }
                        
                        // Only remove gates that have been fully passed (not on wrong color)
                        if (gate.passed && !result.isLast) {
                            gatesRef.current.splice(i, 1);
                        }
                    }
                    
                    if (gate.failed && state === 'PLAYING') {
                        metricsRef.current.sequencesFailed++;
                        streakRef.current = 0;
                        setStreak(0);
                        triggerFeedback('Time Out!', '#EF4444');
                        gatesRef.current.splice(i, 1);
                    }
                }
                
                if (gate.isOffScreen()) {
                    gatesRef.current.splice(i, 1);
                }
            }
        }

        // Bird player
        if (birdRef.current) {
            const bird = birdRef.current;
            const isOnGround = physics && bird.status === 'hit_ground';
            const isAtCeiling = physics && bird.status === 'hit_ceiling';
            
            // Check if bird hit the ground - stay there until user presses space to jump
            if (isOnGround) {
                // Reset streak when hitting ground
                if (streakRef.current > 0) {
                    streakRef.current = 0;
                    setStreak(0);
                }
                
                // Keep bird on the ground
                if (skyRef.current) {
                    const groundY = c.height - skyRef.current.sandHeight - bird.radius;
                    bird.y = groundY;
                    bird.velocity = 0;
                }
                
                // Only show feedback occasionally (not every frame)
                if (Math.random() < 0.02) {
                    triggerFeedback('Too Low! Press SPACE to jump', '#F97316');
                }
                
                // Allow jumping from ground - check directly without waiting for update
                if (state === 'PLAYING' && shouldJump()) {
                    bird.jump();
                    bird.status = 'flying';
                }
            }
            // Check if bird hit the ceiling - stay there until user releases, fail after 5s idle
            else if (isAtCeiling) {
                ceilingIdleTimerRef.current += delta / 1000; // accumulate seconds
                if (Math.random() < 0.02) {
                    triggerFeedback('Too High! Move down!', '#F97316');
                }
                bird.y = bird.radius;
                bird.velocity = 0;
                if (ceilingIdleTimerRef.current > 5) {
                    triggerFeedback('IDLE TOO LONG!', '#EF4444');
                    setGameState('GAME_OVER');
                    ceilingIdleTimerRef.current = 0;
                }
            } else {
                ceilingIdleTimerRef.current = 0; // reset when not at ceiling
            }
            // Normal flying - update physics
// Distance scoring - score progresses with SCROLL_SPEED * time
            if (physics) {
                distanceTraveledRef.current += SCROLL_SPEED;
                const distancePoints = Math.floor(distanceTraveledRef.current / 10); // 1pt per 10px
                scoreRef.current = Math.max(scoreRef.current, distancePoints);
                setScore(scoreRef.current);
            }
            
            if (physics) {
                bird.update(delta, groundH);
                
                if (state === 'PLAYING' && shouldJump()) {
                    bird.jump();
                }
            } else if (state === 'MENU' || isCounting) {
                birdRef.current.y = c.height / 2 + Math.sin(elapsed * 0.003) * 20;
                birdRef.current.velocity = 0;
            }
            
            birdRef.current.draw(ctx);
        }

        // Particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i];
            if (physics) p.update();
            p.draw(ctx);
            if (p.markedForDeletion) particlesRef.current.splice(i, 1);
        }

        if (isConnRef.current) {
            setPressDisp(parseFloat(pressRef.current.toFixed(2)));
        }

        rafRef.current = requestAnimationFrame(gameLoop);
    };

    // ── EXIT HANDLERS ─────────────────────────────────────────────────────────
    const handleExit = () => {
        if (gameStateRef.current === 'PLAYING') setGameState('GAME_OVER');
        setShowExit(true);
    };
    
    const cancelExit = () => {
        setShowExit(false);
    };

    const handleSaveAndExit = async () => {
        try {
            const m = metricsRef.current;
            const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
            
            const accuracy = calculateCognitiveAccuracy(m.correctCheckpoints, m.correctCheckpoints + m.wrongCheckpoints);
            const peakForce = getPeakGripForce(m.jumpPressures);
            const enduranceDrop = calculateEnduranceDrop(m.jumpPressures);

            await saveGameSession({
                userId: "pat_mock_123",
                protocolId: "prot_mock_456",
                gameId: "sky_memory",
                timestamp: Timestamp.now(),
                durationSeconds: durationSeconds,
                targetHand: "right",
                metrics: {
                    cognitiveAccuracyPercent: accuracy,
                    peakGripForce: peakForce,
                    muscleEnduranceDropPercent: enduranceDrop,
                }
            });

            console.log("Session saved successfully!");
            router.push('/patients/home');
        } catch (error) {
            console.error("Failed to save:", error);
            router.push('/patients/home');
        }
    };

    const pInfo = {
        hex: pressDisp < IDLE_THRESHOLD ? '#64748b' : 
             pressDisp < DANGER_THRESHOLD * 0.60 ? '#2DD4BF' :
             pressDisp < DANGER_THRESHOLD * 0.85 ? '#FACC15' : '#EF4444',
        label: pressDisp < IDLE_THRESHOLD ? 'IDLE' :
               pressDisp < DANGER_THRESHOLD * 0.60 ? 'GOOD' :
               pressDisp < DANGER_THRESHOLD * 0.85 ? 'HIGH' : 'DANGER'
    };
    const pctBar = Math.min(100, (pressDisp / DANGER_THRESHOLD) * 100);

    // ── RENDER ────────────────────────────────────────────────────────────────
    return (
        <div id="skymemory-root">
            <style>{GAME_CSS}</style>
            <canvas ref={canvasRef} />

            {/* ── DEVICE BADGE ── */}
            <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 60 }}>
                {isConnected ? (
                    <button onClick={disconnectSerial} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(16,200,128,0.13)', border: '1px solid rgba(52,211,153,0.40)', padding: '7px 15px', borderRadius: 999, cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                        <Wifi size={13} style={{ color: '#34d399' }} />
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: '#34d399' }}>Connected</span>
                    </button>
                ) : (
                    <button onClick={connectSerial} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(239,68,68,0.13)', border: '1px solid rgba(248,113,113,0.40)', padding: '7px 15px', borderRadius: 999, cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                        <WifiOff size={13} style={{ color: '#f87171' }} />
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: '#f87171' }}>Connect Device</span>
                    </button>
                )}
            </div>

            {/* ── EXIT BUTTON ── */}
            <button onClick={handleExit} style={{ position: 'absolute', top: 14, left: 14, zIndex: 60, display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', padding: '8px 16px', borderRadius: 999, color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase', cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'background .2s' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')} onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}>
                <RotateCcw size={13} /> EXIT
            </button>

            {/* ── MENU ── */}
            {uiState === 'MENU' && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(30, 58, 138, 0.7)', backdropFilter: 'blur(3px)', zIndex: 20 }}>
                    <div style={{ animation: 'menuin 0.48s cubic-bezier(0.22,1,0.36,1) both', background: 'rgba(30, 58, 138, 0.95)', border: '1.5px solid rgba(167, 139, 250, 0.40)', borderRadius: 26, padding: '38px 42px', maxWidth: 520, width: '90%', textAlign: 'center', backdropFilter: 'blur(22px)', boxShadow: '0 0 70px rgba(139,92,246,0.2),0 32px 80px rgba(0,0,0,0.60)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', left: 0, right: 0, height: '32%', background: 'linear-gradient(to bottom,transparent,rgba(167,139,250,0.04),transparent)', animation: 'scanline 7s linear infinite', pointerEvents: 'none' }} />

                        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#A78BFA', letterSpacing: '0.05em', margin: '0 0 5px', textShadow: '0 0 28px rgba(167,139,250,0.50)' }}>
                            {settings.name.toUpperCase()}
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', margin: '0 0 26px' }}>
                            Level {gameLevel} · Memory Training
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11, marginBottom: 26, textAlign: 'left' }}>
                            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                                    <Hand size={17} style={{ color: '#A78BFA' }} /><span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>CONTROLS</span>
                                </div>
                                {isConnected ? (<>
                                    <p style={{ color: 'rgba(255,255,255,0.58)', fontSize: 11.5, lineHeight: 1.65, margin: 0 }}>Squeeze to fly up.</p>
                                    <p style={{ color: 'rgba(255,255,255,0.58)', fontSize: 11.5, lineHeight: 1.65, margin: 0 }}>Release to dive down.</p>
                                    <p style={{ color: '#FACC15', fontSize: 10.5, marginTop: 5 }}>Don't over-squeeze!</p>
                                </>) : (<>
                                    <p style={{ color: 'rgba(255,255,255,0.58)', fontSize: 11.5, lineHeight: 1.65, margin: 0 }}>Hold <strong style={{ color: '#A78BFA' }}>SPACE</strong> to fly up.</p>
                                    <p style={{ color: 'rgba(255,255,255,0.58)', fontSize: 11.5, lineHeight: 1.65, margin: 0 }}>Release to dive down.</p>
                                    <p style={{ color: 'rgba(255,255,255,0.20)', fontSize: 10, marginTop: 5 }}>Connect device for hardware mode</p>
                                </>)}
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                                    <Brain size={17} style={{ color: '#F472B6' }} /><span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>GOAL</span>
                                </div>
                                <p style={{ color: 'rgba(255,255,255,0.58)', fontSize: 11.5, lineHeight: 1.65, margin: 0, marginBottom: 6 }}>
                                    Watch the color sequence on each gate.
                                </p>
                                <p style={{ color: 'rgba(255,255,255,0.58)', fontSize: 11.5, lineHeight: 1.65, margin: 0 }}>
                                    Pass through in the <span style={{ color: '#F472B6' }}>correct order</span>!
                                </p>
                            </div>
                        </div>

                        <button onClick={startSession} style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)', color: '#fff', border: 'none', borderRadius: 999, padding: '15px 50px', fontSize: 17, fontWeight: 900, letterSpacing: '0.07em', cursor: 'pointer', boxShadow: '0 0 38px rgba(139,92,246,0.50)', display: 'inline-flex', alignItems: 'center', gap: 11, transition: 'transform .14s' }} onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')} onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '38%', height: '100%', background: 'rgba(255,255,255,0.32)', animation: 'shimmer 1.9s ease-in-out infinite', pointerEvents: 'none' }} />
                            <Play size={20} fill="#fff" style={{ position: 'relative', zIndex: 1 }} />
                            <span style={{ position: 'relative', zIndex: 1 }}>START MISSION</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ── GAME OVER ── */}
            {uiState === 'GAME_OVER' && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(7px)', zIndex: 20 }}>
                    <div style={{ background: 'rgba(30, 41, 59, 0.96)', border: '1.5px solid rgba(239,68,68,0.50)', borderRadius: 26, padding: '38px 48px', textAlign: 'center', boxShadow: '0 0 44px rgba(239,68,68,0.15)', animation: 'menuin 0.32s ease both' }}>
                        <div style={{ fontSize: 48, marginBottom: 10 }}>💥</div>
                        <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 900, marginBottom: 7, marginTop: 0 }}>
                            Mission Failed!
                        </h2>
                        <div style={{ marginBottom: 20, textAlign: 'left', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '16px 20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Score</span>
                                <span style={{ color: '#A78BFA', fontWeight: 700, fontSize: 14 }}>{score}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Best Streak</span>
                                <span style={{ color: '#FACC15', fontWeight: 700, fontSize: 14 }}>{streak}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Level</span>
                                <span style={{ color: '#22C55E', fontWeight: 700, fontSize: 14 }}>{level}</span>
                            </div>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 26, fontSize: 12 }}>
                            Don't give up! Try again to improve your score.
                        </p>
                        <button onClick={() => { setShowExit(false); startSession(); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: '#A78BFA', color: '#fff', border: 'none', borderRadius: 999, padding: '12px 34px', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 22px rgba(139,92,246,0.40)', marginRight: 12 }}>
                            <RotateCcw size={16} /> Try Again
                        </button>
                        <button onClick={handleSaveAndExit} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', borderRadius: 999, padding: '12px 34px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                            Exit
                        </button>
                    </div>
                </div>
            )}

            {/* ── PLAYING HUD ── */}
            {(uiState === 'PLAYING') && (
                <>
                    {/* Score + Streak */}
                    <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 10, zIndex: 30, pointerEvents: 'none', animation: 'hudin 0.38s ease both' }}>
                        <div style={{ background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(16px)', border: '1px solid rgba(139,92,246,0.30)', borderRadius: 999, padding: '7px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 22px rgba(0,0,0,0.38)' }}>
                            <span style={{ fontSize: 8.5, color: '#A78BFA', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase' }}>Score</span>
                            <span style={{ fontSize: 24, fontFamily: 'monospace', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
                                {score.toString().padStart(4, '0')}
                            </span>
                        </div>
                        <div style={{ background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(16px)', border: '1px solid rgba(244,114,182,0.30)', borderRadius: 999, padding: '7px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 22px rgba(0,0,0,0.38)' }}>
                            <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.36)', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase' }}>Streak</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, lineHeight: 1.1 }}>
                                <Target size={13} style={{ color: streak > 2 ? '#F472B6' : '#4B5563' }} />
                                <span style={{ fontSize: 24, fontWeight: 900, color: streak > 2 ? '#F472B6' : '#fff', transition: 'color .35s' }}>{streak}</span>
                            </div>
                        </div>
                    </div>

                    {/* Sequence Display (DISABLED) */}
{false && (
                        <div style={{ position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 35, animation: 'hudin 0.3s ease both' }}>
                            <div style={{ background: 'rgba(30, 41, 59, 0.9)', border: '2px solid rgba(139,92,246,0.60)', borderRadius: 16, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 0 30px rgba(139,92,246,0.3)' }}>
                            </div>
                        </div>
                    )}


                    {/* Pressure gauge */}
                    {isConnected && (
                        <div style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, pointerEvents: 'none' }}>
                            <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.30)', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase' }}>Grip Pressure</span>
                            <div style={{ width: 190, height: 9, background: 'rgba(255,255,255,0.07)', borderRadius: 999, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.10)' }}>
                                <div style={{ height: '100%', width: `${pctBar}%`, background: pInfo.hex, borderRadius: 999, transition: 'width .08s,background .18s', boxShadow: `0 0 9px ${pInfo.hex}` }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ fontSize: 9.5, fontFamily: 'monospace', color: pInfo.hex, fontWeight: 700 }}>{pressDisp.toFixed(2)} V</span>
                                <span style={{ fontSize: 7.5, color: pInfo.hex, fontWeight: 700, letterSpacing: '0.14em', background: `${pInfo.hex}1a`, border: `1px solid ${pInfo.hex}38`, borderRadius: 4, padding: '1px 5px' }}>{pInfo.label}</span>
                            </div>
                        </div>

                    )}

                    {/* Feedback toast */}
                    {feedback && (
                        <div style={{ position: 'absolute', top: '19%', left: '50%', zIndex: 40, animation: 'feedin 2s ease-in-out both', pointerEvents: 'none' }}>
                            <div style={{ background: 'rgba(30, 41, 59, 0.93)', color: feedback.color, border: `1px solid ${feedback.color}48`, borderRadius: 999, padding: '9px 26px', fontWeight: 700, fontSize: 15, backdropFilter: 'blur(16px)', boxShadow: `0 0 22px ${feedback.color}38`, whiteSpace: 'nowrap' }}>
                                {feedback.text}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── COUNTDOWN ── */}
            {uiCd !== null && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 50, fontSize: uiCd === 'GO!' ? '6.5rem' : '9.5rem', fontWeight: 900, color: uiCd === 'GO!' ? '#A78BFA' : '#A78BFA', textShadow: `0 0 55px ${uiCd === 'GO!' ? 'rgba(139,92,246,0.80)' : 'rgba(167,139,250,0.80)'}`, animation: uiCd === 'GO!' ? 'goburst 0.92s ease-out both' : 'cdpop 0.48s cubic-bezier(0.34,1.56,0.64,1) both', userSelect: 'none', pointerEvents: 'none' }}>
                    {uiCd}
                </div>
            )}

            {/* ── EXIT CONFIRM ── */}
            {showExit && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.90)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                    <div style={{ background: 'rgba(30, 41, 59, 0.98)', padding: '34px 46px', borderRadius: 22, border: '1px solid rgba(255,255,255,0.09)', textAlign: 'center', boxShadow: '0 30px 80px rgba(0,0,0,0.70)', animation: 'menuin 0.28s ease both' }}>
                        <h3 style={{ color: '#fff', marginTop: 0, fontSize: 21, fontWeight: 700 }}>Pause Session?</h3>
                        <p style={{ color: 'rgba(255,255,255,0.36)', fontSize: 12.5, marginBottom: 26 }}>Progress this session will be saved.</p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button onClick={cancelExit} style={{ padding: '11px 30px', background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', borderRadius: 999, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>Resume</button>
                            <button onClick={handleSaveAndExit} style={{ padding: '11px 30px', background: '#EF4444', border: 'none', color: '#fff', borderRadius: 999, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 20px rgba(239,68,68,0.40)' }}>Save & Exit</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkyMemoryGame;


