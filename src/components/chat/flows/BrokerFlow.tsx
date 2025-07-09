"use client";
import React, { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { useUserStore } from "@/store/userStore";
import { Input } from "@/components/ui/input";
import { ThinkingBubble } from "@/components/ui/ThinkingBubble";

const serviceOptions = [
  "Digital marketing / Lead generation services",
  "Tech and CRM services",
  "Social Media services",
  "PR and Media services",
  "Events services - Roadshows & OpenHouses",
  "Email marketing services",
];

type ScheduleFormFields = {
  company: string;
  fullname: string;
  phone: string;
  email: string;
  reach: string;
  budget?: string;
};

export const BrokerFlow: React.FC = () => {
  const { messages, addMessage } = useChatStore();
  const { addAnswer, answers } = useUserStore();
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showDigitalKitForm, setShowDigitalKitForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [formData, setFormData] = useState<ScheduleFormFields>({
    company: "",
    fullname: "",
    phone: "",
    email: "",
    reach: "",
    budget: "",
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
    "Just exploring",
  ];

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

  if (!hasName) {
    return (
      <div className="text-white text-center text-xs mt-4 space-y-2">
        <div className="text-[11px] font-semibold leading-tight p-0">
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
      <div className="space-y-2 text-white text-xs text-center mt-4">
        <div className="text-[11px] font-semibold leading-tight">
          Welcome {name} to <span className="text-pink-400 font-bold">Pixl.ae</span> — Amazing! Here’s how we support brokers:
        </div>
        <ul className="text-left text-[10px] ml-3 list-disc list-inside space-y-1 mt-2">
          {serviceOptions.map((s) => (<li key={s}>{s}</li>))}
        </ul>
        <div className="text-[11px] font-semibold mt-3">Would you like to:</div>
        <div className="flex flex-col items-center gap-1.5 w-full max-w-[220px] mx-auto">
          {options.map((opt) => (
            <button
              key={opt}
              className="bg-pink-950/80 rounded px-2 py-1 text-xs text-pink-200 w-full hover:bg-pink-800 hover:text-white"
              onClick={() => handleSelection(opt)}
            >{opt}</button>
          ))}
        </div>
      </div>
    );
  }

  if (formSubmitted && showServiceForm) {
    return (
      <div className="text-white text-center mt-6 space-y-3">
        <div className="text-pink-400 font-semibold text-lg">Thank you, {name}!</div>
        <div className="text-xs whitespace-pre-line">
          Awesome — we've noted your interest in:
          {selectedServices.map((s) => `\n✅ ${s}`).join("")}
        </div>
        <div className="text-xs">
          A member of our broker support team will be in touch shortly to walk you through tailored solutions for your selected services.
        </div>
      </div>
    );
  }

  if (showServiceForm && !formSubmitted) {
    return (
      <form
        onSubmit={handleFormSubmit}
        className="rounded-md p-4 bg-black/70 border border-pink-950 space-y-2 text-xs text-white max-w-[350px] mx-auto mt-8"
      >
        <div className="text-[11px] font-semibold mb-2">
          Please pick the servcies you interested in:
        </div>
        <div className="space-y-1 text-[10px]">
          {serviceOptions.map((service) => (
            <label key={service} className="block">
              <input
                type="checkbox"
                checked={selectedServices.includes(service)}
                onChange={() => handleServiceToggle(service)}
                className="mr-2"
              />
              {service}
            </label>
          ))}
        </div>

        {Object.entries({
          fullname: "Full Name",
          company: "Company Name (if any)",
          phone: "Phone or WhatsApp Number",
          email: "Email Address",
          reach: "Preferred Contact Method (Call / WhatsApp / Email)",
          budget: "Estimated Budget (for selected services)",
        }).map(([key, label]) => (
          <div key={key}>
            <label className="block text-left text-[11px] mb-1 text-pink-400 font-medium">
              {label}
            </label>
            <Input
              name={key}
              value={(formData as any)[key]}
              onChange={handleFormChange}
              required={key !== "budget"}
              className="mb-2"
              placeholder={label}
            />
          </div>
        ))}

        <button
          type="submit"
          className="w-full py-2 mt-2 rounded bg-pink-800 hover:bg-pink-700 text-white font-semibold text-xs transition"
        >Submit Preferences</button>
      </form>
    );
  }

  if ((showScheduleForm || showDigitalKitForm) && !formSubmitted) {
    return (
      <form
        onSubmit={handleFormSubmit}
        className="rounded-md p-4 bg-black/70 border border-pink-950 space-y-2 text-xs text-white max-w-[350px] mx-auto mt-8"
      >
        <div className="text-[11px] font-semibold leading-tight mb-1 text-center">
          {showScheduleForm
            ? `Got it, ${name} — we’d love to connect and learn more about how we can support your marketing goals.`
            : `Perfect, ${name} — we’ll make sure you get a curated digital kit of our past projects, ready to support your sales efforts. Just before we send it over, could you please share:`}
        </div>
        {Object.entries({
          company: "Company Name",
          fullname: "Your Full Name",
          phone: "WhatsApp or Phone Number",
          email: "Email Address",
          reach: "Preferred way to reach you",
        }).map(([key, label]) => (
          <div key={key}>
            <label className="block text-left text-[11px] mb-1 text-pink-400 font-medium">
              {label}
            </label>
            <Input
              name={key}
              value={(formData as any)[key]}
              onChange={handleFormChange}
              required
              className="mb-2"
              placeholder={
                key === "reach"
                  ? showScheduleForm
                    ? "Call / WhatsApp / Email"
                    : "WhatsApp / Email"
                  : label
              }
              type={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
            />
          </div>
        ))}
        <button
          type="submit"
          className="w-full py-2 mt-2 rounded bg-pink-800 hover:bg-pink-700 text-white font-semibold text-xs transition"
        >{showScheduleForm ? "Send Details" : "Submit Details"}</button>
      </form>
    );
  }

  if (formSubmitted) {
    return (
      <div className="text-white text-center mt-6 space-y-2">
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
