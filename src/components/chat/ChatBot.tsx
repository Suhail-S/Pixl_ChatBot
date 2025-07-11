"use client";
import React, { useRef, useEffect, useState } from "react";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import { useChatStore, type ChatMessage } from "@/store/chatStore";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThinkingBubble } from "@/components/ui/ThinkingBubble";
import ReactMarkdown from "react-markdown";
import { BrokerFlow } from "@/components/chat/flows/BrokerFlow";

declare global {
  interface Window {
    userStore: typeof useUserStore;
  }
}

export const ChatBot: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, userMessage, setUserMessage, addMessage, resetChat } = useChatStore();
  const { setUserType, resetProfile } = useUserStore();

  const [isLoading, setIsLoading] = useState(false);
  const [persona, setPersona] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.userStore = useUserStore;
    }
  }, []);

  useEffect(() => {
    const onReset = () => {
      resetChat();
      resetProfile();
      setPersona(null);
    };
    window.addEventListener("pixl-reset-chat", onReset);
    return () => window.removeEventListener("pixl-reset-chat", onReset);
  }, [resetChat, resetProfile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (question: string) => {
    setIsLoading(true);

    const controller = new AbortController();
    try {
      let pendingText = "";
      let pendingIndex: number | null = null;

      const chatHistory = [...messages, { sender: "user", text: question }];

      const resp = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: chatHistory, systemPrompt: SYSTEM_PROMPT }),
        signal: controller.signal,
      });

      if (!resp.body) throw new Error("No response stream.");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        chunk.split("data:").forEach((dataLineRaw) => {
          const dataLine = dataLineRaw.trim();
          if (!dataLine || dataLine === "[DONE]") return;
          try {
            const parsed = JSON.parse(dataLine);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (typeof delta === "string") {
              pendingText += delta;
              if (pendingIndex === null) {
                addMessage({ sender: "bot", text: pendingText });
                pendingIndex = useChatStore.getState().messages.length - 1;
              } else {
                const msgs = useChatStore.getState().messages as ChatMessage[];
                msgs[pendingIndex].text = pendingText;
                useChatStore.setState({ messages: [...msgs] });
              }
            }
          } catch {}
        });
      }
    } catch {
      addMessage({ sender: "bot", text: "Sorry, something went wrong contacting the AI service." });
    }
    setIsLoading(false);
  };

  const identifyUserOptions = [
    "Broker",
    "Real Estate Developer",
    "Applicant",
    "Vendor/Partner",
    "Other"
  ];

  const nameNeeded = persona === "Broker" && !messages.find((m) => m.sender === "user" && m.text.trim().length <= 30);
  const nameEntered = messages.find(
    (m) => m.sender === "user" && m.text.trim().length <= 30
  );
  
  const allowInput = persona === "Other" || (persona === "Broker" && !nameEntered);

  return (
    <div className="max-w-xs w-full mx-auto h-full flex flex-col shadow-xl bg-black text-xs">
      {/* ✅ Add ID and scrollable area for BrokerFlow scroll */}
      <main
        id="chatContainer"
        className="flex-1 min-h-0 overflow-y-auto max-h-[calc(100vh-140px)] px-2 py-1 space-y-2 text-xs"
      >
        {!persona && messages.length === 0 && (
          <div className="text-white text-center text-xs mt-2 space-y-2">
            <div>
              Welcome to <span className="text-pink-400 font-bold">PIXL.ae</span> — Where Ideas Become Iconic.<br /><br />
              Award-winning full-service agency delivering brand, marketing, sales, and tech solutions to real estate and hospitality brands in the region and beyond.<br /><br />
              To better assist you, could you tell us what best describes you?
              <br />
            </div>
            <div className="flex flex-col items-center gap-1.5 w-full max-w-[220px] mx-auto">
              {identifyUserOptions.map((opt) => (
                <button
                  key={opt}
                  className="bg-pink-950/80 rounded px-2 py-1 text-xs text-pink-200 w-full hover:bg-pink-800 hover:text-white"
                  onClick={() => {
                    setPersona(opt);
                    setUserType(opt);
                    if (opt === "Other") {
                      setUserMessage("I have a different question or would like to chat with the bot.");
                      setTimeout(() => handleSend("I have a different question or would like to chat with the bot."), 100);
                    } else {
                      setUserMessage("");
                    }
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages
          .filter((msg) => {
            // For Brokers, suppress short name replies — handled in BrokerFlow
            if (persona === "Broker" && msg.sender === "user" && msg.text.trim().length <= 30) return false;

            // Also suppress the selected broker_interest option (e.g. "Schedule a call...") to avoid double display
            const brokerInterest = useUserStore.getState().answers.broker_interest;
            if (
              persona === "Broker" &&
              msg.sender === "user" &&
              msg.text === brokerInterest
            ) {
              return false;
            }

            return true;
          })
          .map((msg, idx) => (
            <div key={idx} className={cn("flex w-full", msg.sender === "user" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "px-2 py-1 rounded-2xl mb-1 max-w-[75%]",
                msg.sender === "user"
                  ? "bg-pink-600 text-white"
                  : "bg-black border border-pink-900 text-pink-300"
              )}>
                <ReactMarkdown
                  components={{
                    p: (props) => (
                      <p className="prose prose-invert break-words text-xs" {...props} />
                    ),
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
          ))}

        {/* ✅ Custom flow for Brokers */}
        {persona === "Broker" && <BrokerFlow />}

        {isLoading && (
          <div className="flex justify-start">
            <ThinkingBubble />
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Chat input */}
      <form
        className="py-2 px-2 border-t border-pink-800 flex items-center gap-1 bg-black-950 rounded-b-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          const message = userMessage.trim();
          if (!message || isLoading) return;

          addMessage({ sender: "user", text: message });
          setUserMessage("");
          setTimeout(() => inputRef.current?.focus(), 200);

          if (persona === "Other") handleSend(message);
        }}
      >
        <Input
          type="text"
          autoFocus
          ref={inputRef}
          placeholder="Type your message…"
          className="flex-1 px-2 py-1 h-8 min-w-0 text-xs rounded-lg bg-zinc-900/70 text-white placeholder:text-pink-400 border border-pink-900"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              const msg = userMessage.trim();
              if (msg) {
                addMessage({ sender: "user", text: msg });
                setUserMessage("");
                setTimeout(() => inputRef.current?.focus(), 200);
                if (persona === "Other") handleSend(msg);
              }
            }
          }}
          disabled={isLoading || !allowInput}
        />
        <Button
          type="submit"
          disabled={isLoading || !userMessage.trim() || !allowInput}
          className="px-2 py-1 text-[11px] h-8 rounded-lg bg-pink-600 hover:bg-pink-700 text-white"
        >
          {isLoading ? "..." : "Send"}
        </Button>
      </form>
    </div>
  );
};
