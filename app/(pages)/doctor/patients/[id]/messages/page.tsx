'use client';

import { useState } from 'react';

interface Message {
  sender: 'doctor' | 'patient';
  text: string;
  time: string;
}

export default function DoctorPatientMessagesPage() {
  const patients = [
    { id: '1', name: 'John Doe' }
  ];

  const [selectedPatient, setSelectedPatient] = useState(patients[0]);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'patient', text: 'Good morning doctor', time: '09:10' },
    { sender: 'doctor', text: 'Good morning John. How is your grip today?', time: '09:12' },
    { sender: 'patient', text: 'It feels stronger than yesterday.', time: '09:13' },
  ]);

  const [newMessage, setNewMessage] = useState('');

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    setMessages([
      ...messages,
      {
        sender: 'doctor',
        text: newMessage,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);

    setNewMessage('');
  };

  return (
    <div className="flex h-full">

      {/* Patient List */}
      <aside className="w-72 border-r border-gray-200 bg-[#F4F6FA] p-4">
        <h2 className="font-bold text-[#0B1E33] mb-4">
          Messages
        </h2>

        <div className="space-y-2">
          {patients.map((patient) => (
            <button
              key={patient.id}
              onClick={() => setSelectedPatient(patient)}
              className={`w-full text-left px-4 py-3 rounded-xl transition ${
                selectedPatient.id === patient.id
                  ? 'bg-teal-500 text-[#062E2B] font-semibold'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              {patient.name}
            </button>
          ))}
        </div>
      </aside>

      {/* Chat Area */}
      <section className="flex-1 flex flex-col bg-[#F7F9FC]">

        {/* Chat Header */}
        <div className="border-b border-gray-200 p-4 bg-white">
          <h3 className="font-semibold text-gray-800">
            {selectedPatient.name}
          </h3>
          <p className="text-xs text-gray-500">
            Patient Conversation
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-end">
          <div className="max-w-3xl mx-auto w-full space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.sender === 'doctor' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm ${
                    msg.sender === 'doctor'
                      ? 'bg-teal-500 text-[#062E2B]'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  <p>{msg.text}</p>
                  <p className="text-[10px] text-gray-600 mt-1 text-right">
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4 bg-white flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={sendMessage}
            className="bg-teal-500 hover:bg-teal-400 text-[#062E2B] font-semibold px-6 rounded-xl transition"
          >
            Send
          </button>
        </div>

      </section>
    </div>
  );
}
