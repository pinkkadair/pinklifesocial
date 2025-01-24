"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BotIcon, CalendarIcon, SendIcon } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AndiVirtualEsthetician() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm Andi, your virtual esthetician. I can help you with skincare advice and booking consultations. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: input }]);

    // Simulate Andi's response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm currently in preview mode. In the full version, I'll provide personalized skincare advice and help you book consultations!",
        },
      ]);
    }, 1000);

    setInput("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
          <BotIcon className="h-6 w-6 text-purple-500" />
        </div>
        <div>
          <h3 className="font-semibold">Andi</h3>
          <p className="text-sm text-muted-foreground">Virtual Esthetician</p>
        </div>
      </div>

      <Card className="p-4 h-[300px] overflow-y-auto flex flex-col gap-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" className="gap-2">
          <CalendarIcon className="h-4 w-4" />
          Book Consultation
        </Button>
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Ask Andi a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
          />
          <Button onClick={handleSend}>
            <SendIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 