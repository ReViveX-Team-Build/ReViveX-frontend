"use client";

// components/GameCanvas/gravitydrift/index.tsx

import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionSensor } from "@/app/lib/sensors/useMotionSensor";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Vec2 { x: number; y: number; }

interface Asteroid {
    pos: Vec2; vel: Vec2;
    radius: number; rot: number; rotV: number;
    shape: { a: number; dr: number }[];
}

interface SafeZone {
    pos: Vec2; radius: number;
    pulse: number; type: "score" | "bonus";
    collected: boolean;
}

interface Particle {
    pos: Vec2; vel: Vec2;
    life: number; decay: number;
    radius: number; color: string;
}

interface Star {
    x: number; y: number;
    r: number; bright: number;
    twinkle: number; speed: number;
}

interface GameState {
    phase: "menu" | "playing" | "over";
    level: number;
    score: number;
    lives: number;
    combo: number;
    invincible: number;
    frame: number;
    stability: number;
}

// ─── Level config ─────────────────────────────────────────────────────────────

const LEVELS = [
    { asteroids: 3,  speed: 0.5, zoneRadius: 0.06,  label: "0.5×", desc: "Gentle — wide corridors" },
    { asteroids: 5,  speed: 0.8, zoneRadius: 0.05,  label: "0.8×", desc: "Moderate — more obstacles" },
    { asteroids: 8,  speed: 1.2, zoneRadius: 0.044, label: "1.2×", desc: "Challenging — faster rocks" },
    { asteroids: 12, speed: 1.8, zoneRadius: 0.038, label: "1.8×", desc: "Advanced — precision required" },
    { asteroids: 16, speed: 2.4, zoneRadius: 0.032, label: "2.4×", desc: "Expert — maximum control" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const dist2d = (a: Vec2, b: Vec2, W: number, H: number) =>
    Math.hypot((a.x - b.x) * W, (a.y - b.y) * H);

function makeAsteroid(speed: number): Asteroid {
    const angle = Math.random() * Math.PI * 2;
    const v = (0.0006 + Math.random() * 0.0008) * speed;
    let x: number, y: number;
    do { x = Math.random(); y = Math.random(); }
    while (Math.hypot(x - 0.5, y - 0.5) < 0.25);
    const sides = 7 + Math.floor(Math.random() * 5);
    const shape = Array.from({ length: sides }, (_, i) => ({
        a: (i / sides) * Math.PI * 2,
        dr: 0.55 + Math.random() * 0.45,
    }));
    return {
        pos: { x, y },
        vel: { x: Math.cos(angle) * v, y: Math.sin(angle) * v },
        radius: 0.016 + Math.random() * 0.02,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.012,
        shape,
    };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface GravityDriftProps {
    uid?: string; // pass logged-in patient uid for hardware status tracking
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GravityDrift({ uid = "" }: GravityDriftProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapRef   = useRef<HTMLDivElement>(null);
    const rafRef    = useRef<number>(0);

    const world = useRef({
        asteroids:    [] as Asteroid[],
        safeZones:    [] as SafeZone[],
        particles:    [] as Particle[],
        stars:        [] as Star[],
        trail:        [] as Vec2[],
        ship:         { x: 0.5, y: 0.5 } as Vec2,
        target:       { x: 0.5, y: 0.5 } as Vec2,
        tremorHist:   [] as number[],
        lastTarget:   { x: 0.5, y: 0.5 } as Vec2,
        lvlScoreMark: -1,
        W: 800,
        H: 500,
    });

    const [gs, setGs] = useState<GameState>({
        phase: "menu", level: 1, score: 0,
        lives: 3, combo: 1, invincible: 0, frame: 0, stability: 50,
    });
    const gsRef = useRef(gs);

    useEffect(() => {
        gsRef.current = gs;
    }, [gs]);

    const { isConnected, motionStatus, motionData, connect, disconnect } =
        useMotionSensor(uid);

    // Sensor → target
    useEffect(() => {
        if (!isConnected) return;
        world.current.target.x = clamp(0.5 + motionData.x, 0.02, 0.98);
        world.current.target.y = clamp(0.5 + motionData.y, 0.02, 0.98);
    }, [motionData, isConnected]);

    // Mouse / touch fallback
    const handlePointer = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        if (isConnected) return;
        const r = e.currentTarget.getBoundingClientRect();
        world.current.target.x = clamp((e.clientX - r.left) / r.width,  0.02, 0.98);
        world.current.target.y = clamp((e.clientY - r.top)  / r.height, 0.02, 0.98);
    }, [isConnected]);

    const emit = useCallback((pos: Vec2, count: number, color: string, spd = 1) => {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const v = (0.003 + Math.random() * 0.006) * spd;
            world.current.particles.push({
                pos: { ...pos }, vel: { x: Math.cos(a) * v, y: Math.sin(a) * v },
                life: 1, decay: 0.02 + Math.random() * 0.03,
                radius: 1 + Math.random() * 3, color,
            });
        }
    }, []);

    const initStars = useCallback(() => {
        world.current.stars = Array.from({ length: 130 }, () => ({
            x: Math.random(), y: Math.random(),
            r: Math.random() * 1.5 + 0.3,
            bright: Math.random(),
            twinkle: Math.random() * Math.PI * 2,
            speed: 0.00004 + Math.random() * 0.0001,
        }));
    }, []);

    const buildLevel = useCallback((lvl: number) => {
        const lc = LEVELS[Math.min(lvl - 1, LEVELS.length - 1)];
        world.current.asteroids    = Array.from({ length: lc.asteroids }, () => makeAsteroid(lc.speed));
        world.current.safeZones    = [];
        world.current.particles    = [];
        world.current.trail        = [];
        world.current.lvlScoreMark = -1;
    }, []);

    const startGame = useCallback((lvl = 1) => {
        world.current.ship       = { x: 0.5, y: 0.5 };
        world.current.target     = { x: 0.5, y: 0.5 };
        world.current.tremorHist = [];
        world.current.lastTarget = { x: 0.5, y: 0.5 };
        initStars();
        buildLevel(lvl);
        setGs({ phase: "playing", level: lvl, score: 0, lives: 3, combo: 1, invincible: 0, frame: 0, stability: 50 });
    }, [initStars, buildLevel]);

    // ── Main loop ─────────────────────────────────────────────────────────────

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const w = world.current;

        const resize = () => {
            const wrap = wrapRef.current;
            if (!wrap) return;
            w.W = wrap.clientWidth;
            w.H = wrap.clientHeight;
            canvas.width  = w.W;
            canvas.height = w.H;
        };
        resize();
        window.addEventListener("resize", resize);
        initStars();

        const drawStars = () => {
            w.stars.forEach(s => {
                s.x -= s.speed;
                if (s.x < 0) { s.x = 1; s.y = Math.random(); }
                s.twinkle += 0.035;
                const a = 0.25 + 0.5 * Math.abs(Math.sin(s.twinkle)) * s.bright;
                ctx.beginPath();
                ctx.arc(s.x * w.W, s.y * w.H, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200,228,255,${a})`;
                ctx.fill();
            });
        };

        const drawAsteroid = (a: Asteroid) => {
            const px = a.pos.x * w.W, py = a.pos.y * w.H, pr = a.radius * w.W;
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(a.rot);
            ctx.beginPath();
            a.shape.forEach((pt, i) => {
                const r2 = pr * pt.dr;
                i === 0
                    ? ctx.moveTo(Math.cos(pt.a) * r2, Math.sin(pt.a) * r2)
                    : ctx.lineTo(Math.cos(pt.a) * r2, Math.sin(pt.a) * r2);
            });
            ctx.closePath();
            ctx.fillStyle = "rgba(95,75,55,0.65)";
            ctx.fill();
            ctx.strokeStyle = "rgba(195,155,95,0.75)";
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.restore();
        };

        const drawShip = (ship: Vec2, target: Vec2, inv: number, frame: number) => {
            if (inv > 0 && Math.floor(inv / 6) % 2 === 0) return;
            const sx = ship.x * w.W, sy = ship.y * w.H;
            const dx = target.x * w.W - sx, dy = target.y * w.H - sy;
            const angle = Math.hypot(dx, dy) > 3
                ? Math.atan2(dy, dx) + Math.PI / 2
                : Math.PI / 2;
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(angle);
            const flick = 0.5 + 0.5 * Math.sin(frame * 0.3);
            ctx.fillStyle = `rgba(125,211,252,${0.4 + flick * 0.4})`;
            ctx.beginPath();
            ctx.moveTo(-4, 8); ctx.lineTo(4, 8); ctx.lineTo(0, 16 + flick * 5);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(0, -14); ctx.lineTo(9, 10); ctx.lineTo(0, 6); ctx.lineTo(-9, 10);
            ctx.closePath();
            ctx.fillStyle = "#7dd3fc";
            ctx.fill();
            ctx.strokeStyle = "#e0f2fe";
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, -4, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = "#0ea5e9";
            ctx.fill();
            ctx.restore();
        };

        const drawSafeZone = (z: SafeZone) => {
            z.pulse += 0.06;
            const px = z.pos.x * w.W, py = z.pos.y * w.H;
            const pr = z.radius * w.W;
            const col = z.type === "bonus" ? "253,230,138" : "74,222,128";
            const pulse = Math.sin(z.pulse);
            const outerR = Math.max(2, pr + pulse * 4);
            ctx.beginPath();
            ctx.arc(px, py, outerR, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${col},${0.4 + 0.3 * pulse})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(px, py, Math.max(1, outerR * 0.5), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${col},0.07)`;
            ctx.fill();
            ctx.font = "9px monospace";
            ctx.fillStyle = `rgba(${col},0.9)`;
            ctx.textAlign = "center";
            ctx.fillText(z.type === "bonus" ? "BONUS" : "SAFE", px, py + 3);
        };

        const tick = () => {
            const g = gsRef.current;

            if (g.phase !== "playing") {
                ctx.fillStyle = "#020c1b";
                ctx.fillRect(0, 0, w.W, w.H);
                drawStars();
                rafRef.current = requestAnimationFrame(tick);
                return;
            }

            const lc = LEVELS[Math.min(g.level - 1, LEVELS.length - 1)];

            // Tremor measurement
            const dx = w.target.x - w.lastTarget.x;
            const dy = w.target.y - w.lastTarget.y;
            w.tremorHist.push(Math.hypot(dx, dy));
            if (w.tremorHist.length > 60) w.tremorHist.shift();
            const avg = w.tremorHist.reduce((s, v) => s + v, 0) / w.tremorHist.length;
            const stability = clamp(100 - avg * 2200, 0, 100);
            w.lastTarget = { ...w.target };

            // Ship movement
            w.ship.x += (w.target.x - w.ship.x) * 0.09;
            w.ship.y += (w.target.y - w.ship.y) * 0.09;
            w.ship.x  = clamp(w.ship.x, 0.02, 0.98);
            w.ship.y  = clamp(w.ship.y, 0.02, 0.98);
            w.trail.push({ ...w.ship });
            if (w.trail.length > 20) w.trail.shift();

            // Asteroids
            w.asteroids.forEach(a => {
                a.pos.x += a.vel.x; a.pos.y += a.vel.y; a.rot += a.rotV;
                if (a.pos.x < -0.1) a.pos.x = 1.1;
                if (a.pos.x > 1.1)  a.pos.x = -0.1;
                if (a.pos.y < -0.1) a.pos.y = 1.1;
                if (a.pos.y > 1.1)  a.pos.y = -0.1;
                if (g.invincible <= 0 && dist2d(a.pos, w.ship, w.W, w.H) < a.radius * w.W + 8) {
                    emit(w.ship, 28, "#f87171", 2);
                    setGs(prev => {
                        const lives = prev.lives - 1;
                        if (lives <= 0) return { ...prev, phase: "over", lives: 0, invincible: 0 };
                        return { ...prev, lives, invincible: 120, combo: 1 };
                    });
                }
            });

            // Safe zones
            if (g.frame % 200 === 0 && w.safeZones.length < 2) {
                let zx = 0.15 + Math.random() * 0.7;
                let zy = 0.15 + Math.random() * 0.7;
                let attempts = 0;
                while (attempts < 20 && w.asteroids.some(a => dist2d(a.pos, { x: zx, y: zy }, w.W, w.H) < w.W * 0.12)) {
                    zx = 0.15 + Math.random() * 0.7;
                    zy = 0.15 + Math.random() * 0.7;
                    attempts++;
                }
                w.safeZones.push({
                    pos: { x: zx, y: zy },
                    radius: lc.zoneRadius,
                    pulse: 0,
                    type: Math.random() < 0.3 ? "bonus" : "score",
                    collected: false,
                });
            }

            w.safeZones.forEach(z => {
                if (!z.collected && dist2d(z.pos, w.ship, w.W, w.H) < z.radius * w.W + 8) {
                    z.collected = true;
                    const pts = z.type === "bonus" ? 50 * g.combo : 10 * g.combo;
                    emit(z.pos, 22, z.type === "bonus" ? "#fde68a" : "#4ade80", 1.5);
                    setGs(prev => ({
                        ...prev,
                        score: prev.score + pts,
                        combo: z.type === "bonus" ? Math.min(prev.combo + 1, 5) : prev.combo,
                    }));
                }
            });
            w.safeZones = w.safeZones.filter(z => !z.collected);

            w.particles.forEach(p => { p.pos.x += p.vel.x; p.pos.y += p.vel.y; p.vel.y -= 0.00005; p.life -= p.decay; });
            w.particles = w.particles.filter(p => p.life > 0);

            // Level up
            const scoreMark = Math.floor(g.score / 280);
            if (scoreMark > 0 && scoreMark !== w.lvlScoreMark && g.level < LEVELS.length) {
                w.lvlScoreMark = scoreMark;
                buildLevel(Math.min(g.level + 1, LEVELS.length));
                setGs(prev => ({ ...prev, level: Math.min(prev.level + 1, LEVELS.length), combo: Math.min(prev.combo + 1, 5) }));
            }

            // Draw
            ctx.fillStyle = "#020c1b";
            ctx.fillRect(0, 0, w.W, w.H);
            const nb = ctx.createRadialGradient(w.W * 0.3, w.H * 0.4, 0, w.W * 0.5, w.H * 0.5, w.W * 0.75);
            nb.addColorStop(0, "rgba(30,50,120,0.18)");
            nb.addColorStop(1, "rgba(2,12,27,0)");
            ctx.fillStyle = nb; ctx.fillRect(0, 0, w.W, w.H);

            drawStars();
            w.safeZones.forEach(drawSafeZone);
            w.particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.pos.x * w.W, p.pos.y * w.H, Math.max(0.5, p.radius * p.life), 0, Math.PI * 2);
                ctx.fillStyle = p.color + Math.floor(p.life * 255).toString(16).padStart(2, "0");
                ctx.fill();
            });
            w.asteroids.forEach(drawAsteroid);
            w.trail.forEach((pt, i) => {
                ctx.beginPath();
                ctx.arc(pt.x * w.W, pt.y * w.H, Math.max(0.1, (i / w.trail.length) * 3.5), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(125,211,252,${(i / w.trail.length) * 0.35})`;
                ctx.fill();
            });
            drawShip(w.ship, w.target, g.invincible, g.frame);

            if (g.frame % 6 === 0) {
                setGs(prev => ({
                    ...prev,
                    frame: prev.frame + 6,
                    stability: Math.round(stability),
                    invincible: Math.max(0, prev.invincible - 6),
                }));
            }

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", resize); };
    }, [initStars, buildLevel, emit]);

    const lc = LEVELS[Math.min(gs.level - 1, LEVELS.length - 1)];
    const stabilityColor = gs.stability > 65 ? "bg-green-400" : gs.stability > 35 ? "bg-yellow-400" : "bg-red-400";

    const sensorLabel: Record<string, string> = {
        disconnected: "Connect Sensor",
        connecting:   "Connecting...",
        calibrating:  "Calibrating...",
        ready:        "Sensor Active",
        error:        "Sensor Error",
    };

    return (
        <div ref={wrapRef} className="relative w-full h-full bg-[#020c1b] overflow-hidden">

            {/* HUD */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 bg-[#020c1b]/90 border-b border-cyan-900/40 flex-wrap gap-2 z-20">
                {[
                    { label: "LEVEL", val: String(gs.level) },
                    { label: "SCORE", val: String(gs.score) },
                    { label: "LIVES", val: "♥".repeat(Math.max(0, gs.lives)) },
                    { label: "SPEED", val: lc.label },
                    { label: "COMBO", val: `×${gs.combo}` },
                ].map(({ label, val }) => (
                    <div key={label} className="flex flex-col items-center gap-0.5">
                        <span className="text-[9px] text-cyan-500/50 tracking-widest">{label}</span>
                        <span className="text-sm font-bold text-cyan-300 font-mono">{val}</span>
                    </div>
                ))}

                {/* Stability bar */}
                <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] text-cyan-500/50 tracking-widest">STABILITY</span>
                    <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-100 ${stabilityColor}`}
                            style={{ width: `${gs.stability}%` }}
                        />
                    </div>
                </div>

                {/* Sensor button */}
                <button
                    onClick={isConnected ? disconnect : connect}
                    className={`px-3 py-1 rounded text-[10px] font-mono border transition-colors cursor-pointer
                        ${isConnected
                        ? "bg-green-400/10 border-green-400/40 text-green-400"
                        : "bg-cyan-400/10 border-cyan-400/30 text-cyan-300"
                    }`}
                >
                    {sensorLabel[motionStatus] ?? "Connect Sensor"}
                </button>
            </div>

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                className="w-full h-full block"
                style={{ cursor: "none", touchAction: "none" }}
                onPointerMove={handlePointer}
            />

            {/* Menu overlay */}
            {gs.phase === "menu" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#020c1b]/90 z-20 text-center px-6">
                    <span className="text-[10px] tracking-widest text-cyan-400/60 border border-cyan-400/20 rounded px-3 py-1 mb-4">
                        NEUROMOVEMENT THERAPY
                    </span>
                    <h1 className="text-3xl font-bold text-cyan-300 tracking-widest mb-3 font-mono">
                        GRAVITYDRIFT
                    </h1>
                    <p className="text-xs text-cyan-200/50 max-w-sm leading-relaxed mb-6">
                        {"Motion-controlled space therapy for Parkinson's, stroke & tremor rehabilitation. Tilt the device to guide your ship through asteroid fields."}
                    </p>
                    <button
                        onClick={() => startGame(1)}
                        className="px-8 py-3 bg-cyan-400/20 border border-cyan-400/50 text-cyan-300 rounded font-mono text-sm tracking-widest hover:bg-cyan-400/30 transition-colors cursor-pointer"
                    >
                        BEGIN SESSION
                    </button>
                    <p className="text-[10px] text-cyan-500/30 mt-4">
                        {isConnected ? "ESP32 sensor active" : "Connect ESP32 above or use mouse/touch"}
                    </p>
                </div>
            )}

            {/* Game over overlay */}
            {gs.phase === "over" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#020c1b]/90 z-20 text-center px-6">
                    <span className="text-[10px] tracking-widest text-cyan-400/60 border border-cyan-400/20 rounded px-3 py-1 mb-4">
                        SESSION ENDED
                    </span>
                    <h1 className="text-2xl font-bold text-cyan-300 tracking-widest mb-3 font-mono">
                        GOOD EFFORT
                    </h1>
                    <p className="text-xs text-cyan-200/50 max-w-sm leading-relaxed mb-6">
                        {`Final Score: ${gs.score}`}<br />
                        {`Stability Rating: ${gs.stability}%`}<br /><br />
                        {"Consistency builds neural pathways. Keep practicing."}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => startGame(1)}
                            className="px-6 py-2 bg-cyan-400/20 border border-cyan-400/50 text-cyan-300 rounded font-mono text-sm tracking-widest hover:bg-cyan-400/30 transition-colors cursor-pointer"
                        >
                            TRY AGAIN
                        </button>
                        <button
                            onClick={() => setGs(prev => ({ ...prev, phase: "menu" }))}
                            className="px-6 py-2 bg-white/5 border border-white/10 text-cyan-300/60 rounded font-mono text-sm tracking-widest hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            MENU
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}