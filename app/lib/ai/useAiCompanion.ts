import { useState } from "react";

export function useAiCompanion() {
    const [messages, setMessages] = useState([])
    const [isLoading, setIsLoading] = useState(false);

    return { messages , isLoading };
}