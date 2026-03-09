import { useState } from "react";

export type ChatMessage = {
    role: "user" | "model";
    content: string;
}

export function useAiCompanion() {
    const [messages, setMessages] = useState([])
    const [isLoading, setIsLoading] = useState(false);

    return { messages , isLoading };
}