import { useState, useRef, useCallback } from 'react';

// Define the Web Serial types for TypeScript
interface SerialPort {
    readonly readable: ReadableStream | null;
    readonly writable: WritableStream | null;
    open(opts: { baudRate: number }): Promise<void>;
    close(): Promise<void>;
}

declare global {
interface Navigator {
serial?: any;
}
}

export function useSensor() {
    const [isConnected, setIsConnected] = useState(false);
    const [currentPressure, setCurrentPressure] = useState(0);

        // We use refs to keep track of these values across renders without triggering infinite loops
    const portRef = useRef<SerialPort | null>(null);
    const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
    const isConnRef = useRef(false);