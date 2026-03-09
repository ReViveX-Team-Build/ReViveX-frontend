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

    // Load chat history when component mounts or uid changes
    useEffect(() => {
        if (!uid) return;

        async function loadHistory() {
            const history = await getConversationHistory(uid);
            setMessages(history);
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

        // Select correct API route
        const endpoint =
            role === "doctor" ? "/api/llm/doctor" : "/api/llm/patient";

        try {
            // Save user message to Firestore
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

            const data = await response.json();

            if (data.reply) {
                const aiMessage: ChatMessage = {
                    userId: uid,
                    role: "model",
                    content: data.reply,
                    timestamp: null as any
                };

                setMessages((prev) => [...prev, aiMessage]);

                // Save AI reply
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