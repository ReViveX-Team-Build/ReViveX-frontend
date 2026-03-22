// app/lib/context/HardwareContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface HardwareContextType {
    isConnected: boolean;
    setIsConnected: (val: boolean) => void;
}

const HardwareContext = createContext<HardwareContextType>({
    isConnected: false,
    setIsConnected: () => {},
});

export function HardwareProvider({ children }: { children: ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);

    return (
        <HardwareContext.Provider value={{ isConnected, setIsConnected }}>
            {children}
        </HardwareContext.Provider>
    );
}

export function useHardware() {
    return useContext(HardwareContext);
}