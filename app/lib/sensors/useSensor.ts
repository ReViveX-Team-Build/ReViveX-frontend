// lib/sensors/useSensor.ts
// Manages the Web Serial connection to the ESP32 hardware sensor.


import { useState, useRef, useCallback } from "react";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

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
// writeHardwareStatus — syncs connection state to Firestore users/{uid}
// Called after connect and disconnect so every page reads the real state.
// ─────────────────────────────────────────────────────────────────────────────
async function writeHardwareStatus(
  uid: string,
  status: "connected" | "offline",
  deviceId?: string
) {
  if (!uid) return; // No user logged in yet (e.g. game demo mode)
  try {
    await updateDoc(doc(db, "users", uid), {
      "hardwareStatus.status": status,
      "hardwareStatus.lastSync": Timestamp.now(),
      ...(deviceId ? { "hardwareStatus.deviceId": deviceId } : {}),
    });
  } catch (err) {
    // Non-fatal — sensor still works even if Firestore write fails
    console.warn("Could not update hardware status in Firestore:", err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// useSensor hook
// uid: pass the logged-in user's UID so we can write status to their profile.
//      Pass empty string "" if running in demo/game mode without auth.
// ─────────────────────────────────────────────────────────────────────────────
export function useSensor(uid: string = "") {
  const [isConnected, setIsConnected] = useState(false);
  const [currentPressure, setCurrentPressure] = useState(0);

  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const isConnRef = useRef(false); // Ref copy so readLoop can check without stale closure

  // ── connect ───────────────────────────────────────────────────────────────
  const connect = async () => {
    try {
      if (!navigator.serial) {
        alert(
          "Web Serial API not supported. Please use Google Chrome or Microsoft Edge."
        );
        return;
      }

      const port = await navigator.serial.requestPort();

      // Open only if not already open
      if (!port.readable) {
        await port.open({ baudRate: 115200 });
      }

      portRef.current = port;
      setIsConnected(true);
      isConnRef.current = true;

      // ✅ Write "connected" to Firestore — home page will now show real status
      await writeHardwareStatus(uid, "connected");

      if (port.readable) {
        const textDecoder = new TextDecoderStream();
        port.readable.pipeTo(textDecoder.writable).catch(() => {});
        const reader = textDecoder.readable.getReader();
        readerRef.current = reader;
        readLoop(reader);
      }
    } catch (error: any) {
      if (error.name === "NotFoundError") {
        // User cancelled the port picker — not an error
        return;
      }
      alert("Could not connect to the sensor. Make sure it is plugged in.");
      console.error("Sensor connect error:", error);
    }
  };

  // ── disconnect ────────────────────────────────────────────────────────────
  const disconnect = async () => {
    setIsConnected(false);
    isConnRef.current = false;
    setCurrentPressure(0);

    // ✅ Write "offline" to Firestore immediately on disconnect
    await writeHardwareStatus(uid, "offline");

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
  // Parses incoming serial lines looking for "V:<number>" from the ESP32
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
      // Serial port was closed or device unplugged
      console.error("Sensor read error — disconnecting:", error);
      if (isConnRef.current) {
        // Auto-disconnect cleanly and update Firestore
        await disconnect();
      }
    }
  };

  // Stable getter so game components can sample pressure without re-render
  const getPressure = useCallback(() => currentPressure, [currentPressure]);

  return {
    isConnected,
    isConnRef,
    connect,
    disconnect,
    getPressure,
  };
}