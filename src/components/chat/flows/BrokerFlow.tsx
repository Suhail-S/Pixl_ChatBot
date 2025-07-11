"use client";
import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { useUserStore } from "@/store/userStore";
import { Input } from "@/components/ui/input";
import { ThinkingBubble } from "@/components/ui/ThinkingBubble";
import "@/app/globals.css";

const serviceOptions = [
  "Digital marketing / Lead generation services",
  "Tech and CRM services",
  "Social Media services",
  "PR and Media services",
  "Events services - Roadshows & Open Houses",
  "Email marketing services",
];

export const BrokerFlow: React.FC = () => {
  const { messages, addMessage } = useChatStore();
  const { addAnswer, answers } = useUserStore();

  const formStartRef = useRef<HTMLFormElement>(null);
  
  const optionsStartRef = useRef<HTMLDivElement>(null);

  const [isBotThinking, setIsBotThinking] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showNameRecap, setShowNameRecap] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showDigitalKitForm, setShowDigitalKitForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    company: "",
    fullname: "",
    phone: "",
    email: "",
    reach: "",
    budget: "",
  });

  const nameMsg = messages.find((m) => m.sender === "user" && m.text.trim().length <= 30);
  const name = nameMsg?.text.trim() || "there";
  const hasName = !!nameMsg;

  // Scroll to center for schedule or kit
  useEffect(() => {
    if (showScheduleForm || showDigitalKitForm) {
      formStartRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showScheduleForm, showDigitalKitForm]);

  // Scroll to bottom for service form (like Screenshot 2)

  useEffect(() => {
    if (showServiceForm) {
      setTimeout(() => {
        const form = formStartRef.current;
        if (form) {
          const rect = form.getBoundingClientRect();
          const scrollY = window.scrollY + rect.top - 100; // offset by 100px
          window.scrollTo({ top: scrollY, behavior: "smooth" });
        }
      }, 150); // wait for layout paint
    }
  }, [showServiceForm]);

  useEffect(() => {
    if (showOptions) {
      optionsStartRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [showOptions]);

  useEffect(() => {
    if (hasName) {
      addAnswer("broker_name", name);
      setIsBotThinking(true);
      const recapTimer = setTimeout(() => setShowNameRecap(true), 1000);
      const optionTimer = setTimeout(() => {
        setIsBotThinking(false);
        setShowOptions(true);
      }, 1000);
      return () => {
        clearTimeout(recapTimer);
        clearTimeout(optionTimer);
      };
    }
  }, [hasName, name, addAnswer]);

  const handleSelection = (opt: string) => {
    addMessage({ sender: "user", text: opt });
    addAnswer("broker_interest", opt);
    setIsBotThinking(true);
    setShowOptions(false);
    setTimeout(() => {
      if (opt === "Schedule a call with our broker support team") {
        setShowScheduleForm(true);
      } else if (opt === "Get a digital kit of available projects") {
        setShowDigitalKitForm(true);
      } else if (opt === "Pick the services you're interested in") {
        setShowServiceForm(true);
      } else {
        setShowOptions(true);
      }
      setIsBotThinking(false);
    }, 1000);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    selectedServices.forEach((s, i) => addAnswer(`service_${i + 1}`, s));
    Object.entries(formData).forEach(([key, value]) => addAnswer(key, value));
    const finalAnswers = {
      ...answers,
      ...formData,
      selectedServices,
      sessionId: typeof window !== "undefined" ? window.localStorage.getItem("sessionId") : undefined,
      timestamp: new Date().toISOString(),
    };
    try {
      await fetch("/api/save-broker-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalAnswers),
      });
    } catch (err) {
      console.error("Failed to submit form:", err);
    }
  };

  const recapBlock = showNameRecap && (
    <>
      <div className="flex w-full justify-start">
        <div className="bg-black border border-pink-900 text-pink-300 rounded-2xl px-3 py-2 mb-1 max-w-[75%] text-[11px] text-left">
          May I have your first name?
        </div>
      </div>
      <div className="flex w-full justify-end">
        <div className="bg-pink-600 text-white rounded-2xl px-3 py-1 mb-1 max-w-[75%] text-[11px] text-right">{name}</div>
      </div>
      {answers.broker_interest && (
        <>
          <div className="flex w-full justify-start">
            <div className="bg-black border border-pink-900 text-pink-300 rounded-2xl px-3 py-2 mb-1 max-w-[75%] text-[11px] text-left">
              Would you like to:
            </div>
          </div>
          <div className="flex w-full justify-end">
            <div className="bg-pink-600 text-white rounded-2xl px-2 py-1 mb-1 max-w-[75%] text-[11px] text-left break-words leading-snug">
              {answers.broker_interest}
            </div>
          </div>
        </>
      )}
    </>
  );

  if (!hasName) {
    return (
      <div className="text-white text-center text-xs mt-4 space-y-2">
        <div className="text-[11px] font-semibold leading-tight">
          Great! Before we continue, may I have your first name?
        </div>
        <div className="text-pink-300 text-xs italic">
          (Please enter your name using the text box below.)
        </div>
      </div>
    );
  }

  if (isBotThinking) return <ThinkingBubble className="mt-2 ml-2" />;

  if (showOptions) {
    return (
      <div ref={optionsStartRef} className="text-white text-xs text-center mt-4 px-4 max-w-[350px] mx-auto space-y-3">
        {recapBlock}
        <div className="text-[11px] font-semibold">
          Welcome {name} to <span className="text-pink-400 font-bold">Pixl.ae</span> — Amazing! Here’s how we support brokers:
        </div>
        <ul className="text-left text-[10px] ml-3 list-disc list-inside space-y-1">
          {serviceOptions.map((s) => (<li key={s}>{s}</li>))}
        </ul>
        <div className="text-[11px] font-semibold mt-3">Would you like to:</div>
        <div className="flex flex-col items-center gap-1.5 w-full max-w-[220px] mx-auto">
          {[
            "Schedule a call with our broker support team",
            "Get a digital kit of available projects",
            "Pick the services you're interested in",
            "Register for upcoming project launches (learn more)",
            "Just exploring",
          ].map((opt) => (
            <button
              key={opt}
              className="bg-pink-950/80 rounded px-2 py-1 text-xs text-pink-200 w-full hover:bg-pink-800 hover:text-white"
              onClick={() => handleSelection(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
        <div className="h-3" />
      </div>
    );
  }

  const renderFormFields = (keys: string[]) =>
    keys.map((key) => (
      <div key={key}>
        <label className="block text-left text-[11px] mb-1 text-pink-400 font-medium">
          {key === "reach" ? "Preferred way to reach you" : key === "budget" ? "Estimated Budget" : key.charAt(0).toUpperCase() + key.slice(1)}
        </label>
        <Input
          name={key}
          value={(formData as any)[key]}
          onChange={handleFormChange}
          required={key !== "budget"}
          className="mb-2"
          placeholder={
            key === "reach" ? "Call / WhatsApp / Email" :
            key === "budget" ? "100,000" :
            key.charAt(0).toUpperCase() + key.slice(1)
          }
        />
      </div>
    ));

  if (showServiceForm && !formSubmitted) {
    return (
      <form ref={formStartRef} onSubmit={handleFormSubmit} className="bg-black/70 p-4 text-xs text-white max-w-[350px] mx-auto mt-4 space-y-2 rounded">
        {recapBlock}
        <div className="text-[11px] font-semibold mb-2">Please select the services you're interested in</div>
        {serviceOptions.map((service) => (
          <label key={service} className="block text-[10px] text-left">
            <input
              type="checkbox"
              checked={selectedServices.includes(service)}
              onChange={() => handleServiceToggle(service)}
              className="mr-2"
            />
            {service}
          </label>
        ))}
        {renderFormFields(["fullname", "company", "phone", "email", "reach", "budget"])}
        <button type="submit" className="w-full py-2 mt-2 rounded bg-pink-800 hover:bg-pink-700 text-white font-semibold text-xs transition">
          Submit Preferences
        </button>
      </form>
    );
  }

  if ((showScheduleForm || showDigitalKitForm) && !formSubmitted) {
    return (
      <form ref={formStartRef} onSubmit={handleFormSubmit} className="bg-black/70 p-4 text-xs text-white max-w-[350px] mx-auto mt-4 space-y-2 rounded">
        {recapBlock}
        <div className="text-[11px] font-semibold text-center mb-2">
          {showScheduleForm
            ? `Got it, ${name} — we’d love to connect and learn more about how we can support your marketing goals.`
            : `Perfect, ${name} — we’ll send you a digital kit of our past projects to support your sales efforts.`}
        </div>
        {renderFormFields(["fullname", "company", "phone", "email", "reach"])}
        <button type="submit" className="w-full py-2 mt-2 rounded bg-pink-800 hover:bg-pink-700 text-white font-semibold text-xs transition">
          {showScheduleForm ? "Send Details" : "Submit Details"}
        </button>
      </form>
    );
  }

  if (formSubmitted) {
    return (
      <div className="text-white text-center mt-6 space-y-2">
        {recapBlock}
        <div className="text-pink-400 font-semibold text-lg">Thank you, {name}!</div>
        <div className="text-xs">
          {showScheduleForm
            ? "We’ve received your details. Our team will reach out to you soon."
            : "A member of our team will reach out shortly with your curated digital kit."}
        </div>
      </div>
    );
  }

  return null;
};
