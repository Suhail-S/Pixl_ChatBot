"use client";
import React, { useState } from "react";
import { ChatBot } from "@/components/chat/ChatBot";
import { cn } from "@/lib/utils";
import Image from "next/image";

export const FloatingChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [consented, setConsented] = useState(false);

  return (
    <>
      {/* Floating Launcher Button */}
      <button
        aria-label="Open chat"
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "fixed z-[2147483648] bottom-8 right-4 md:right-8 w-16 h-16 rounded-full bg-pink-600 text-white font-bold flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none border-2 border-pink-400",
        )}
        style={{ fontSize: "1.25rem" }}
        tabIndex={0}
      >
        <span className="pointer-events-none select-none">💬</span>
      </button>

      {/* Popup Chat Panel */}
      <div
        className={cn(
          // On mobile: full width (with safe area), right-0; on md+ like before
          "fixed z-[2147483647] bottom-[92px] right-0 md:right-8 flex flex-col",
          "w-full max-w-full sm:w-[320px] sm:max-w-[90vw] h-[60vh] sm:h-[300px] md:h-[520px] min-h-[240px] bg-black overflow-hidden rounded-t-2xl sm:rounded-3xl shadow-2xl border-2 border-pink-700",
          "transition-all duration-300",
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none scale-95"
        )}
        style={{
          minWidth: 0,
          minHeight: 220,
        }}
      >
        {!consented ? (
          <div className="flex flex-col flex-1 items-center justify-center gap-5 p-6 text-center bg-black">
            <Image
              src="/window.svg"
              alt="Pixl Logo"
              width={128}
              height={128}
              className="mx-auto mb-2"
              priority
            />
            <h2 className="text-xl font-semibold text-pink-400">PIXL AI BOT</h2>
            <p className="text-base text-pink-100">
              By chatting you consent to our{" "}
              <a
                href="https://pixl.ai/privacy"
                target="_blank"
                className="text-pink-400 underline"
              >
                Privacy Policy
              </a>
              , agree to conversation logging, and opt-in to Pixl communications.
            </p>
            <button
              className="bg-pink-600 hover:bg-pink-700 text-white rounded-xl px-6 py-3 text-base font-semibold shadow focus:outline-none"
              onClick={() => setConsented(true)}
            >
              Start Chat
            </button>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 relative">
            {/* Single top header: title, then Reset, then Close */}
            <div className="flex justify-between items-center px-4 py-2 bg-black rounded-t-3xl border-b-2 border-pink-800">
              <span className="font-semibold text-base text-pink-200 truncate">PIXL ChatBot</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    // Reset chat (dispatch event to ChatBot below)
                    const ev = new CustomEvent("pixl-reset-chat");
                    window.dispatchEvent(ev);
                  }}
                  className="border border-pink-400 text-pink-200 hover:bg-pink-600 hover:text-white px-2 py-0.5 rounded-md text-xs transition"
                >Reset</button>
                <button
                  aria-label="Close chat"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-pink-900 text-pink-200 hover:text-white transition"
                >
                  <span className="text-xl">&#x2715;</span>
                </button>
              </div>
            </div>
            <div className="flex-1 flex min-h-0">
              <ChatBot />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default FloatingChatWidget;