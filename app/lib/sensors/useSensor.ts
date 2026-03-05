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

        const connect = async () => {
        try {
            if (!navigator.serial) {
                alert('Web Serial API not supported. Please use Google Chrome or Microsoft Edge.');
                return;
            }
            const port = await navigator.serial.requestPort();
            if (!port.readable) {
                await port.open({ baudRate: 115200 });
            }
            portRef.current = port;
            setIsConnected(true);
            isConnRef.current = true;

            const textDecoder = new TextDecoderStream();
            port.readable.pipeTo(textDecoder.writable).catch(() => {});
            const reader = textDecoder.readable.getReader();
            readerRef.current = reader;

            readLoop(reader);
        } catch (error: any) {
            if (error.name === 'NotFoundError') {
                console.log('User cancelled device selection.');
                return;
            }
            alert('Could not connect to the sensor. Make sure it is plugged in.');
            console.error(error);
        }
    };