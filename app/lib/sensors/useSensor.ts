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