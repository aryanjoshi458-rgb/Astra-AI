import React, { useState, useEffect, useRef } from "react";
import AstraLogo from "../components/AstraLogo";
import { Sparkles, ArrowRight, Zap, Shield, HelpCircle, Code, MessageSquare, FileText, Camera, Volume2, Check, Star, Mail, ShieldCheck, Globe, Sun, Moon, Monitor, ChevronDown, Plus, Search, Key, Activity, Menu, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { translations } from "../translations";

export const LandingPage = ({ onNavigate }) => {
  const { theme, setTheme } = useTheme();
  const [lang, setLang] = useState(() => localStorage.getItem("language") || "en");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[lang] || translations.en;

  useEffect(() => {
    localStorage.setItem("language", lang);
  }, [lang]);

  const [demoInput, setDemoInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-3.1-pro-high");
  const [demoMessages, setDemoMessages] = useState([]);
  const [isDemoTyping, setIsDemoTyping] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const [activeFile, setActiveFile] = useState("app.js");
  const [searchQuery, setSearchQuery] = useState("");
  const [codeText, setCodeText] = useState("");
  const typingIntervalRef = useRef(null);

  // --- Features State ---
  const [activeFeature, setActiveFeature] = useState(0);
  const featuresData = [
    { title: "Real-time Message Streaming", desc: "Token streaming updates the UI in real-time, providing immediate feedback.", icon: MessageSquare },
    { title: "Context Ingestion Files", desc: "Drop PDFs to parse and feed raw information directly into the LLM logic.", icon: FileText },
    { title: "Image Analysis Visualizer", desc: "Analyzes diagrams or text files, reading layouts and compiling visual telemetry details.", icon: Camera },
    { title: "Hashed API keys", desc: "Developer key strings are stored hashed in Postgres, ensuring complete security.", icon: Key },
    { title: "Voice commands", desc: "Speech synthesis reads model responses aloud directly in the web app UI.", icon: Volume2 },
    { title: "Admin Monitoring", desc: "Allows database session tracking, model metrics overview, and user blocks.", icon: Shield }
  ];

  // --- Playground State & Logic ---
  const [playgroundLang, setPlaygroundLang] = useState("javascript");
  const [playgroundOutput, setPlaygroundOutput] = useState([]);
  const [isPlaygroundRunning, setIsPlaygroundRunning] = useState(false);

  const playgroundSnippets = {
    javascript: `// Astra AI JavaScript SDK
import { AstraClient } from '@astra/core';

const client = new AstraClient({ apiKey: 'YOUR_API_KEY' });

async function main() {
  const response = await client.chat('What is the meaning of life?');
  console.log(response.text);
}

main();`,
    python: `# Astra AI Python SDK
import astra

client = astra.Client(api_key='YOUR_API_KEY')

def main():
    response = client.chat('What is the meaning of life?')
    print(response.text)

if __name__ == '__main__':
    main()`,
    curl: `# Astra AI REST API
curl -X POST https://api.astra.ai/v1/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [{"role": "user", "content": "What is the meaning of life?"}]
  }'`
  };

  const [playgroundCode, setPlaygroundCode] = useState(playgroundSnippets.javascript);

  useEffect(() => {
    setPlaygroundCode(playgroundSnippets[playgroundLang]);
    setPlaygroundOutput([]);
  }, [playgroundLang]);

  const runPlaygroundCode = () => {
    if (isPlaygroundRunning) return;
    setIsPlaygroundRunning(true);
    setPlaygroundOutput([`> Executing ${playgroundLang} snippet...`]);

    setTimeout(() => {
      setPlaygroundOutput(prev => [...prev, "> Connecting to Astra AI API..."]);

      setTimeout(() => {
        let response = "";
        if (playgroundLang === "javascript" || playgroundLang === "python") {
          response = "42";
        } else {
          response = `{\n  "success": true,\n  "data": {\n    "text": "42"\n  }\n}`;
        }
        setPlaygroundOutput(prev => [
          ...prev,
          "> Connection successful.",
          "> Response received:",
          response,
          "> Process exited with code 0."
        ]);
        setIsPlaygroundRunning(false);
      }, 1200);
    }, 600);
  };
  // --------------------------------

  const fileContents = {
    "app.js": `// Initialize Astra AI API Client\nimport { AstraClient } from '@astra/core';\n\nconst client = new AstraClient({\n  apiKey: process.env.ASTRA_API_KEY,\n  environment: 'production'\n});\n\nasync function analyzeStream(input) {\n  // Real-time stream processing\n  const stream = await client.models.generate({\n    model: 'gpt-4o',\n    messages: [{ role: 'user', content: input }],\n    stream: true,\n  });\n  \n  for await (const chunk of stream) {\n    process.stdout.write(chunk.text);\n  }\n}\n\nanalyzeStream("Optimize database pool.");`,
    "config.ts": `// Database configuration setup\nexport const dbConfig = {\n  host: process.env.DB_HOST,\n  port: 5432,\n  user: 'astra_admin',\n  password: process.env.DB_PASS,\n  poolSize: 20,\n  ssl: true\n};\n\nconsole.log("Configuration loaded securely.");`,
    "router.js": `import { Router } from 'express';\nimport { analyzeStream } from './app.js';\n\nconst router = Router();\n\nrouter.post('/analyze', async (req, res) => {\n  try {\n    const { query } = req.body;\n    const result = await analyzeStream(query);\n    res.json({ success: true, data: result });\n  } catch (err) {\n    res.status(500).json({ error: err.message });\n  }\n});\n\nexport default router;`
  };

  const highlightCode = (code) => {
    let html = code
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/('.*?'|".*?"|`.*?`)/g, '<span style="color:#ce9178;">$1</span>')
      .replace(/\b(import|from|const|new|async|function|await|for|of|export|let|var|if|else|return|default|try|catch|def|print)\b/g, '<span style="color:#56b6c2;">$1</span>')
      .replace(/\b(AstraClient|Router|analyzeStream|dbConfig|generate|write|json|status|log|astra|Client)\b/g, '<span style="color:#dcdcaa;">$1</span>')
      .replace(/\b(host|port|user|password|poolSize|ssl|apiKey|environment|model|messages|role|content|stream|query|success|data|error|message|text|body|client|process|console|req|res|chunk|true|false|api_key|curl|POST|Bearer|Authorization|application)\b/g, '<span style="color:#9cdcfe;">$1</span>')
      .replace(/(\/\/.*|#.*)/g, '<span style="color:#6a9955;">$1</span>');
    return { __html: html };
  };

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initialUserMsg = "Tell me about the power of thinking beyond limits.";
    const initialAiMsg = "To think beyond limits is to look past standard templates, embrace complex full-stack solutions, and architect systems with seamless glassmorphism and streaming pipelines. Astra AI is built on this very standard: high responsiveness, complete customisation, and stunning design.";

    // 1. Show user message
    setTimeout(() => {
      setDemoMessages([{ sender: "user", content: initialUserMsg }]);
      setIsDemoTyping(true);

      // 2. Start typing AI message
      setTimeout(() => {
        setIsDemoTyping(false);
        setDemoMessages([
          { sender: "user", content: initialUserMsg },
          { sender: "assistant", content: "" }
        ]);

        let i = 0;
        const typingInterval = setInterval(() => {
          if (i < initialAiMsg.length) {
            setDemoMessages(prev => {
              const newMsgs = [...prev];
              newMsgs[1] = { sender: "assistant", content: initialAiMsg.slice(0, i + 1) };
              return newMsgs;
            });
            i++;
          } else {
            clearInterval(typingInterval);
          }
        }, 20); // typing speed
      }, 1000);
    }, 800);

    // 3. We use a separate useEffect for the code typing to handle file changes
  }, []);

  useEffect(() => {
    setCodeText("");
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

    let j = 0;
    const full = fileContents[activeFile];

    // Slight delay before typing starts for realism
    const startDelay = setTimeout(() => {
      typingIntervalRef.current = setInterval(() => {
        if (j <= full.length) {
          setCodeText(full.slice(0, j));
          j += (Math.random() > 0.7 ? 4 : 1);
        } else {
          clearInterval(typingIntervalRef.current);
        }
      }, 15);
    }, 400);

    return () => {
      clearTimeout(startDelay);
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, [activeFile]);

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    if (!demoInput.trim()) return;

    const newMsgs = [...demoMessages, { sender: "user", content: demoInput }];
    setDemoMessages(newMsgs);
    setDemoInput("");
    setIsDemoTyping(true);

    setTimeout(() => {
      let reply = "I'm processing your prompt using Astra's advanced context model. Let's build something exceptional!";
      if (demoInput.toLowerCase().includes("code")) {
        reply = "Here is how you initialize a fast database pooling engine:\n```python\nimport sqlalchemy\nengine = sqlalchemy.create_engine('postgresql://user:pass@localhost/db')\n```";
      } else if (demoInput.toLowerCase().includes("pricing")) {
        reply = "Astra offers flexible tier options! Our Premium tier is $2/month and unlocks PDF ingestion, image descriptors, and high speed tokens.";
      }
      setDemoMessages((prev) => [...prev, { sender: "assistant", content: reply }]);
      setIsDemoTyping(false);
    }, 1200);
  };

  const pricingTiers = [
    {
      name: t.planFreeTitle,
      price: t.planFreePrice,
      desc: t.planFreeDesc,
      features: [t.planFreeF1, t.planFreeF2, t.planFreeF3, t.planFreeF4],
      button: t.planFreeBtn,
      popular: false,
      tier: "free"
    },
    {
      name: t.planPremiumTitle,
      price: t.planPremiumPrice,
      period: t.planPremiumPeriod,
      desc: t.planPremiumDesc,
      features: [t.planPremiumF1, t.planPremiumF2, t.planPremiumF3, t.planPremiumF4, t.planPremiumF5, t.planPremiumF6],
      button: t.planPremiumBtn,
      popular: true,
      tier: "premium"
    },
    {
      name: t.planEnterpriseTitle,
      price: t.planEnterprisePrice,
      period: t.planEnterprisePeriod,
      desc: t.planEnterpriseDesc,
      features: [t.planEnterpriseF1, t.planEnterpriseF2, t.planEnterpriseF3, t.planEnterpriseF4, t.planEnterpriseF5, t.planEnterpriseF6],
      button: t.planEnterpriseBtn,
      popular: false,
      tier: "enterprise"
    }
  ];

  const faqs = [
    { q: t.faq1Q, a: t.faq1A },
    { q: t.faq2Q, a: t.faq2A },
    { q: t.faq3Q, a: t.faq3A },
    { q: t.faq4Q, a: t.faq4A }
  ];

  return (
    <div className="bg-theme text-theme-primary min-h-screen">

      {/* Navigation */}
      <nav className="sticky top-0 w-full z-50 glass-nav py-3 sm:py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div
          className="flex items-center gap-0 cursor-pointer pb-1 bg-gradient-to-r from-white to-white bg-[length:0%_2px] bg-no-repeat bg-right-bottom hover:bg-[length:100%_2px] hover:bg-left-bottom min-w-fit"
          onClick={() => onNavigate("landing")}
          style={{ transition: "background-size 0.3s ease-out" }}
        >
          <AstraLogo size={20} className="text-theme-primary sm:w-6 sm:h-6 -ml-1" />
          <span className="text-lg sm:text-xl lg:text-2xl font-medium tracking-wider text-theme-primary">
            STRA AI
          </span>
        </div>
        <div className="hidden lg:flex items-center gap-3 xl:gap-4 text-xs sm:text-sm font-medium text-theme-primary">
          <a href="#features"
            className="pb-1 bg-gradient-to-r from-white to-white bg-[length:0%_2px] bg-no-repeat bg-right-bottom hover:bg-[length:100%_2px] hover:bg-left-bottom"
            style={{ transition: "background-size 0.3s ease-out" }}>
            {t.navFeatures}
          </a>
          <div className="relative group flex items-center">
            <a href="#demo"
              className="pb-1 bg-gradient-to-r from-white to-white bg-[length:0%_2px] bg-no-repeat bg-right-bottom hover:bg-[length:100%_2px] hover:bg-left-bottom flex items-center gap-1 cursor-pointer"
              style={{ transition: "background-size 0.3s ease-out" }}>
              {t.navDemo}
              <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />
            </a>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-52 bg-theme-card border border-theme-soft rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col overflow-hidden">
              <a href="#api-hub" className="group/item px-4 py-3 text-[13px] font-medium text-white transition-colors border-b border-theme-soft block">
                <span className="pb-1 bg-gradient-to-r from-white to-white bg-[length:0%_2px] bg-no-repeat bg-right-bottom group-hover/item:bg-[length:100%_2px] group-hover/item:bg-left-bottom inline-block" style={{ transition: "background-size 0.3s ease-out" }}>
                  Developer API Hub
                </span>
              </a>
              <a href="#playground" className="group/item px-4 py-3 text-[13px] font-medium text-white transition-colors block">
                <span className="pb-1 bg-gradient-to-r from-white to-white bg-[length:0%_2px] bg-no-repeat bg-right-bottom group-hover/item:bg-[length:100%_2px] group-hover/item:bg-left-bottom inline-block" style={{ transition: "background-size 0.3s ease-out" }}>
                  Interactive Code Playground
                </span>
              </a>
            </div>
          </div>
          <a href="#pricing"
            className="pb-1 bg-gradient-to-r from-white to-white bg-[length:0%_2px] bg-no-repeat bg-right-bottom hover:bg-[length:100%_2px] hover:bg-left-bottom"
            style={{ transition: "background-size 0.3s ease-out" }}>
            {t.navPricing}
          </a>
          <a href="#"
            className="pb-1 bg-gradient-to-r from-white to-white bg-[length:0%_2px] bg-no-repeat bg-right-bottom hover:bg-[length:100%_2px] hover:bg-left-bottom"
            style={{ transition: "background-size 0.3s ease-out" }}>
            Projects
          </a>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
          <button
            onClick={() => onNavigate("login")}
            className="pb-1 text-xs sm:text-sm font-medium text-theme-primary bg-gradient-to-r from-white to-white bg-[length:0%_2px] bg-no-repeat bg-right-bottom hover:bg-[length:100%_2px] hover:bg-left-bottom"
            style={{ transition: "background-size 0.3s ease-out" }}
          >
            {t.navLogin}
          </button>
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="lg:hidden p-2 rounded-lg bg-theme-card border border-theme-soft text-theme-primary hover:bg-theme-subtle focus:outline-none focus:ring-2 focus:ring-theme-primary"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button
            onClick={() => onNavigate("register")}
            className="lg:inline-flex hidden pb-1 text-xs sm:text-sm font-medium text-theme-primary bg-gradient-to-r from-white to-white bg-[length:0%_2px] bg-no-repeat bg-right-bottom hover:bg-[length:100%_2px] hover:bg-left-bottom flex items-center gap-1 sm:gap-1.5"
            style={{ transition: "background-size 0.3s ease-out" }}
          >
            {t.navGetStarted}
            <ArrowRight size={12} className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-theme-card border-t border-theme-soft shadow-2xl z-50">
            <div className="flex flex-col gap-2 p-4">
              <button onClick={() => { setMobileMenuOpen(false); onNavigate("register"); }} className="text-left text-sm text-theme-primary py-2 px-3 rounded-lg hover:bg-theme-subtle">{t.navGetStarted}</button>
              <button onClick={() => { setMobileMenuOpen(false); window.location.hash = "#features"; }} className="text-left text-sm text-theme-primary py-2 px-3 rounded-lg hover:bg-theme-subtle">{t.navFeatures}</button>
              <button onClick={() => { setMobileMenuOpen(false); window.location.hash = "#demo"; }} className="text-left text-sm text-theme-primary py-2 px-3 rounded-lg hover:bg-theme-subtle">{t.navDemo}</button>
              <button onClick={() => { setMobileMenuOpen(false); window.location.hash = "#api-hub"; }} className="text-left text-sm text-theme-primary py-2 px-3 rounded-lg hover:bg-theme-subtle">Developer API Hub</button>
              <button onClick={() => { setMobileMenuOpen(false); window.location.hash = "#playground"; }} className="text-left text-sm text-theme-primary py-2 px-3 rounded-lg hover:bg-theme-subtle">Interactive Code Playground</button>
              <button onClick={() => { setMobileMenuOpen(false); window.location.hash = "#pricing"; }} className="text-left text-sm text-theme-primary py-2 px-3 rounded-lg hover:bg-theme-subtle">{t.navPricing}</button>
              <button onClick={() => { setMobileMenuOpen(false); window.location.hash = "#"; }} className="text-left text-sm text-theme-primary py-2 px-3 rounded-lg hover:bg-theme-subtle">Projects</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-8 pb-10 sm:pt-10 md:pt-14 lg:pt-16 sm:pb-12 md:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8 w-full mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full badge-pill text-xs font-medium mb-3 sm:mb-4 animate-fade-in">
          <Sparkles size={12} />
          <span>{t.heroBadge}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-tight text-theme-primary mb-4 sm:mb-6 animate-fade-in">
          {t.heroTitleStart}
          <span className="text-theme-primary font-bold">{t.heroTitleHighlight}</span>
        </h1>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-theme-secondary max-w-2xl mb-6 sm:mb-8 leading-relaxed px-2 sm:px-0">
          {t.heroSubtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
          <button
            onClick={() => onNavigate("register")}
            className="bg-theme-primary hover:opacity-90 text-theme-card font-medium px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
          >
            {t.heroBtnPrimary}
            <ArrowRight size={16} className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
          <a
            href="#demo"
            className="cta-secondary font-medium px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
          >
            {t.heroBtnSecondary}
          </a>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="relative py-8 sm:py-10 md:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="text-center mb-4 md:mb-6">
          <h2 className="text-3xl md:text-4xl font-medium mb-4 text-theme-primary">Interactive AI Sandbox</h2>
          <p className="text-theme-secondary max-w-lg mx-auto">Experience our real-time messaging, syntax code highlights, and smooth feedback right here.</p>
        </div>

        <div className="w-full glass-card rounded-2xl overflow-hidden flex flex-col h-64 sm:h-80 md:h-96 lg:h-[500px]">
          {/* Chat Header */}
          <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 bg-theme-card border-b border-theme-soft flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex gap-2 shrink-0">
                <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500/80" />
                <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500/80" />
                <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="font-medium text-xs sm:text-sm tracking-wide text-theme-primary">ASTRA AI CORE</span>
            </div>
            <span className="text-[10px] sm:text-xs text-theme-muted uppercase font-mono">Sandbox Mode</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 bg-theme-subtle">
            {demoMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2 sm:gap-3 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium shrink-0 ${msg.sender === "user" ? "bg-theme-primary text-theme-card" : "bg-theme-card text-theme-secondary"
                  }`}>
                  {msg.sender === "user" ? "U" : "AI"}
                </div>
                <div className={`p-2 sm:p-3 rounded-lg sm:rounded-2xl text-[12px] sm:text-[13px] leading-relaxed border ${msg.sender === "user"
                  ? "bg-theme-primary text-theme-card border-theme rounded-tr-none"
                  : "bg-theme-card text-theme-secondary border-theme rounded-tl-none"
                  }`}>
                  {msg.content.includes("```") ? (
                    <div>
                      <p className="mb-1 sm:mb-2">Here is the snippet:</p>
                      <pre className="bg-theme-subtle p-2 rounded font-mono text-[10px] sm:text-xs text-theme-sky overflow-x-auto">
                        {msg.content.replace(/```python|```/g, "")}
                      </pre>
                    </div>
                  ) : (
                    <div className="line-clamp-3 sm:line-clamp-none">
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isDemoTyping && (
              <div className="flex gap-2 sm:gap-3 mr-auto items-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-theme-card border border-theme text-theme-secondary flex items-center justify-center text-[10px] sm:text-xs font-medium">
                  AI
                </div>
                <div className="flex gap-1 py-2 sm:py-3 px-3 sm:px-4 bg-theme-card border border-theme rounded-lg sm:rounded-2xl rounded-tl-none">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-theme-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-theme-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-theme-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleDemoSubmit} className="p-2 sm:p-3 md:p-4 bg-theme-card border-t border-theme-soft flex flex-row gap-2 items-center">
            <button
              type="button"
              className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-theme-subtle border border-theme hover:bg-theme-section-alt text-theme-secondary transition-colors flex items-center justify-center shrink-0"
              title="Upload Media"
              onClick={() => alert("Media upload simulation")}
            >
              <Plus size={16} className="sm:w-5 sm:h-5" />
            </button>
            <div className="relative flex-1 rounded-lg sm:rounded-xl overflow-hidden p-[1.5px] group min-w-0">
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,#7dd3fc_50%,transparent_100%)] bg-[length:200%_100%] animate-gradient-x group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] blur-[2px] opacity-90 transition-opacity duration-500" />
              <input
                type="text"
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                placeholder="Ask anything..."
                className="relative z-10 w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl input-theme !border-transparent focus:!border-transparent text-xs sm:text-sm outline-none"
              />
            </div>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-1.5 sm:px-2 py-2 sm:py-3 rounded-lg sm:rounded-xl input-theme text-[9px] sm:text-xs outline-none cursor-pointer shrink-0 max-w-[100px] sm:max-w-none"
            >
              <option value="gemini-3.5-flash-medium">Gemini 3.5 Flash (Medium) Fast</option>
              <option value="gemini-3.5-flash-high">Gemini 3.5 Flash (High) Fast</option>
              <option value="gemini-3.5-flash-low">Gemini 3.5 Flash (Low) Fast</option>
              <option value="gemini-3.1-pro-low">Gemini 3.1 Pro (Low)</option>
              <option value="gemini-3.1-pro-high">Gemini 3.1 Pro (High)</option>
              <option value="gpt-4o">ChatGPT (GPT-4o)</option>
              <option value="gpt-4-turbo">ChatGPT (GPT-4 Turbo)</option>
              <option value="claude-sonnet-4.6">Claude Sonnet 4.6 (Thinking)</option>
              <option value="claude-opus-4.6">Claude Opus 4.6 (Thinking)</option>
              <option value="gpt-oss-120b">GPT-OSS 120B (Medium)</option>
            </select>
            <button
              type="submit"
              className="px-3 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-theme-primary text-theme-card font-medium hover:opacity-90 transition-all text-xs sm:text-sm shrink-0 flex items-center gap-1 justify-center"
            >
              Send
              <ArrowRight size={14} />
            </button>
          </form>
        </div>
      </section>
      {/* Developer API Hub Section */}
      <section id="api-hub" className="relative py-8 sm:py-10 md:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="text-center mb-4 md:mb-6">
          <h2 className="text-3xl md:text-4xl font-medium mb-4 text-theme-primary">Developer API Hub</h2>
          <p className="text-theme-secondary max-w-lg mx-auto">Seamless integration with a few lines of code. Built for modern frameworks.</p>
        </div>

        <div className="w-full glass-card rounded-2xl overflow-hidden flex flex-col h-72 sm:h-80 md:h-[400px]">
          {/* Editor Header */}
          <div className="px-3 sm:px-4 py-3 bg-theme-card border-b border-theme-soft flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="flex items-center gap-2 max-w-xs flex-1 min-w-0 bg-theme-subtle px-3 py-1.5 rounded-full border border-theme text-xs sm:text-sm text-theme-secondary w-full sm:w-auto">
              <Search size={12} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbols, files..."
                className="bg-transparent border-none outline-none w-full text-theme-primary placeholder-theme-muted text-xs sm:text-sm"
              />
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-theme-muted font-mono justify-end w-full sm:w-auto">
              <span className="text-theme-sky truncate">{activeFile}</span>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-48 bg-theme-subtle border-r border-theme-soft p-3 hidden md:block">
              <span className="text-[10px] font-medium text-theme-muted uppercase tracking-widest mb-4 block">Explorer</span>
              <ul className="space-y-1.5 text-[12px] sm:text-[13px] text-theme-secondary font-mono">
                {Object.keys(fileContents).filter(f => f.toLowerCase().includes(searchQuery.toLowerCase())).map(file => (
                  <li
                    key={file}
                    onClick={() => setActiveFile(file)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${activeFile === file ? 'bg-theme-card border border-theme-soft text-theme-primary' : 'hover:bg-theme-card'}`}
                  >
                    <FileText size={14} className={file === 'app.js' ? "text-theme-sky" : file === 'config.ts' ? "text-yellow-500" : "text-blue-400"} />
                    <span className="truncate">{file}</span>
                  </li>
                ))}
                {Object.keys(fileContents).filter(f => f.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <li className="px-2 py-1.5 text-theme-muted italic text-[11px]">No files found.</li>
                )}
              </ul>
            </div>
            {/* Code Area */}
            <div className="flex-1 p-3 sm:p-5 overflow-y-auto bg-[#13110e]">
              <pre className="font-mono text-[12px] sm:text-[14px] leading-relaxed text-slate-300 whitespace-pre-wrap break-words">
                <code>
                  <span dangerouslySetInnerHTML={highlightCode(codeText)} />
                  <span className="animate-pulse w-2 h-4 bg-theme-sky inline-block ml-1 align-middle" />
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Code Playground */}
      <section id="playground" className="relative py-8 sm:py-10 md:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto animate-fade-in" style={{ animationDelay: '0.5s' }}>
        <div className="text-center mb-4 md:mb-6">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-theme-primary">Interactive Code Playground</h2>
          <p className="text-theme-secondary max-w-lg mx-auto">Write, execute, and test code right here in the browser. See how easily Astra integrates.</p>
        </div>

        <div className="w-full glass-card rounded-2xl overflow-hidden flex flex-col h-64 sm:h-80 md:h-[550px] shadow-2xl border border-white/10 bg-[#0d0d0d]">
          {/* Header/Toolbar */}
          <div className="px-2 sm:px-4 py-2 sm:py-3 bg-[#161616] border-b border-white/10 flex flex-row items-center justify-between gap-1 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-4 min-w-0">
              <div className="flex gap-1.5 shrink-0">
                <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500/80" />
                <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500/80" />
                <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex items-center gap-0.5 bg-[#222] p-0.5 sm:p-1 rounded-lg shrink-0">
                {["javascript", "python", "curl"].map(lang => (
                  <button
                    key={lang}
                    onClick={() => setPlaygroundLang(lang)}
                    className={`px-1.5 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-xs font-mono rounded-md transition-colors ${playgroundLang === lang ? 'bg-[#333] text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    <span className="md:hidden">
                      {lang === 'javascript' ? 'JS' : lang === 'python' ? 'PY' : 'SH'}
                    </span>
                    <span className="hidden md:inline">
                      {lang === 'javascript' ? 'index.js' : lang === 'python' ? 'main.py' : 'request.sh'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={runPlaygroundCode}
              disabled={isPlaygroundRunning}
              className={`flex items-center gap-0.5 sm:gap-1 px-2 sm:px-4 py-1 sm:py-1.5 rounded-lg text-[8px] sm:text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${isPlaygroundRunning ? 'bg-white/40 text-black/50 cursor-not-allowed' : 'bg-white hover:bg-white/90 text-black'}`}
            >
              {isPlaygroundRunning ? (
                <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <div className="w-0 h-0 border-y-2 sm:border-y-3 border-y-transparent border-l-3 sm:border-l-4 border-l-black" />
              )}
              <span className="hidden sm:inline">{isPlaygroundRunning ? "Running..." : "Run Code"}</span>
              <span className="sm:hidden">{isPlaygroundRunning ? "..." : "Run"}</span>
            </button>
          </div>

          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Editor Area */}
            <div className="flex-1 bg-[#13110e] relative overflow-hidden group">
              {/* Highlighted syntax layer */}
              <pre className="absolute inset-0 p-1.5 sm:p-3 md:p-4 font-mono text-[9px] sm:text-[12px] md:text-[14px] leading-relaxed whitespace-pre-wrap break-words pointer-events-none z-0 m-0 text-slate-300" aria-hidden="true">
                <code dangerouslySetInnerHTML={highlightCode(playgroundCode)} />
              </pre>
              {/* Transparent textarea for actual editing */}
              <textarea
                value={playgroundCode}
                onChange={(e) => setPlaygroundCode(e.target.value)}
                spellCheck="false"
                className="w-full h-full p-1.5 sm:p-3 md:p-4 bg-transparent text-transparent caret-white font-mono text-[9px] sm:text-[12px] md:text-[14px] leading-relaxed resize-none outline-none z-10 relative whitespace-pre-wrap break-words scrollbar"
                style={{ tabSize: 2 }}
              />
            </div>
            {/* Terminal Console */}
            <div className="h-16 sm:h-24 md:h-48 bg-[#000000] border-t border-white/10 p-1.5 sm:p-3 md:p-4 font-mono text-[8px] sm:text-[11px] md:text-[13px] overflow-y-auto scrollbar">
              <div className="text-slate-500 mb-1 uppercase tracking-widest text-[7px] sm:text-[9px] md:text-[10px]">Terminal Output</div>
              {playgroundOutput.length === 0 ? (
                <div className="text-slate-600 italic text-[7px] sm:text-[9px] md:text-sm">Click "Run" to execute...</div>
              ) : (
                <div className="flex flex-col space-y-0 sm:space-y-0.5 md:space-y-1">
                  {playgroundOutput.map((line, idx) => (
                    <div key={idx} className={line.startsWith(">") ? "text-slate-400" : "text-emerald-400 whitespace-pre"}>
                      {line}
                    </div>
                  ))}
                  {isPlaygroundRunning && <div className="w-2 h-4 bg-slate-400 animate-pulse mt-1" />}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Features Section */}
      <section id="features" className="relative py-8 sm:py-10 md:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="text-center mb-4 md:mb-6">
          <h2 className="text-3xl md:text-4xl font-medium mb-4 text-theme-primary">Platform Core Features</h2>
          <p className="text-theme-secondary max-w-lg mx-auto">Discover the underlying models and processing engines built into Astra AI.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left: Feature List */}
          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            {featuresData.map((feature, idx) => {
              const Icon = feature.icon;
              const isActive = activeFeature === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveFeature(idx)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 border ${isActive ? 'bg-theme-card border-theme shadow-lg transform scale-[1.02]' : 'bg-transparent border-transparent hover:bg-theme-subtle'} flex gap-4 items-center`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-theme-primary text-theme-card' : 'bg-theme-card border border-theme text-theme-secondary'}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className={`text-sm font-medium ${isActive ? 'text-theme-primary' : 'text-theme-secondary'}`}>{feature.title}</h3>
                    {isActive && <p className="text-xs text-theme-muted mt-1 animate-fade-in">{feature.desc}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Feature Visualizer */}
          <div className="w-full lg:w-2/3 glass-card rounded-3xl h-64 sm:h-80 md:h-[450px] overflow-hidden relative flex items-center justify-center bg-theme-subtle">
            {/* Visual 0: Streaming */}
            {activeFeature === 0 && (
              <div className="w-full max-w-md p-6 bg-theme-card border border-theme rounded-2xl shadow-xl animate-fade-in flex flex-col gap-4">
                <div className="flex items-center gap-3 border-b border-theme pb-3">
                  <div className="w-8 h-8 rounded-full bg-theme-primary text-theme-card flex items-center justify-center text-xs font-medium">AI</div>
                  <div className="text-sm font-medium text-theme-primary">Astra Streaming Response</div>
                </div>
                <div className="text-sm text-theme-secondary leading-relaxed font-mono">
                  <span className="animate-[shimmer_2s_linear_infinite] bg-[linear-gradient(90deg,var(--text-primary)_0%,var(--text-muted)_50%,var(--text-primary)_100%)] bg-[length:200%_100%] text-transparent bg-clip-text">
                    Generating response dynamically...
                  </span>
                </div>
                <div className="flex gap-1 mt-2">
                  <div className="w-2 h-2 rounded-full bg-theme-sky animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-theme-sky animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-theme-sky animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Visual 1: PDF */}
            {activeFeature === 1 && (
              <div className="w-full max-w-sm aspect-square rounded-full border border-dashed border-theme-sky/50 flex flex-col items-center justify-center gap-4 bg-theme-sky/5 animate-fade-in relative">
                <div className="absolute inset-0 rounded-full border border-theme-sky/20 animate-ping opacity-20" />
                <FileText size={48} className="text-theme-sky animate-bounce" />
                <div className="text-center">
                  <p className="text-sm font-medium text-theme-primary">Ingesting Document</p>
                  <p className="text-xs text-theme-muted mt-1">Parsing vector embeddings...</p>
                </div>
                <div className="w-32 h-1.5 bg-theme-card rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-theme-sky w-1/2 animate-[shimmer_2s_linear_infinite] relative" />
                </div>
              </div>
            )}

            {/* Visual 2: Image */}
            {activeFeature === 2 && (
              <div className="w-full max-w-md h-48 sm:h-56 md:h-64 bg-theme-card border border-theme rounded-2xl overflow-hidden relative animate-fade-in flex items-center justify-center group">
                <Camera size={48} className="text-theme-muted/30" />
                {/* Laser scan line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-theme-sky shadow-[0_0_15px_rgba(56,189,248,0.8)] animate-[float_3s_ease-in-out_infinite] z-10" />
                {/* Bounding box */}
                <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-2 border-theme-sky bg-theme-sky/10 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-500" />
                <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-700">
                  Detected: Diagram Layout (98%)
                </div>
              </div>
            )}

            {/* Visual 3: Hashed API Keys */}
            {activeFeature === 3 && (
              <div className="w-full max-w-md bg-theme-card border border-theme rounded-2xl shadow-xl p-6 animate-fade-in space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm font-medium text-theme-primary">Secret Keys</span>
                  <button className="text-xs bg-theme-subtle px-3 py-1 rounded-full text-theme-secondary border border-theme">Generate New</button>
                </div>
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-theme-subtle border border-theme">
                    <div className="flex items-center gap-3">
                      <Key size={16} className="text-theme-muted" />
                      <div className="font-mono text-xs text-theme-secondary">sk-proj-<span className="blur-[4px] select-none">••••••••••••••••</span></div>
                    </div>
                    <button className="text-xs text-theme-sky font-medium">Copy</button>
                  </div>
                ))}
              </div>
            )}

            {/* Visual 4: Voice */}
            {activeFeature === 4 && (
              <div className="flex items-center justify-center gap-2 h-32 animate-fade-in">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 bg-theme-primary rounded-full animate-pulse"
                    style={{
                      height: `${20 + Math.random() * 80}%`,
                      animationDuration: `${0.5 + Math.random() * 0.5}s`,
                      animationDelay: `${Math.random() * 0.5}s`
                    }}
                  />
                ))}
              </div>
            )}

            {/* Visual 5: Admin */}
            {activeFeature === 5 && (
              <div className="w-full max-w-md bg-theme-card border border-theme rounded-2xl p-6 animate-fade-in">
                <div className="flex justify-between items-end border-b border-theme pb-4 mb-4">
                  <div>
                    <p className="text-xs text-theme-muted mb-1">Total Requests</p>
                    <p className="text-3xl font-semibold text-theme-primary">2.4M</p>
                  </div>
                  <Activity className="text-emerald-500 mb-1" size={24} />
                </div>
                <div className="flex items-end gap-2 h-24 mt-6">
                  {[40, 60, 30, 80, 50, 90, 70, 100].map((h, i) => (
                    <div key={i} className="flex-1 bg-theme-subtle rounded-t-sm relative group cursor-pointer hover:bg-theme-sky/20 transition-colors" style={{ height: `${h}%` }}>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-theme-primary text-theme-card text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {h}k
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-8 sm:py-10 md:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 w-full mx-auto">
        <div className="text-center mb-4 md:mb-6">
          <h2 className="text-3xl md:text-4xl font-medium mb-4 text-theme-primary">Flexible Subscription Tiers</h2>
          <p className="text-theme-secondary max-w-lg mx-auto">Access premium parameters. Scale limits instantly as your project demands expand.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {pricingTiers.map((tier, idx) => (
            <div
              key={idx}
              className={`glass-card p-8 rounded-2xl flex flex-col relative ${tier.popular ? "border-white/20" : ""
                }`}
            >
              {tier.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-theme-primary text-theme-card font-medium text-xs uppercase tracking-widest px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-medium text-theme-primary mb-2">{tier.name}</h3>
              <p className="text-xs text-theme-muted mb-6 min-h-[36px]">{tier.desc}</p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-semibold text-theme-primary">{tier.price}</span>
                {tier.period && <span className="text-sm text-theme-muted">{tier.period}</span>}
              </div>
              <ul className="space-y-4 mb-4 flex-1">
                {tier.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2.5 text-sm text-theme-secondary">
                    <Check size={16} className="text-theme-sky shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => onNavigate("register")}
                className={`w-full py-3 rounded-xl font-medium transition-all ${tier.popular
                  ? "cta-popular"
                  : "cta-secondary"
                  }`}
              >
                {tier.button}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="relative py-8 sm:py-10 md:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 w-full mx-auto">
        <div className="glass-card p-6 md:p-8 rounded-3xl flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-medium text-theme-primary mb-4">Have Questions? Reach Out</h2>
            <p className="text-sm text-theme-secondary leading-relaxed mb-6">
              Our engineering team is always ready to answer questions about architecture customisations or billing support integrations.
            </p>
            <div className="flex items-center gap-3 text-theme-secondary text-sm">
              <Mail size={16} className="text-theme-sky" />
              <span>support@astra.ai</span>
            </div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); alert('Message sent!'); e.target.reset(); }} className="flex-1 w-full space-y-4">
            <input
              type="text"
              required
              placeholder="Your Name"
              className="w-full px-4 py-3 rounded-xl bg-transparent border border-theme-soft focus:border-theme-primary outline-none text-theme-primary placeholder-theme-muted text-sm transition-all"
            />
            <input
              type="email"
              required
              placeholder="Email Address"
              className="w-full px-4 py-3 rounded-xl bg-transparent border border-theme-soft focus:border-theme-primary outline-none text-theme-primary placeholder-theme-muted text-sm transition-all"
            />
            <textarea
              required
              placeholder="Your Message"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-transparent border border-theme-soft focus:border-theme-primary outline-none text-theme-primary placeholder-theme-muted text-sm resize-none transition-all"
            />
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-theme-primary hover:opacity-90 text-theme-card font-medium text-sm transition-all"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-theme-footer bg-theme-footer text-theme-footer px-3 md:px-4 text-sm">
        <div className="w-full mx-auto grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6">
          {/* Product Column */}
          <div className="space-y-3 text-left">
            <h4 className="font-medium text-theme-footer-heading tracking-wide">{t.footerProduct || "PRODUCT"}</h4>
            <ul className="space-y-1.5">
              <li><a href="#features" className="footer-link">Core Features</a></li>
              <li><a href="#demo" className="footer-link">Interactive Demo</a></li>
              <li><a href="#pricing" className="footer-link">Pricing Plans</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); alert("Feature coming soon!"); }} className="footer-link">PDF Context Ingest</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); alert("Feature coming soon!"); }} className="footer-link">Visual OCR Reader</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); alert("Feature coming soon!"); }} className="footer-link">Voice Chat Synthesizer</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); alert("Feature coming soon!"); }} className="footer-link">Hashed API Keys</a></li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-3 text-left">
            <h4 className="font-medium text-theme-footer-heading tracking-wide">{t.footerResources || "RESOURCES"}</h4>
            <ul className="space-y-1.5">
              <li><button onClick={() => onNavigate("help")} className="footer-link text-left">Help Center</button></li>
              <li><a href="#faq" className="footer-link">FAQ Support</a></li>
              <li><a href="#" className="footer-link">API Integration docs</a></li>
              <li><a href="#" className="footer-link">System Status</a></li>
              <li><a href="#" className="footer-link">Model Parameters</a></li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="space-y-3 text-left">
            <h4 className="font-medium text-theme-footer-heading tracking-wide">{t.footerCompany || "COMPANY"}</h4>
            <ul className="space-y-1.5">

              <li><button onClick={() => onNavigate("about")} className="footer-link text-left">About Us</button></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); alert("Feature coming soon!"); }} className="footer-link">Careers</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); alert("Feature coming soon!"); }} className="footer-link">Blog</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); alert("Feature coming soon!"); }} className="footer-link">Developer Forum</a></li>
              <li><button onClick={() => onNavigate("contact")} className="footer-link text-left">Contact Sales</button></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="space-y-3 text-left">
            <h4 className="font-medium text-theme-footer-heading tracking-wide">{t.footerLegal || "LEGAL"}</h4>
            <ul className="space-y-1.5">
              <li><a href="#" onClick={(e) => { e.preventDefault(); alert("Feature coming soon!"); }} className="footer-link">Terms of Service</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); alert("Feature coming soon!"); }} className="footer-link">Privacy Policy</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); alert("Feature coming soon!"); }} className="footer-link">Security Auditing</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); alert("Feature coming soon!"); }} className="footer-link">Data Protection</a></li>
            </ul>
          </div>

          {/* Connect Column */}
          <div className="space-y-3 text-left">
            <h4 className="font-medium text-theme-footer-heading tracking-wide">{t.footerConnect || "CONNECT"}</h4>
            <ul className="space-y-1.5">
              <li><a href="https://github.com/aryanjoshi458-rgb/" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a></li>
            </ul>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="w-full mx-auto pt-8 border-t border-theme-footer flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <div className="flex items-center gap-3 text-theme-muted">
            <span>&copy; {new Date().getFullYear()} Astra AI Inc.</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="shrink-0" />
              <span>SOC 2 Certified</span>
            </div>
          </div>

          {/* Right settings pills */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Pill */}
            <div className="flex items-center gap-0.5 bg-theme-card border border-theme rounded-full p-1 select-none">
              {[
                { mode: "system", icon: Monitor, title: t.themeSystem || "System" },
                { mode: "light", icon: Sun, title: t.themeLight || "Light" },
                { mode: "dark", icon: Moon, title: t.themeDark || "Dark" },
              ].map(({ mode, icon: Icon, title }) => (
                <button
                  key={mode}
                  type="button"
                  title={title}
                  onClick={() => setTheme(mode)}
                  className={`p-1.5 rounded-full transition-all ${theme === mode
                    ? "bg-theme-primary text-theme-card shadow-sm"
                    : "text-theme-muted hover:text-theme-primary hover:bg-theme-subtle hover:scale-105"
                    }`}
                >
                  <Icon size={13} />
                </button>
              ))}
            </div>

            {/* Language selector Pill */}
            <div className="relative">
              <div
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 bg-theme-card border border-theme rounded-full py-1 px-3 select-none text-theme-muted hover:text-theme-primary hover:bg-theme-subtle cursor-pointer transition-colors"
              >
                <Globe size={14} />
                <span className="text-[11px] font-medium">{t.languageName || "English"}</span>
                <ChevronDown size={12} />
              </div>

              {showLangMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-32 bg-theme-card border border-theme rounded-xl shadow-lg overflow-hidden flex flex-col py-1 z-50 animate-fade-in origin-bottom-right">
                  <button
                    onClick={() => { setLang("en"); setShowLangMenu(false); }}
                    className={`text-left px-4 py-2 text-xs hover:bg-theme-subtle transition-colors ${lang === "en" ? "text-theme-primary font-medium" : "text-theme-secondary"}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => { setLang("hi"); setShowLangMenu(false); }}
                    className={`text-left px-4 py-2 text-xs hover:bg-theme-subtle transition-colors ${lang === "hi" ? "text-theme-primary font-medium" : "text-theme-secondary"}`}
                  >
                    हिन्दी (Hindi)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
