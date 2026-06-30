import React, { useState } from "react";
import { ArrowLeft, MessageSquare, Shield, HelpCircle, FileText, Camera, Volume2, Key, Check, Mail, Phone, MapPin, Sparkles, AlertTriangle, Search } from "lucide-react";
import { translations } from "../translations";
import AstraLogo from "../components/AstraLogo";

// Trigger clean Vite rebuild
export const StaticPages = ({ page, onNavigate }) => {
  const [contactSuccess, setContactSuccess] = useState("");
  const [helpQuery, setHelpQuery] = useState("");
  
  const lang = localStorage.getItem("language") || "en";
  const t = translations[lang] || translations.en;

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSuccess("Your message has been sent successfully. Our support team will get in touch shortly.");
  };

  const helpTopics = [
    { title: "Getting Started", desc: "Learn how to trigger sessions and optimize prompt details.", count: 5 },
    { title: "Account & Subscriptions", desc: "Upgrading, invoice logs, card details, and key limits.", count: 4 },
    { title: "Developer API Keys", desc: "Hash algorithms, token allocations, and python connections.", count: 8 },
    { title: "Security & Audits", desc: "JWT validations, rate limiting, and private parameters.", count: 3 }
  ];

  return (
    <div className="min-h-screen bg-theme text-theme-primary flex flex-col font-sans relative">

      {/* Top Navbar */}
      <nav className="sticky top-0 w-full z-50 glass-panel border-b border-theme py-4 px-3 md:px-4 flex justify-between items-center backdrop-blur-md">
        <div 
          className="flex items-center gap-0 cursor-pointer pb-1 bg-gradient-to-r from-current to-current bg-[length:0%_2px] bg-no-repeat bg-right-bottom hover:bg-[length:100%_2px] hover:bg-left-bottom" 
          onClick={() => onNavigate("landing")}
          style={{ transition: "background-size 0.3s ease-out" }}
        >
          <AstraLogo size={26} className="text-theme-primary -ml-1" />
          <span className="text-2xl font-medium tracking-wider text-theme-primary">
            STRA AI
          </span>
        </div>

        <span className="absolute left-1/2 -translate-x-1/2 font-semibold text-sm tracking-wider uppercase text-theme-primary hidden md:block">
          {page.toUpperCase()} PAGE
        </span>

        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate("login")}
            className="px-5 py-2.5 rounded-xl bg-theme-primary hover:opacity-90 text-theme-card text-xs font-medium transition-all"
          >
            Log In
          </button>
        </div>
      </nav>

      {/* Scrollable Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-4 md:px-12 md:pt-4 md:pb-12 overflow-y-auto">

        {/* 1. FEATURES PAGE */}
        {page === "features" && (
          <div className="space-y-12">
            <div className="text-center space-y-3">
              <h1 className="text-4xl font-semibold text-theme-primary">Platform Core Features</h1>
              <p className="text-theme-secondary max-w-md mx-auto text-sm">Discover the underlying models and processing engines built into Astra AI.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: "Real-time Message Streaming", desc: "Token streaming updates the UI in real-time, providing immediate feedback.", icon: MessageSquare },
                { title: "Context Ingestion Files", desc: "Drop PDFs to parse and feed raw information directly into the LLM logic.", icon: FileText },
                { title: "Image Analysis Visualizer", desc: "Analyzes diagrams or text files, reading layouts and compiling visual telemetry details.", icon: Camera },
                { title: "Hashed API keys", desc: "Developer key strings are stored hashed in Postgres, ensuring complete security.", icon: Key },
                { title: "Voice commands", desc: "Speech synthesis reads model responses aloud directly in the web app UI.", icon: Volume2 },
                { title: "Admin Monitoring", desc: "Allows database session tracking, model metrics overview, and user blocks.", icon: Shield }
              ].map((f, idx) => {
                const Icon = f.icon;
                return (
                  <div key={idx} className="glass-card p-6 rounded-2xl border border-theme space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-theme-subtle border border-theme flex items-center justify-center text-theme-primary">
                      <Icon size={18} />
                    </div>
                    <h3 className="text-base font-medium text-theme-primary">{f.title}</h3>
                    <p className="text-xs text-theme-secondary leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. PRICING PAGE */}
        {page === "pricing" && (
          <div className="space-y-12">
            <div className="text-center space-y-3">
              <h1 className="text-4xl font-semibold text-theme-primary">Simple, Predictable Plans</h1>
              <p className="text-theme-secondary max-w-md mx-auto text-sm">Scale your project models. Upgrade dynamically anytime.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { 
                  name: t.planFreeTitle, 
                  price: t.planFreePrice, 
                  desc: t.planFreeDesc, 
                  features: [t.planFreeF1, t.planFreeF2, t.planFreeF3, t.planFreeF4],
                  btn: t.planFreeBtn
                },
                { 
                  name: t.planPremiumTitle, 
                  price: t.planPremiumPrice + (t.planPremiumPeriod || ""), 
                  desc: t.planPremiumDesc, 
                  features: [t.planPremiumF1, t.planPremiumF2, t.planPremiumF3, t.planPremiumF4, t.planPremiumF5, t.planPremiumF6],
                  btn: t.planPremiumBtn,
                  popular: true
                },
                { 
                  name: t.planEnterpriseTitle, 
                  price: t.planEnterprisePrice + (t.planEnterprisePeriod || ""), 
                  desc: t.planEnterpriseDesc, 
                  features: [t.planEnterpriseF1, t.planEnterpriseF2, t.planEnterpriseF3, t.planEnterpriseF4, t.planEnterpriseF5, t.planEnterpriseF6],
                  btn: t.planEnterpriseBtn
                }
              ].map((p, idx) => (
                <div key={idx} className={`glass-card p-6 rounded-2xl flex flex-col justify-between border relative ${p.popular ? "border-theme" : "border-theme-soft"}`}>
                  {p.popular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-theme-primary text-theme-card font-medium text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <div>
                    <h3 className="text-lg font-medium text-theme-primary mb-1">{p.name}</h3>
                    <span className="text-2xl font-semibold text-theme-primary">{p.price}</span>
                    <p className="text-[10px] text-theme-muted my-4 min-h-[30px]">{p.desc}</p>
                    <ul className="space-y-3 mb-6">
                      {p.features.map((f, fIdx) => (
                        <li key={fIdx} className="flex gap-2 items-center text-xs text-theme-secondary">
                          <Check size={14} className="text-theme-sky shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button onClick={() => onNavigate("register")} className={`w-full py-2.5 rounded-xl text-xs font-medium mt-4 transition-all ${p.popular ? "cta-popular" : "cta-secondary"}`}>
                    {p.btn || "Get Started"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. ABOUT PAGE */}
        {page === "about" && (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h1 className="text-4xl font-semibold text-theme-primary">Think Beyond Limits</h1>
              <p className="text-theme-secondary text-sm">The vision and story of Astra AI platform.</p>
            </div>

            <div className="glass-card p-8 rounded-3xl border border-theme space-y-6 text-sm leading-relaxed text-theme-secondary">
              <p>
                Astra AI was founded with a singular conviction: AI interaction should be fast, visually stunning, and developer-friendly.
                We felt existing tools were either too generic or cluttered with configuration schemas. We built Astra AI to serve as the ultimate bridge — a professional, ChatGPT-grade SaaS product featuring modular full-stack controls.
              </p>
              <h3 className="text-base font-medium text-theme-primary pt-4">Our Technology Core</h3>
              <p>
                By layering FastAPI's ultra-low latency streams over standard PostgreSQL schemas and displaying it inside a responsive React.js template styled with vanilla CSS glassmorphism, we ensure zero-flashes during navigation.
              </p>
              <h3 className="text-base font-medium text-theme-primary pt-2">Our Goal</h3>
              <p>
                To provide developers and visual creators with structured tools to ingest PDFs, read layout OCR elements, configure secure keys, and explore model configurations securely.
              </p>
            </div>
          </div>
        )}

        {/* 4. CONTACT PAGE */}
        {page === "contact" && (
          <div className="space-y-12">
            <div className="text-center space-y-3">
              <h1 className="text-4xl font-semibold text-theme-primary">Contact Our Team</h1>
              <p className="text-theme-secondary text-sm">Have billing inquiries or architectural customisation questions? Send us a message.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
              {/* Address details */}
              <div className="flex-1 space-y-6">
                <div className="glass-card p-6 rounded-2xl border border-theme space-y-4">
                  <h3 className="text-base font-medium text-theme-primary">Headquarters</h3>
                  <div className="space-y-3 text-xs text-theme-secondary">
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-theme-primary shrink-0" />
                      <span>100 Pine Street, San Francisco, CA 94111</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-theme-primary shrink-0" />
                      <span>+1 (415) 555-0199</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-theme-primary shrink-0" />
                      <span>contact@astra.ai</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="flex-1">
                {contactSuccess ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
                    {contactSuccess}
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="glass-card p-6 rounded-2xl border border-theme space-y-4">
                    <input
                      type="text"
                      required
                      placeholder="Name"
                      className="w-full px-4 py-2.5 rounded-xl bg-theme-card border border-theme text-xs focus:border-slate-400 dark:focus:border-white/40 outline-none text-theme-primary placeholder:text-theme-muted transition-colors"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Email Address"
                      className="w-full px-4 py-2.5 rounded-xl bg-theme-card border border-theme text-xs focus:border-slate-400 dark:focus:border-white/40 outline-none text-theme-primary placeholder:text-theme-muted transition-colors"
                    />
                    <textarea
                      required
                      placeholder="Message content..."
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-xl bg-theme-card border border-theme text-xs focus:border-slate-400 dark:focus:border-white/40 outline-none text-theme-primary placeholder:text-theme-muted resize-none transition-colors"
                    />
                    <button type="submit" className="w-full py-3 rounded-xl bg-theme-primary hover:opacity-90 text-theme-card font-medium text-xs transition-all">
                      Send Message
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. HELP CENTER */}
        {page === "help" && (
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-semibold text-theme-primary font-sans">Astra Help Center</h1>
              <div className="max-w-md mx-auto relative">
                <input
                  type="text"
                  placeholder="Search articles & troubleshooting..."
                  value={helpQuery}
                  onChange={(e) => setHelpQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-theme-card border border-theme text-xs focus:border-slate-400 dark:focus:border-white/40 outline-none text-theme-primary placeholder:text-theme-muted transition-colors"
                />
                <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
              </div>
            </div>

            {/* Help categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {helpTopics.map((topic, idx) => (
                <div key={idx} className="glass-card p-6 rounded-2xl border border-theme space-y-2 hover:border-theme transition-all cursor-pointer">
                  <h3 className="text-sm font-medium text-theme-primary">{topic.title}</h3>
                  <p className="text-xs text-theme-secondary leading-relaxed">{topic.desc}</p>
                  <span className="text-[10px] text-theme-muted block pt-2">{topic.count} documentation articles</span>
                </div>
              ))}
            </div>

            {/* Quick Warning badge */}
            <div className="p-4 bg-theme-subtle border border-theme rounded-2xl flex gap-3 text-xs text-theme-secondary select-none">
              <HelpCircle size={16} className="text-theme-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-theme-primary block mb-0.5">Need custom developer logs?</span>
                Check our API configuration page inside Profile settings, or download the full integration PDF documentation by starting a chat.
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
export default StaticPages;
