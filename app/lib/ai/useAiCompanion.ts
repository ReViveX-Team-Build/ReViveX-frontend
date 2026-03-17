"use client";

import { useState, useEffect } from "react";
import { Timestamp } from "firebase/firestore";
import {
  getConversationHistory,
  saveMessage,
  pruneOldMessages,
  ChatMessage,
} from "../db/conversations";

export type AiRole = "patient" | "doctor";
export type AiMode =
  | "chat"
  | "weekly_analysis"
  | "home_insight"
  | "progress_insight"
  | "weekly_summary"
  | "triage";

export function useAiCompanion(uid: string, role: AiRole = "patient") {
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
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

    // Optimistic message with a real timestamp so UI sort doesn't break
    const optimisticMsg: ChatMessage = {
      userId:    uid,
      role:      "user",
      content,
      timestamp: Timestamp.now(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setIsLoading(true);

    const endpoint = role === "doctor" ? "/api/llm/doctor" : "/api/llm/patient";

    try {
      const response = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: content, uid, mode }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error ?? `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.reply) {
        // Persist both turns to Firestore
        await saveMessage(uid, "user",  content);
        await saveMessage(uid, "model", data.reply);

        // Prune old messages to keep ai_conversations lean
        await pruneOldMessages(uid, 50).catch(() => {});

        setMessages((prev) => [
          ...prev,
          {
            userId:    uid,
            role:      "model",
            content:   data.reply,
            timestamp: Timestamp.now(),
          },
        ]);
      } else if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            userId:    uid,
            role:      "model",
            content:   `⚠ ${data.error}`,
            timestamp: Timestamp.now(),
          },
        ]);
      }
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          userId:    uid,
          role:      "model",
          content:   `⚠ ${error.message ?? "Could not connect to AI. Please try again."}`,
          timestamp: Timestamp.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, sendMessage, isLoading };
}