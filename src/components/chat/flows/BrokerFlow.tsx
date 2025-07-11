"use client";
/* eslint-disable react/no-unescaped-entities */

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

const isValidName = (name: string) => /^[a-zA-Z\s]+$/.test(name);
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone: string) => /^\d{6,}$/.test(phone);

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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  useEffect(() => {
    if (showScheduleForm || showDigitalKitForm) {
      formStartRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showScheduleForm, showDigitalKitForm]);

  useEffect(() => {
    if (showServiceForm && formStartRef.current) {
      const form = formStartRef.current;
      const chatContainer = document.getElementById("chatContainer");

      if (chatContainer) {
        setTimeout(() => {
          const scrollTo = form.offsetTop - 40;
          chatContainer.scrollTo({ top: scrollTo, behavior: "smooth" });
        }, 100);
      }
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
      setShowScheduleForm(opt === "Schedule a call with our broker support team");
      setShowDigitalKitForm(opt === "Get a digital kit of available projects");
      setShowServiceForm(opt === "Pick the services you're interested in");
      setIsBotThinking(false);
    }, 1000);
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "budget") {
      const raw = value.replace(/[^\d]/g, "");
      const formatted = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      setFormData((prev) => ({ ...prev, budget: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error on change
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.fullname.trim()) newErrors.fullname = "Full name is required.";
    else if (!isValidName(formData.fullname)) newErrors.fullname = "Name must contain only letters.";

    if (!formData.email.trim()) newErrors.email = "Email is required.";
    else if (!isValidEmail(formData.email)) newErrors.email = "Enter a valid email address.";

    if (!formData.phone.trim()) newErrors.phone = "Phone is required.";
    else if (!isValidPhone(formData.phone)) newErrors.phone = "Phone must be at least 6 digits.";

    if (formData.budget && isNaN(Number(formData.budget.replace(/,/g, "")))) {
      newErrors.budget = "Budget must be a valid number.";
    }

    setFormErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

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

  const labelMap: Record<string, string> = {
    fullname: "Full Name",
    company: "Company",
    phone: "Phone",
    email: "Email",
    reach: "Preferred way to reach you",
    budget: "Estimated Budget",
  };

  const placeholderMap: Record<string, string> = {
    fullname: "Your Full Name",
    company: "Company",
    phone: "Your Phone Number",
    email: "Your Email Address",
    reach: showDigitalKitForm ? "Call / WhatsApp" : "Call / WhatsApp / Email",
    budget: "100,000",
  };

  const renderFormFields = (keys: (keyof typeof formData)[]) =>
    keys.map((key) => (
      <div key={key} className={key === "budget" ? "relative" : ""}>
        <label className="block text-left text-[11px] mb-1 text-pink-400 font-medium">
          {labelMap[key]}
        </label>
        <div className="relative">
          {key === "budget" && (
            <span
              className="absolute top-1/2 text-xs text-pink-300 font-semibold dirham-symbol pl-2"
              style={{ left: "4px", transform: "translateY(-50%)" }}
            >
              &#x00EA;
            </span>
          )}
          <Input
            type="text"
            name={key}
            value={formData[key]}
            onChange={handleFormChange}
            className={`mb-1 ${key === "budget" ? "pl-8" : ""}`}
            placeholder={placeholderMap[key]}
          />
          {formErrors[key] && (
            <p className="text-red-400 text-[10px] mt-0.5">{formErrors[key]}</p>
          )}
        </div>
      </div>
    ));

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
      <div
        ref={optionsStartRef}
        className="text-white text-xs text-center mt-4 px-4 max-w-[350px] mx-auto space-y-3"
      >
        {recapBlock}
        <div className="text-[11px] font-semibold">
          Welcome {name} to <span className="text-pink-400 font-bold">Pixl.ae</span> — Amazing! Here’s how we support brokers:
        </div>
        <ul className="text-left text-[10px] ml-3 list-disc list-inside space-y-1">
          {serviceOptions.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <div className="text-[11px] font-semibold mt-3">
          Would you like to:
        </div>
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

  if (formSubmitted && showServiceForm) {
    return (
      <div className="text-white text-center mt-6 space-y-3">
        {recapBlock}
        <div className="text-pink-400 font-semibold text-lg">Thank you, {name}!</div>
        <div className="text-xs">
          <div className="mb-1">Awesome — we've noted your interest in:</div>
          <div className="flex flex-col items-center gap-1">
            {selectedServices.map((s, i) => (
              <div key={i}>✅ {s}</div>
            ))}
          </div>
        </div>
        <div className="text-xs">
          A member of our broker support team will be in touch shortly to walk you through tailored solutions for your selected services.
        </div>
      </div>
    );
  }
  
  if ((showScheduleForm || showDigitalKitForm || showServiceForm) && !formSubmitted) {
    return (
      <form
        ref={formStartRef}
        onSubmit={handleFormSubmit}
        className="bg-black/70 p-4 text-xs text-white max-w-[350px] mx-auto mt-4 space-y-2 rounded"
      >
        {recapBlock}
        {showServiceForm && (
          <>
            <div className="text-[12px] font-semibold mb-2">Please select the services you're interested in</div>
            {serviceOptions.map((service) => (
              <label key={service} className="flex items-start gap-2 text-[11px] text-left mb-1">
                <input
                  type="checkbox"
                  checked={selectedServices.includes(service)}
                  onChange={() => handleServiceToggle(service)}
                  className="mr-2"
                />
                {service}
              </label>
            ))}
          </>
        )}
        {showScheduleForm && (
          <div className="text-[11px] font-semibold text-center mb-2">
            Got it, {name} — we’d love to connect and learn more about how we can support your marketing goals.
          </div>
        )}
        {showDigitalKitForm && (
          <div className="text-[11px] font-semibold text-center mb-2">
            Perfect, {name} — we’ll send you a digital kit of our past projects to support your sales efforts.
          </div>
        )}
        {renderFormFields([
          "fullname",
          "company",
          "phone",
          "email",
          "reach",
          ...(showServiceForm ? ["budget"] : []),
        ])}
        <button
          type="submit"
          className="w-full py-2 mt-2 rounded bg-pink-800 hover:bg-pink-700 text-white font-semibold text-xs transition"
        >
          Submit Details
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
