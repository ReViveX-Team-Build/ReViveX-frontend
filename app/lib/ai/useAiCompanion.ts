"use client";

import { useState, useEffect } from "react";
import { getConversationHistory, saveMessage, ChatMessage } from "../db/conversations";

export type AiRole = "patient" | "doctor";

export type AiMode =
    | "chat"
    | "weekly_analysis"
    | "progress_insight"
    | "triage"
    | "weekly_summary";

export function useAiCompanion(uid: string, role: AiRole = "patient") {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load chat history
    useEffect(() => {
        if (!uid) return;

        async function loadHistory() {
            try {
                const history = await getConversationHistory(uid);
                setMessages(history);
            } catch (error) {
                console.error("Failed to load chat history:", error);
            }
        }

        loadHistory();
    }, [uid]);

    const sendMessage = async (content: string, mode: AiMode = "chat") => {
        if (!content.trim() || !uid) return;

        const userMessage: ChatMessage = {
            userId: uid,
            role: "user",
            content,
            timestamp: null as any
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        const endpoint =
            role === "doctor" ? "/api/llm/doctor" : "/api/llm/patient";

        try {
            // Save user message
            await saveMessage(uid, "user", content);

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: content,
                    uid,
                    mode
                })
            });

            if (!response.ok) {
                throw new Error("AI service unavailable");
            }

            const data = await response.json();

            if (data.reply) {
                const aiMessage: ChatMessage = {
                    userId: uid,
                    role: "model",
                    content: data.reply,
                    timestamp: null as any
                };

                setMessages((prev) => [...prev, aiMessage]);

                await saveMessage(uid, "model", data.reply);
            } else {
                throw new Error("Invalid AI response");
            }

        } catch (error: any) {
            console.error("Chat error:", error);

            const errorMessage: ChatMessage = {
                userId: uid,
                role: "model",
                content: "Sorry, the AI assistant is currently unavailable. Please try again.",
                timestamp: null as any
            };

            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return { messages, sendMessage, isLoading };
}