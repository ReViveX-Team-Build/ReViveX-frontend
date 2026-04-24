// app/lib/sensors/useMotionSensor.ts

import { useState, useRef, useCallback } from "react";
import { updateHardwareStatus } from "../db/users";

export type MotionStatus =
    | "disconnected"
    | "connecting"
    | "calibrating"
    | "ready"
    | "error";

export interface MotionData {
    x: number;
    y: number;
}

export function useMotionSensor(uid: string = "") {
    const [isConnected, setIsConnected]   = useState(false);
    const [motionStatus, setMotionStatus] = useState<MotionStatus>("disconnected");
    const [motionData, setMotionData]     = useState<MotionData>({ x: 0, y: 0 });

    const portRef        = useRef<SerialPort | null>(null);
    const readerRef      = useRef<ReadableStreamDefaultReader<string> | null>(null);
    const isConnRef      = useRef(false);
    const isClosingRef   = useRef(false); // prevents disconnect loop

    const disconnect = useCallback(async () => {
        if (isClosingRef.current) return; // already closing, ignore
        isClosingRef.current = true;
        isConnRef.current    = false;

        setIsConnected(false);
        setMotionData({ x: 0, y: 0 });
        setMotionStatus("disconnected");

        if (uid) await updateHardwareStatus(uid, "offline");

        // cancel reader first
        if (readerRef.current) {
            try { await readerRef.current.cancel(); } catch { /* ignore */ }
            readerRef.current = null;
        }

        // small gap for stream lock to release
        await new Promise(r => setTimeout(r, 80));

        // then close port
        if (portRef.current) {
            try { await portRef.current.close(); } catch { /* ignore */ }
            portRef.current = null;
        }

        isClosingRef.current = false;
    }, [uid]);

    const readLoop = useCallback(async (reader: ReadableStreamDefaultReader<string>) => {
        let buffer = "";
        try {
            while (isConnRef.current) {
                const { value, done } = await reader.read();
                if (done) break;
                if (!value) continue;

                buffer += value;
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                    const trimmed = line.trim();

                    if (trimmed === "CALIBRATING") { setMotionStatus("calibrating"); continue; }
                    if (trimmed === "READY")       { setMotionStatus("ready"); setIsConnected(true); continue; }
                    if (trimmed.startsWith("ERROR")) { setMotionStatus("error"); continue; }

                    const parts = trimmed.split(",");
                    if (parts.length === 2) {
                        const x = parseFloat(parts[0]);
                        const y = parseFloat(parts[1]);
                        if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y) && x >= -2 && x <= 2 && y >= -2 && y <= 2) {
                            const dz = 0.04;
                            setMotionData({
                                x: Math.abs(x) < dz ? 0 : x,
                                y: Math.abs(y) < dz ? 0 : y,
                            });
                            setMotionStatus("ready");
                            setIsConnected(true);
                        }
                    }
                }
            }
        } catch {
            // stream closed or cancelled — this is expected on disconnect, do nothing
        }
    }, []);

    const connect = useCallback(async () => {
        if (isConnRef.current || isClosingRef.current) return;

        try {
            if (!navigator.serial) {
                alert("Web Serial API not supported. Please use Chrome or Edge.");
                return;
            }

            setMotionStatus("connecting");

            const port = await navigator.serial.requestPort();
            if (!port.readable) {
                await port.open({ baudRate: 115200 });
            }

            portRef.current   = port;
            isConnRef.current = true;
            setMotionStatus("calibrating");

            // fallback — if READY never arrives, force ready after 4s
            setTimeout(() => {
                setMotionStatus(prev => prev === "calibrating" ? "ready" : prev);
                setIsConnected(prev => prev ? prev : true);
            }, 4000);

            if (uid) await updateHardwareStatus(uid, "connected");

            if (port.readable) {
                const decoder = new TextDecoderStream();
                port.readable.pipeTo(decoder.writable).catch(() => {});
                const reader = decoder.readable.getReader();
                readerRef.current = reader;
                void readLoop(reader);
            }
        } catch (error: unknown) {
            const name = (error as Error)?.name;
            if (name === "NotFoundError" || name === "AbortError") {
                setMotionStatus("disconnected");
                return;
            }
            console.error("Motion sensor connect error:", error);
            setMotionStatus("error");
        }
    }, [uid, readLoop]);

    const getMotion = useCallback(() => motionData, [motionData]);

    return {
        isConnected,
        isConnRef,
        motionStatus,
        motionData,
        connect,
        disconnect,
        getMotion,
    };
}