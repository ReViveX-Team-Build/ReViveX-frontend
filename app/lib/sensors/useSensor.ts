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

        const disconnect = async () => {
        setIsConnected(false);
        isConnRef.current = false;
        setCurrentPressure(0);
        
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
            console.error('Error during disconnect:', err);
        }
    };

        const readLoop = async (reader: ReadableStreamDefaultReader<string>) => {
        let buffer = '';
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                if (value) {
                    buffer += value;
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    
                    for (const line of lines) {
                        // Assuming your sensor sends data in the format "V:3.14"
                        const match = line.match(/V:([\d.]+)/);
                        if (match) {
                            setCurrentPressure(parseFloat(match[1]));
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Sensor read error:', error);
            disconnect();
        }
    };

        // We expose a getter function so the game loop can fetch the exact pressure instantly
    const getPressure = useCallback(() => {
        return currentPressure;
    }, [currentPressure]);