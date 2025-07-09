"use client";
import React, { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { useUserStore } from "@/store/userStore";
import { Input } from "@/components/ui/input";

type ScheduleFormFields = {
  company: string;
  fullname: string;
  phone: string;
  email: string;
  reach: string;
};

export const BrokerFlow: React.FC = () => {
  const { messages, addMessage } = useChatStore();
  const { addAnswer, answers } = useUserStore();

  const [isBotThinking, setIsBotThinking] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [formData, setFormData] = useState<ScheduleFormFields>({
    company: "",
    fullname: "",
    phone: "",
    email: "",
    reach: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const nameMsg = messages.find((m) => m.sender === "user" && m.text.trim().length <= 30);
  const name = nameMsg?.text.trim() || "there";
  const hasName = !!nameMsg;

  useEffect(() => {
    if (hasName) {
      addAnswer("broker_name", name);
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
  
    // Start thinking first
    setIsBotThinking(true);
    setShowOptions(false);
  
    setTimeout(() => {
      if (opt === "Schedule a call with our broker support team") {
        setShowScheduleForm(true);
      } else {
        setShowOptions(true);
      }
      setIsBotThinking(false);
    }, 1000); // delay response
  };
  

  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    addAnswer("broker_schedule_company", formData.company);
    addAnswer("broker_schedule_fullname", formData.fullname);
    addAnswer("broker_schedule_phone", formData.phone);
    addAnswer("broker_schedule_email", formData.email);
    addAnswer("broker_schedule_reach", formData.reach);

    // Send all gathered answers for the session to the backend for CSV logging
    try {
      await fetch("/api/save-broker-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...answers,
          broker_schedule_company: formData.company,
          broker_schedule_fullname: formData.fullname,
          broker_schedule_phone: formData.phone,
          broker_schedule_email: formData.email,
          broker_schedule_reach: formData.reach,
          sessionId: typeof window !== "undefined" ? window.localStorage.getItem("sessionId") : undefined
        }),
      });
    } catch (err) {
      // fail silently for now or show toast: "There was an error saving your data"
    }
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

  if (showScheduleForm) {
    if (formSubmitted) {
      return (
        <div className="text-white text-center mt-6 space-y-2">
          <div className="text-pink-400 font-semibold text-lg">Thank you, {name}!</div>
          <div className="text-xs">We’ve received your details. Our team will reach out to you soon.</div>
        </div>
      );
    }

    return (
      <form
        onSubmit={handleFormSubmit}
        className="rounded-md p-4 bg-black/70 border border-pink-950 space-y-2 text-xs text-white max-w-[350px] mx-auto mt-8"
      >
        <div className="text-[11px] font-semibold leading-tight mb-1 text-center">
          Got it, {name} — we’d love to connect and learn more about how we can support your marketing goals.
        </div>
        <div>
          <label className="block text-left text-[11px] mb-1 text-pink-400 font-medium">
            Company Name
          </label>
          <Input
            name="company"
            value={formData.company}
            onChange={handleFormChange}
            required
            className="mb-2"
            placeholder="Your company name"
          />
        </div>
        <div>
          <label className="block text-left text-[11px] mb-1 text-pink-400 font-medium">
            Your Full Name
          </label>
          <Input
            name="fullname"
            value={formData.fullname}
            onChange={handleFormChange}
            required
            className="mb-2"
            placeholder="Full name"
          />
        </div>
        <div>
          <label className="block text-left text-[11px] mb-1 text-pink-400 font-medium">
            WhatsApp or Phone Number
          </label>
          <Input
            name="phone"
            value={formData.phone}
            onChange={handleFormChange}
            required
            className="mb-2"
            placeholder="e.g. +97150XXXXXXX"
            type="tel"
          />
        </div>
        <div>
          <label className="block text-left text-[11px] mb-1 text-pink-400 font-medium">
            Email Address
          </label>
          <Input
            name="email"
            value={formData.email}
            onChange={handleFormChange}
            required
            className="mb-2"
            placeholder="you@email.com"
            type="email"
          />
        </div>
        <div>
          <label className="block text-left text-[11px] mb-1 text-pink-400 font-medium">
            Preferred way to reach you
          </label>
          <Input
            name="reach"
            value={formData.reach}
            onChange={handleFormChange}
            required
            className="mb-2"
            placeholder="Call / WhatsApp / Email"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 mt-2 rounded bg-pink-800 hover:bg-pink-700 text-white font-semibold text-xs transition"
        >
          Send Details
        </button>
      </form>
    );
  }

  return null;
};
