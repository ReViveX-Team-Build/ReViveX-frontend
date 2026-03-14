// lib/sensors/useSensor.ts

import { useState, useRef, useCallback } from "react";
import { updateHardwareStatus } from "../db/users";

// ── Web Serial API type declarations ─────────────────────────────────────────
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

declare global {
  interface Navigator {
    serial?: Serial;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// useSensor hook
// uid: pass the logged-in user's UID so we can write status to their profile.
//      Pass empty string "" if running in demo/game mode without auth.
// ─────────────────────────────────────────────────────────────────────────────
export function useSensor(uid: string = "") {
  const [isConnected, setIsConnected]       = useState(false);
  const [currentPressure, setCurrentPressure] = useState(0);

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

      const port = await navigator.serial.requestPort();

      if (!port.readable) {
        await port.open({ baudRate: 115200 });
      }

      portRef.current  = port;
      setIsConnected(true);
      isConnRef.current = true;

      await updateHardwareStatus(uid, "connected");

      if (port.readable) {
        const textDecoder = new TextDecoderStream();
        port.readable.pipeTo(textDecoder.writable).catch(() => {});
        const reader = textDecoder.readable.getReader();
        readerRef.current = reader;
        readLoop(reader);
      }
    } catch (error: any) {
      if (error.name === "NotFoundError") return;
      alert("Could not connect to the sensor. Make sure it is plugged in.");
      console.error("Sensor connect error:", error);
    }
  };

  // ── disconnect ────────────────────────────────────────────────────────────
  const disconnect = async () => {
    setIsConnected(false);
    isConnRef.current = false;
    setCurrentPressure(0);

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
      console.error("Error during sensor disconnect:", err);
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
            const match = line.match(/V:([\d.]+)/);
            if (match) {
              setCurrentPressure(parseFloat(match[1]));
            }
          }
        }
      }
    } catch (error) {
      console.error("Sensor read error — disconnecting:", error);
      if (isConnRef.current) {
        await disconnect();
      }
    }
  };

  const getPressure = useCallback(() => currentPressure, [currentPressure]);

  return {
    isConnected,
    isConnRef,
    connect,
    disconnect,
    getPressure,
  };
}