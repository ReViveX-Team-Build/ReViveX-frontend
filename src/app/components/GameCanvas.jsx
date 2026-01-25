"use client";

import React, { useRef, useEffect } from "react";
import { Player } from "../game-core/Player";
import { Background } from "../game-core/Background";
import { SeaGrass } from "../game-core/SeaGrass";

const GameCanvas = () => {
    const canvasRef = useRef(null);
    const requestRef = useRef();

    const playerRef = useRef(null);
    const bgRef = useRef(null);
    const grassRef = useRef(null);
    const startTimeRef = useRef(Date.now());
    const inputRef = useRef(false);

    const animate = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        const currentTime = Date.now();
        const elapsedTime = currentTime - startTimeRef.current;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let nightFactor = 0;
        let currentSandHeight = 50; 

        if (bgRef.current) {
            nightFactor = bgRef.current.update(elapsedTime);
            currentSandHeight = bgRef.current.sandHeight;
            bgRef.current.draw(ctx, nightFactor);
        }

        if (grassRef.current) {
            grassRef.current.update();
            grassRef.current.draw(ctx);
        }

        if (playerRef.current) {
            playerRef.current.update(inputRef.current, 16, currentSandHeight);
            playerRef.current.draw(ctx);
        }

        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = 1024;
        canvas.height = 600;

        playerRef.current = new Player(canvas.width, canvas.height);
        bgRef.current = new Background(canvas.width, canvas.height);
        grassRef.current = new SeaGrass(canvas.width, canvas.height);
        
        requestRef.current = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => { if (e.code === "Space") { e.preventDefault(); inputRef.current = true; } };
        const handleKeyUp = (e) => { if (e.code === "Space") inputRef.current = false; };
        
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    return (
        <canvas 
            ref={canvasRef} 
            style={{
                border: "2px solid #00FFFF",
                borderRadius: "12px",
                boxShadow: "0 0 20px rgba(0, 255, 255, 0.2)",
                maxWidth: "100%"
            }}
        />
    );
};

export default GameCanvas;
