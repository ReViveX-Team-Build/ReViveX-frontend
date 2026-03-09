import { useState } from "react";

export type ChatMessage = {
    role: "user" | "model";
    content: string;
};

export function useAiCompanion() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = (content: string) => {
        if (!content.trim()) return;

        const userMessage: ChatMessage = {
            role: "user",
            content
        };

        setMessages((prev) => [...prev, userMessage]);
    };

    return { messages, isLoading, sendMessage };
}