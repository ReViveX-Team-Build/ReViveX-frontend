"use client";

import { useState, useEffect } from "react";
import { getConversationHistory, saveMessage, ChatMessage } from "../db/conversations";

export function useAiCompanion(uid: string) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load chat history when component mounts
    useEffect(() => {
        if (!uid) return;

        async function loadHistory() {
            const history = await getConversationHistory(uid);
            setMessages(history);
        }

        loadHistory();
    }, [uid]);

    const sendMessage = async (content: string) => {
        if (!content.trim() || !uid) return;

        const userMessage: ChatMessage = {
            userId: uid,
            role: "user",
            content,
            timestamp: null as any
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        try {
            // Save user message
            await saveMessage(uid, "user", content);

            const response = await fetch("/api/llm", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: content,
                    uid
                })
            });

            const data = await response.json();

            if (data.reply) {
                const aiMessage: ChatMessage = {
                    userId: uid,
                    role: "model",
                    content: data.reply,
                    timestamp: null as any
                };

                setMessages((prev) => [...prev, aiMessage]);

                // Save AI response
                await saveMessage(uid, "model", data.reply);
            }

        } catch (error) {
            console.error("Chat error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return { messages, sendMessage, isLoading };
}