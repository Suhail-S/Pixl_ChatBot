"use client";
import React, { useRef, useEffect, useState } from "react";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import { useChatStore } from "@/store/chatStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";

export const ChatBot: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, userMessage, setUserMessage, addMessage, resetChat } = useChatStore();

  // Listen for global reset (from floating header)
  React.useEffect(() => {
    const onReset = () => resetChat();
    window.addEventListener("pixl-reset-chat", onReset);
    return () => window.removeEventListener("pixl-reset-chat", onReset);
  }, [resetChat]);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Example questions for empty state
  const exampleQuestions = [
    "What services does Pixl offer to support new brands?",
    "How does Invespy help with off-plan real estate sales or marketing?",
    "Can you explain your full-service agency approach?",
    "What makes Pixl and Invespy unique in the UAE market?",
  ];

  // API chat handler with streaming support
  const handleSend = async () => {
    const question = userMessage.trim();
    if (!question || isLoading) return;

    addMessage({ sender: "user", text: question });
    setUserMessage("");
    setTimeout(() => inputRef.current?.focus(), 200);

    setIsLoading(true);

    const controller = new AbortController();
    try {
      // Add temporary placeholder message for streaming assistant reply
      let pendingText = "";
      let pendingIndex: number | null = null;

      // Prepare messages history (including pending user message)
      const chatHistory = [
        ...messages,
        { sender: "user", text: question },
      ];

      const resp = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: chatHistory,
          systemPrompt: SYSTEM_PROMPT,
        }),
        signal: controller.signal,
      });

      if (!resp.body) {
        throw new Error("No response stream.");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);

        // OpenAI SSE emits chunks like: 'data: {...}\n'
        // For streaming text, concat all "choices[].delta.content"
        chunk.split("data:").forEach((dataLineRaw) => {
          const dataLine = dataLineRaw.trim();
          if (!dataLine || dataLine === "[DONE]") return;

          try {
            const parsed = JSON.parse(dataLine);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (typeof delta === "string") {
              pendingText += delta;
              // Show live streamed reply
              if (pendingIndex === null) {
                addMessage({ sender: "bot", text: pendingText });
                pendingIndex = useChatStore.getState().messages.length - 1;
              } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (useChatStore.getState().messages[pendingIndex] as any).text = pendingText;
                // Force re-render
                useChatStore.setState((state) => ({ messages: [...state.messages] }));
              }
            }
          } catch {
            // ignore JSON parse errors on irrelevant SSE text
          }
        });
      }
    } catch {
      addMessage({ sender: "bot", text: "Sorry, something went wrong contacting the AI service." });
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-xs w-full mx-auto h-full flex flex-col shadow-xl bg-white/60 dark:bg-zinc-900/80 text-xs">
      {/* Messages */}
      <main className="flex-1 min-h-0 overflow-y-auto px-2 py-1 space-y-2 text-xs">
        {messages.length === 0 && (
          <div className="flex flex-col items-center mt-2 text-center space-y-2">
            <div className="text-[11px] font-semibold text-white text-center leading-tight p-0 mb-2">
              Hello, I am AI assistant for <span className="text-pink-400 font-bold">Pixl.</span>
              <br />
              Tell me what you would like to know!
            </div>
            <div className="flex flex-col items-center gap-1.5 w-full max-w-[220px] mx-auto">
              {exampleQuestions.map((q) => (
                <button
                  key={q}
                  className="bg-pink-950/80 rounded px-2 py-1 text-xs text-pink-200 w-full hover:bg-pink-800 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-pink-400"
                  type="button"
                  onClick={() => setUserMessage(q)}
                  disabled={isLoading}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg: { sender: "user" | "bot"; text: string }, idx: number) => (
          <div key={idx} className={cn(
            "flex w-full",
            msg.sender === "user" ? "justify-end" : "justify-start"
          )}>
            {msg.sender === "user" ? (
              <div
                className={cn(
                  "px-2 py-1 rounded-2xl mb-1 whitespace-pre-line max-w-[75%]",
                  "bg-pink-600 text-white"
                )}
              >
                {msg.text}
              </div>
            ) : (
              <div
                className={cn(
                  "px-2 py-1 rounded-2xl mb-1 whitespace-pre-line max-w-[75%] prose prose-indigo dark:prose-invert text-xs",
                  "bg-black text-pink-200 border border-pink-900"
                )}
              >
                <ReactMarkdown
                  components={{
                    strong: (props) => (
                      <strong className="font-semibold text-indigo-700 dark:text-blue-200" {...props} />
                    ),
                    ul: (props) => (
                      <ul className="list-disc ml-5 mb-2" {...props} />
                    ),
                    li: (props) => (
                      <li className="mb-1" {...props} />
                    ),
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="px-2 py-1 rounded-2xl bg-black border border-pink-900 text-pink-300 mb-1 max-w-[75%] animate-pulse text-xs">
              Pixl Bot is thinking…
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>
      {/* Input Box */}
      <form
        className="py-2 px-2 border-t border-pink-800 flex items-center gap-1 bg-pink-900 dark:bg-zinc-900/80 rounded-b-2xl"
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
      >
        {/* Upload docs icon (left) */}
        <button
          type="button"
          aria-label="Upload documents"
          className="pink-400 hover:text-pink-400 p-1 rounded-full transition"
          tabIndex={-1}
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <path d="M12 16V4m0 0L7 8m5-4 5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="4" y="16" width="16" height="4" rx="2" fill="currentColor" opacity="0.15"/>
          </svg>
        </button>
        <Input
          type="text"
          autoFocus
          ref={inputRef}
          placeholder="Type your message…"
          className="flex-1 px-2 py-1 h-8 min-w-0 text-xs rounded-lg bg-zinc-900/70 text-white placeholder:text-pink-400 border border-pink-900"
          value={userMessage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserMessage(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter" && !e.shiftKey) handleSend(); }}
          disabled={isLoading}
        />
        <Button
          type="submit"
          disabled={isLoading || !userMessage.trim()}
          className="px-2 py-1 text-[11px] h-8 rounded-lg bg-pink-600 hover:bg-pink-700 text-white"
        >
          {isLoading ? "..." : "Send"}
        </Button>
      </form>
    </div>
  );
};