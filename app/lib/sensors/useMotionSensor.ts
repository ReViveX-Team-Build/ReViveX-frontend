// app/lib/sensors/useMotionSensor.ts
// MPU6050 motion sensor hook for GravityDrift
// Follows the same pattern as useSensor.ts (MPX pressure sensor)

import { useState, useRef, useCallback } from "react";
import { updateHardwareStatus } from "../db/users";

export type MotionStatus =
    | "disconnected"
    | "connecting"
    | "calibrating"
    | "ready"
    | "error";

export interface MotionData {
    x: number; // -1.0 to 1.0 left/right tilt
    y: number; // -1.0 to 1.0 forward/back tilt
}

export function useMotionSensor(uid: string = "") {
    const [isConnected, setIsConnected]   = useState(false);
    const [motionStatus, setMotionStatus] = useState<MotionStatus>("disconnected");
    const [motionData, setMotionData]     = useState<MotionData>({ x: 0, y: 0 });

    const portRef    = useRef<SerialPort | null>(null);
    const readerRef  = useRef<ReadableStreamDefaultReader<string> | null>(null);
    const isConnRef  = useRef(false);

    // ── connect ───────────────────────────────────────────────────────────────
    const connect = async () => {
        try {
            if (!navigator.serial) {
                alert("Web Serial API not supported. Please use Google Chrome or Microsoft Edge.");
                return;
            }

            setMotionStatus("connecting");

            const port = await navigator.serial.requestPort();

            if (!port.readable) {
                await port.open({ baudRate: 115200 });
            }

            portRef.current   = port;
            isConnRef.current = true;
            setIsConnected(true);
            setMotionStatus("calibrating");



            if (port.readable) {
                const textDecoder = new TextDecoderStream();
                port.readable.pipeTo(textDecoder.writable).catch(() => {});
                const reader = textDecoder.readable.getReader();
                readerRef.current = reader;
                void readLoop(reader);
            }
        } catch (error: unknown) {
            const name = (error as Error)?.name;
            if (name === "NotFoundError" || name === "AbortError") {
                setMotionStatus("disconnected");
                return;
            }
            alert("Could not connect to the motion sensor. Make sure the ESP32 is plugged in.");
            console.error("Motion sensor connect error:", error);
            setMotionStatus("error");
        }
    };

    // ── disconnect ────────────────────────────────────────────────────────────
    const disconnect = async () => {
        setIsConnected(false);
        isConnRef.current = false;
        setMotionData({ x: 0, y: 0 });
        setMotionStatus("disconnected");

        await updateHardwareStatus(uid, "offline");

        try {
            if (readerRef.current) {
                await readerRef.current.cancel();
                readerRef.current.releaseLock();
                readerRef.current = null;
            }
            if (portRef.current) {
                await portRef.current.close();
                portRef.current = null;
            }
        } catch (err) {
            console.error("Error during motion sensor disconnect:", err);
        }
    };

    // ── readLoop ──────────────────────────────────────────────────────────────
    const readLoop = async (reader: ReadableStreamDefaultReader<string>) => {
        let buffer = "";
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                if (value) {
                    buffer += value;
                    const lines = buffer.split("\n");
                    buffer = lines.pop() ?? "";

                    for (const line of lines) {
                        const trimmed = line.trim();

                        if (trimmed === "CALIBRATING") {
                            setMotionStatus("calibrating");
                            continue;
                        }
                        if (trimmed === "READY") {
                            setMotionStatus("ready");
                            continue;
                        }
                        if (trimmed.startsWith("ERROR")) {
                            setMotionStatus("error");
                            continue;
                        }

                        // Parse "x,y" format from ESP32
                        const parts = trimmed.split(",");
                        if (parts.length === 2) {
                            const x = parseFloat(parts[0]);
                            const y = parseFloat(parts[1]);
                            if (
                                !isNaN(x) && !isNaN(y) &&
                                isFinite(x) && isFinite(y) &&
                                x >= -2 && x <= 2 &&
                                y >= -2 && y <= 2
                            ) {
                                const deadZone = 0.04;
                                setMotionData({
                                    x: Math.abs(x) < deadZone ? 0 : x,
                                    y: Math.abs(y) < deadZone ? 0 : y,
                                });
                                setMotionStatus("ready");
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Motion sensor read error — disconnecting:", error);
            if (isConnRef.current) {
                await disconnect();
            }
        }
    };

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