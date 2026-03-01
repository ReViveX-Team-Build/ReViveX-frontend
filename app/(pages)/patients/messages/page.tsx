'use client';

import { useState, useRef, useEffect } from "react";

type Message = {
  id: number;
  sender: "patient" | "doctor";
  text: string;
  time: string;
};

export default function PatientMessagePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "doctor",
      text: "Hello Nimal, how are your sessions going this week?",
      time: "09:30 AM",
    },
    {
      id: 2,
      sender: "patient",
      text: "Much better. Grip strength feels stronger.",
      time: "09:32 AM",
    },
  ]);

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const doctorName = "Dr. Silva";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      sender: "patient",
      text: input,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
  };

  return (
    <div className="p-8 max-w-5xl h-[90vh] flex flex-col">

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B1E33]">
          Messages
        </h1>
        <p className="text-gray-500 mt-1">
          Chat with your assigned doctor
        </p>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col flex-1 overflow-hidden">

        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <p className="font-semibold text-[#0B1E33]">
              {doctorName}
            </p>
            <p className="text-sm text-green-600">
              Online
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "patient" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl text-sm shadow-sm ${
                  msg.sender === "patient"
                    ? "bg-teal-600 text-white rounded-br-none"
                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                }`}
              >
                <p>{msg.text}</p>
                <p className="text-xs mt-1 opacity-70 text-right">
                  {msg.time}
                </p>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef}></div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-white flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />

          <button
            onClick={sendMessage}
            className="bg-teal-600 hover:bg-teal-500 text-white px-5 py-3 rounded-xl font-semibold transition"
          >
            Send
          </button>
        </div>

      </div>
    </div>
  );
}