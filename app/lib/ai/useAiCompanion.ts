import { useState } from "react";

export function useAiCompanion() {
    const [messages, setMessages] = useState([]);

    return { messages };
}