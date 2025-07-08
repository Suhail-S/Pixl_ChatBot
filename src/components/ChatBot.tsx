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
    } catch (err) {
      addMessage({ sender: "bot", text: "Sorry, something went wrong contacting the AI service." });
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto h-[80vh] flex border border-gray-200 rounded-lg shadow-xl bg-white/60 dark:bg-zinc-900/80 relative flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b flex items-center bg-white/80 dark:bg-zinc-900/80 rounded-t-lg">
        <span className="font-bold text-lg tracking-tight flex-1 text-indigo-700 dark:text-blue-200">
          Pixl Chat Bot
        </span>
        <Button size="sm" variant="secondary" onClick={resetChat} disabled={isLoading}>
          Reset Chat
        </Button>
      </header>
      {/* System Prompt Notice */}
      <div className="px-6 py-2 text-xs text-gray-600 dark:text-gray-400 bg-transparent border-b border-dashed">
        {SYSTEM_PROMPT.split("\n")[0]}
      </div>
      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center mt-20 text-center space-y-5">
            <div className="text-lg font-semibold text-gray-700 dark:text-blue-100">
              Hello, I am AI assistant for{" "}
              <span className="text-indigo-700 dark:text-blue-300 font-bold">Pixl.</span>{} {" "}
              {/* <span className="text-indigo-700 dark:text-blue-300 font-bold">Invespy</span>.<br /> */}
              <br />
              Tell me what you would like to know!
            </div>
            <div className="flex flex-col items-center gap-2 mt-4">
              {exampleQuestions.map((q) => (
                <button
                  key={q}
                  className="bg-indigo-50 dark:bg-blue-950/80 rounded px-3 py-2 text-sm text-gray-700 dark:text-blue-100 border border-indigo-100 dark:border-blue-900 w-fit hover:bg-indigo-100 hover:dark:bg-blue-900/80 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                  "px-4 py-2 rounded-2xl mb-2 whitespace-pre-line max-w-[75%]",
                  "bg-indigo-600 text-white dark:bg-blue-900"
                )}
              >
                {msg.text}
              </div>
            ) : (
              <div
                className={cn(
                  "px-4 py-2 rounded-2xl mb-2 whitespace-pre-line max-w-[75%] prose prose-indigo dark:prose-invert",
                  "bg-gray-100 text-gray-900 dark:bg-zinc-700 dark:text-blue-100 border"
                )}
              >
                <ReactMarkdown
                  components={{
                    strong: ({ node, ...props }) => (
                      <strong className="font-semibold text-indigo-700 dark:text-blue-200" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="list-disc ml-5 mb-2" {...props} />
                    ),
                    li: ({ node, ...props }) => (
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
            <div className="px-4 py-2 rounded-2xl bg-gray-100 border text-gray-400 dark:bg-zinc-700 dark:text-blue-300 dark:border-blue-900 mb-2 max-w-[75%] animate-pulse">
              Pixl Bot is thinking…
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>
      {/* Input Box */}
      <form
        className="py-3 px-4 border-t flex items-center gap-2 bg-white/80 dark:bg-zinc-900/80 rounded-b-lg"
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
      >
        <Input
          type="text"
          autoFocus
          ref={inputRef}
          placeholder="Type your message…"
          className="flex-1"
          value={userMessage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserMessage(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter" && !e.shiftKey) handleSend(); }}
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !userMessage.trim()}>
          {isLoading ? "Sending…" : "Send"}
        </Button>
      </form>
    </div>
  );
};