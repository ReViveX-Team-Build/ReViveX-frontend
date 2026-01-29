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

    if (bgRef.current) {
      nightFactor = bgRef.current.update(elapsed);
      bgRef.current.draw(ctx, nightFactor);
      sandHeight = bgRef.current.sandHeight;
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
