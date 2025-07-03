export const chatbotFlow = {
  start: {
    message: "👋 Welcome to Pixl.ae — Where Ideas Become Iconic.\nTo better assist you, could you tell us what best describes you?",
    options: [
      { label: "Broker", next: "broker_intro", tag: "Broker" },
      { label: "Real Estate Developer", next: "dev_intro", tag: "Developer" },
      { label: "Applicant", next: "applicant_intro", tag: "Applicant" },
      { label: "Vendor/Partner", next: "partner_intro", tag: "Partner" },
      { label: "Other", next: "other_inquiry" },
    ],
  },

  // 🔷 BROKER FLOW
  broker_intro: {
    message: "Great! Before we continue, may I have your first name?",
    input: "text",
    next: "broker_services",
  },

  broker_services: {
    message: "Amazing – here’s how we support brokers:\n1. Digital marketing\n2. CRM/Tech\n3. Social Media\n4. PR/Media\n5. Events/Roadshows\n6. Email Marketing\n\nWould you like to:",
    options: [
      { label: "Schedule a call", next: "broker_schedule_call" },
      { label: "Get a digital kit", next: "broker_digital_kit" },
      { label: "Pick services", next: "broker_pick_services" },
      { label: "Learn more about projects", next: "broker_project_updates" },
      { label: "Maybe later", next: "broker_maybe_later" },
    ],
  },

  broker_schedule_call: {
    message: "Got it — we’d love to connect. Please fill out your details:",
    form: ["Full Name", "Company Name", "Phone", "Email", "Preferred Contact Method"],
    next: "thank_you_broker",
    actions: ["hubspot:addMarketing", "hubspot:RSVP", "hubspot:scheduleCall"],
  },

  broker_digital_kit: {
    message: "Perfect — we’ll send a curated kit. Please share:",
    form: ["Full Name", "Email", "Phone", "Company", "Preferred Contact Method"],
    next: "thank_you_broker",
    actions: ["hubspot:addMarketing", "hubspot:sendDigitalKit"],
  },

  broker_pick_services: {
    message: "Reply with numbers of services you’re interested in (e.g., 1, 3, 5):",
    input: "text",
    next: "broker_contact_after_services",
  },

  broker_contact_after_services: {
    message: "Thanks! Please share:\nFull Name, Company, Phone, Email, Preferred Contact Method, Estimated Budget",
    form: ["Full Name", "Company", "Phone", "Email", "Contact Method", "Estimated Budget"],
    next: "thank_you_broker",
    actions: ["hubspot:addMarketing"],
  },

  broker_project_updates: {
    message: "To send the latest project updates, we need:\nEmail, Phone, Company (opt), Contact Method",
    form: ["Email", "Phone", "Company", "Preferred Contact Method"],
    next: "thank_you_broker",
    actions: ["hubspot:addMarketing", "hubspot:sendProjectUpdates"],
  },

  broker_maybe_later: {
    message: "Thanks for your time — would you like to receive occasional updates, branding insights and case studies?",
    options: [
      { label: "Yes, keep me in the loop", next: "broker_maybe_optin" },
      { label: "No, thanks for now", next: "thank_you_broker" },
    ],
  },

  broker_maybe_optin: {
    message: "Great! Could you please share your email?",
    input: "email",
    next: "thank_you_broker",
    actions: ["hubspot:addMarketing"],
  },

  thank_you_broker: {
    message: "Thanks! A team member will follow up shortly. Meanwhile, explore our work at pixl.ae/work",
    end: true,
  },

  // 🟨 DEVELOPER FLOW
  dev_intro: {
    message: "Hi there! What’s your first name?",
    input: "text",
    next: "dev_needs",
  },

  dev_needs: {
    message: "Are you looking to:\n• Launch or reposition?\n• Bold brand identity?\n• Drive qualified leads?\n• Build a digital ecosystem?",
    options: [
      { label: "Tell me more", next: "dev_services" },
      { label: "Schedule a call", next: "dev_schedule_call" },
      { label: "Not now", next: "dev_maybe_later" },
    ],
  },

  dev_services: {
    message: "Here’s how we support developers:\nBranding, CGI, Campaign Strategy, Launch Support, CRM, Analytics.\nWould you like to:",
    options: [
      { label: "Schedule a call", next: "dev_schedule_call" },
      { label: "Browse all services", next: "dev_full_services" },
      { label: "Get a custom roadmap", next: "dev_custom_roadmap_1" },
      { label: "See past projects", next: "dev_projects" },
    ],
  },

  dev_schedule_call: {
    message: "Please fill in your details so our team can reach you:",
    form: ["Full Name", "Email", "Phone", "Company", "Preferred Time", "Contact Method"],
    next: "thank_you_dev",
    actions: ["hubspot:scheduleCall"],
  },

  dev_custom_roadmap_1: {
    message: "Let’s customize your roadmap:\n1. Branding scope\n2. CGI needs\n3. Campaign help\n4. Launch events\n5. Performance Marketing\n6. Tech Stack\n7. Advisory support",
    form: ["Brand Identity", "Creative Production", "Campaign Strategy", "Launch Plan", "Performance Marketing", "Tech Needs", "Analytics"],
    next: "dev_custom_roadmap_2",
  },

  dev_custom_roadmap_2: {
    message: "Tell us about your project basics:",
    form: ["Full Name", "Project Name", "Estimated Budget", "Launch Timeline", "Units", "Location", "Email", "Phone", "Preferred Contact"],
    next: "thank_you_dev",
    actions: ["hubspot:customRoadmap"],
  },

  thank_you_dev: {
    message: "Thanks, we’ll be in touch with your custom plan. View our work at pixl.ae/work",
    end: true,
  },

  // 🟩 APPLICANT FLOW
  applicant_intro: {
    message: "Hi! Thanks for your interest. May I ask your first name?",
    input: "text",
    next: "applicant_type",
  },

  applicant_type: {
    message: "Are you looking for:",
    options: [
      { label: "Full-time", next: "applicant_details" },
      { label: "Part-time", next: "applicant_details" },
      { label: "Internship", next: "applicant_details" },
      { label: "Freelance", next: "applicant_details" },
    ],
  },

  applicant_details: {
    message: "Please share:\nName, Email, Phone, Upload CV/Portfolio (file or link)",
    form: ["Full Name", "Email", "Phone", "CV or Portfolio"],
    next: "applicant_extra",
  },

  applicant_extra: {
    message: "How did you hear about us?\nDo you know what we do?\nWhich team are you most interested in? (Reply with number 1–8)",
    form: ["Referral Source", "Familiar with Pixl?", "Target Team"],
    next: "thank_you_applicant",
  },

  thank_you_applicant: {
    message: "Thanks! We’ll review your application. If there’s a match, we’ll reach out. Explore our work at pixl.ae/work",
    end: true,
  },

  // 🟥 VENDOR / PARTNER FLOW
  partner_intro: {
    message: "Hi there! May I have your first name?",
    input: "text",
    next: "partner_intent",
  },

  partner_intent: {
    message: "What best describes your interest?",
    options: [
      { label: "Offer a service/solution", next: "partner_service_details" },
      { label: "Creative/technical collaboration", next: "partner_collab_1" },
      { label: "Something else", next: "partner_other" },
    ],
  },

  partner_service_details: {
    message: "Do you have standard pricing or a custom proposal?",
    options: [
      { label: "Standard Pricing", next: "partner_standard_pricing" },
      { label: "Custom Proposal", next: "partner_custom_pricing" },
      { label: "Let's discuss on call", next: "partner_contact" },
    ],
  },

  partner_standard_pricing: {
    message: "Upload or link to your pricing deck (PDF, link)",
    form: ["Pricing Document or Link"],
    next: "partner_contact",
  },

  partner_custom_pricing: {
    message: "Upload or link your proposal including scope, timeline, pricing, past work (optional)",
    form: ["Proposal Document or Link"],
    next: "partner_contact",
  },

  partner_collab_1: {
    message: "Please categorize your idea:",
    options: [
      { label: "Creative campaign", next: "partner_collab_2" },
      { label: "Product/platform integration", next: "partner_collab_2" },
      { label: "Tech solution", next: "partner_collab_2" },
      { label: "Research or thought leadership", next: "partner_collab_2" },
      { label: "Other", next: "partner_collab_2" },
    ],
  },

  partner_collab_2: {
    message: "Please give us a short summary of your idea and what makes it unique. Optionally upload content.",
    form: ["Collaboration Summary", "Supporting Content (optional)"],
    next: "partner_contact",
  },

  partner_other: {
    message: "Understood — please describe what you're looking for:",
    input: "text",
    next: "partner_contact",
  },

  partner_contact: {
    message: "To direct this to the right team, please provide:\nCompany Name, Service Area, Phone, Email, Website, Preferred Contact Method",
    form: ["Company Name", "Service Area", "Phone", "Email", "Website", "Contact Method"],
    next: "thank_you_partner",
    actions: ["hubspot:addMarketing"],
  },

  thank_you_partner: {
    message: "Thanks! Our team will review and follow up if it aligns with upcoming projects.",
    end: true,
  },

  // 🟪 OPEN INQUIRY
  other_inquiry: {
    message: "Please type your question or let us know what you're here for.",
    input: "text",
    next: "thank_you_broker",
  },
} as const;
