"use client";

import { useState, useEffect } from "react";
import { getConversationHistory, saveMessage, ChatMessage } from "../db/conversations";

export type AiRole = "patient" | "doctor";
export type AiMode =
    | "chat"
    | "weekly_analysis"
    | "home_insight"
    | "progress_insight"
    | "weekly_summary"
    | "triage";

export function useAiCompanion(uid: string, role: AiRole = "patient") {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setMessages([]);
        if (!uid) return;
        getConversationHistory(uid)
            .then(setMessages)
            .catch((err) => console.error("Failed to load history:", err));
    }, [uid]);

    const sendMessage = async (content: string, mode: AiMode = "chat") => {
        if (!content.trim() || !uid) return;

        setMessages((prev) => [...prev, {
            userId: uid, role: "user", content, timestamp: null as any,
        }]);
        setIsLoading(true);

        const endpoint = role === "doctor" ? "/api/llm/doctor" : "/api/llm/patient";

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: content, uid, mode }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error ?? `HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.reply) {
                await saveMessage(uid, "user", content);
                await saveMessage(uid, "model", data.reply);
                setMessages((prev) => [...prev, {
                    userId: uid, role: "model", content: data.reply, timestamp: null as any,
                }]);
            } else if (data.error) {
                setMessages((prev) => [...prev, {
                    userId: uid, role: "model", content: `⚠ ${data.error}`, timestamp: null as any,
                }]);
            }
        } catch (error: any) {
            setMessages((prev) => [...prev, {
                userId: uid, role: "model",
                content: `⚠ ${error.message ?? "Could not connect to AI. Please try again."}`,
                timestamp: null as any,
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return { messages, sendMessage, isLoading };
}