import { useState } from "react";

export type ChatMessage = {
    role: "user" | "model";
    content: string;
};

export function useAiCompanion() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = async (content: string) => {
        if (!content.trim()) return;

        const userMessage: ChatMessage = {
            role: "user",
            content
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const response = await fetch("/api/llm", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ message: content })
            });

            const data = await response.json();

            const aiMessage: ChatMessage = {
                role: "model",
                content: data.reply
            };

            setMessages((prev) => [...prev, aiMessage]);

        } catch (error) {
            console.error("AI request failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return { messages, isLoading, sendMessage };
}