"use client";
import React, { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { useUserStore } from "@/store/userStore";

export const BrokerFlow: React.FC = () => {
  const { messages, addMessage } = useChatStore();
  const { addAnswer } = useUserStore();

  const [isBotThinking, setIsBotThinking] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const nameMsg = messages.find((m) => m.sender === "user" && m.text.trim().length <= 30);
  const name = nameMsg?.text.trim() || "there";
  const hasName = !!nameMsg;

  useEffect(() => {
    if (hasName) {
      addAnswer("broker_name", name);
      // Show thinking for 1.5s before continuing
      setIsBotThinking(true);
      const timer = setTimeout(() => {
        setIsBotThinking(false);
        setShowOptions(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [hasName, name, addAnswer]);

  const options = [
    "Schedule a call with our broker support team",
    "Get a digital kit of available projects",
    "Pick the services you're interested in",
    "Register for upcoming project launches (learn more)",
    "Just exploring"
  ];

  const handleSelection = (opt: string) => {
    addMessage({ sender: "user", text: opt });
    addAnswer("broker_interest", opt);
    setIsBotThinking(true);
    setShowOptions(false);

    setTimeout(() => {
      setIsBotThinking(false);
      setShowOptions(true);
    }, 1000);
  };

  if (!hasName) {
    return (
      <div className="text-white text-center text-xs mt-4 space-y-2">
        <div className="text-[11px] font-semibold text-white text-center leading-tight p-0">
          Great! Before we continue, may I have your first name?
        </div>
        <div className="text-pink-300 text-xs italic">
          (Please enter your name using the text box below.)
        </div>
      </div>
    );
  }

  if (isBotThinking) {
    return (
      <div className="text-left text-xs px-3 py-1 rounded-2xl bg-black border border-pink-900 text-pink-300 mt-2 max-w-[75%] animate-pulse">
        Pixl Bot is thinking…
      </div>
    );
  }

  if (showOptions) {
    return (
      <div className="space-y-2 text-white text-xs text-center mt-4">
        <div className="text-[11px] font-semibold leading-tight">
          Welcome {name} to <span className="text-pink-400 font-bold">Pixl.ae</span> — Amazing! Here’s how we support brokers:
        </div>
        <div className="text-left text-[10px] mx-auto w-full">
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Digital marketing / Lead generation services</li>
            <li>Tech and CRM services</li>
            <li>Social Media services</li>
            <li>PR and Media services</li>
            <li>Events services - Roadshows & Open Houses</li>
            <li>Email marketing services</li>
          </ul>
        </div>
        <div className="text-[11px] font-semibold mt-3">
          Would you like to:
        </div>
        <div className="flex flex-col items-center gap-1.5 w-full max-w-[220px] mx-auto">
          {options.map((opt) => (
            <button
              key={opt}
              className="bg-pink-950/80 rounded px-2 py-1 text-xs text-pink-200 w-full hover:bg-pink-800 hover:text-white"
              onClick={() => handleSelection(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
