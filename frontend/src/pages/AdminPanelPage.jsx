import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import AstraLogo from "../components/AstraLogo";
import { ArrowLeft, Users, MessageSquare, Key, Shield, Zap, TrendingUp, AlertTriangle, UserMinus, ShieldAlert, Sparkles, Database, User, DollarSign, Percent, Save, RotateCcw, ChevronDown, CheckCircle, PanelLeftClose, PanelLeft, LayoutDashboard, CreditCard, Settings, Plus, LogOut, Power, Sun, Moon, HelpCircle, Eye, EyeOff } from "lucide-react";
import ApiClient from "../services/api";

export const AdminPanelPage = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Dashboard Analytics States
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Settings States
  const [llmApiKey, setLlmApiKey] = useState("");
  const [llmApiKeyInput, setLlmApiKeyInput] = useState("");
  const [settingsKeysLoading, setSettingsKeysLoading] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState(() => localStorage.getItem('astra_currency'));
  const [autoCurrencyInfo, setAutoCurrencyInfo] = useState({ code: 'USD', symbol: '$', rate: 1.0 });
  const [currencyInfo, setCurrencyInfo] = useState({ code: 'USD', symbol: '$', rate: 1.0 });

  const ALL_CURRENCIES = [
    { code: 'USD', symbol: '$', label: 'US Dollar', flag: '🇺🇸', rate: 1.0 },
    { code: 'INR', symbol: '₹', label: 'Indian Rupee', flag: '🇮🇳', rate: 83.5 },
    { code: 'EUR', symbol: '€', label: 'Euro', flag: '🇪🇺', rate: 0.93 },
    { code: 'GBP', symbol: '£', label: 'British Pound', flag: '🇬🇧', rate: 0.79 },
    { code: 'JPY', symbol: '¥', label: 'Japanese Yen', flag: '🇯🇵', rate: 159.8 },
    { code: 'AUD', symbol: 'A$', label: 'Australian Dollar', flag: '🇦🇺', rate: 1.50 },
    { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar', flag: '🇨🇦', rate: 1.37 },
    { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc', flag: '🇨🇭', rate: 0.89 },
    { code: 'CNY', symbol: '¥', label: 'Chinese Yuan', flag: '🇨🇳', rate: 7.26 },
  ];

  useEffect(() => {
    if (user) {
      setProfileName(user.full_name || "");
      setProfileUsername(user.username || (user.email ? user.email.split("@")[0] : ""));
    }
  }, [user]);

  // Detect user's country and set currency accordingly
  useEffect(() => {
    const CURRENCY_MAP = {
      IN: { code: 'INR', symbol: '₹', rate: 83.5 },
      GB: { code: 'GBP', symbol: '£', rate: 0.79 },
      DE: { code: 'EUR', symbol: '€', rate: 0.93 },
      FR: { code: 'EUR', symbol: '€', rate: 0.93 },
      JP: { code: 'JPY', symbol: '¥', rate: 159.8 },
      CA: { code: 'CAD', symbol: 'C$', rate: 1.37 },
      AU: { code: 'AUD', symbol: 'A$', rate: 1.50 },
    };
    try {
      const locale = navigator.language || 'en-US';
      const country = locale.split('-')[1] || '';
      
      // Also check timezone as a backup for country detection
      let tzCountry = '';
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) {
        if (tz.startsWith('Asia/Kolkata') || tz.startsWith('Asia/Calcutta')) tzCountry = 'IN';
        else if (tz.startsWith('Europe/London')) tzCountry = 'GB';
        else if (tz.startsWith('Europe/Berlin') || tz.startsWith('Europe/Paris')) tzCountry = 'DE';
        else if (tz.startsWith('Asia/Tokyo')) tzCountry = 'JP';
        else if (tz.startsWith('America/Toronto') || tz.startsWith('America/Vancouver')) tzCountry = 'CA';
        else if (tz.startsWith('Australia/')) tzCountry = 'AU';
      }

      const activeCountry = country || tzCountry;
      if (activeCountry && CURRENCY_MAP[activeCountry]) {
        setAutoCurrencyInfo(CURRENCY_MAP[activeCountry]);
      } else if (locale.startsWith('hi') || locale.startsWith('en-IN')) {
        setAutoCurrencyInfo(CURRENCY_MAP['IN']);
      }
    } catch (e) {
      console.warn("Auto-currency detection failed: ", e);
    }
  }, []);

  // Update active currency conversion
  useEffect(() => {
    if (selectedCurrencyCode) {
      const match = ALL_CURRENCIES.find(c => c.code === selectedCurrencyCode);
      if (match) {
        setCurrencyInfo(match);
      }
    } else {
      setCurrencyInfo(autoCurrencyInfo);
    }
  }, [selectedCurrencyCode, autoCurrencyInfo]);

  useEffect(() => {
    if (activeTab === "developer") {
      fetchSettingsApiKeys();
    }
  }, [activeTab]);

  const fetchSettingsApiKeys = async () => {
    try {
      setSettingsKeysLoading(true);
      const keys = await ApiClient.get("/api/user/keys");
      if (keys && keys.length > 0) {
        setLlmApiKey(keys[0].api_key);
      } else {
        setLlmApiKey("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsKeysLoading(false);
    }
  };

  const handleSaveLlmKey = async (e) => {
    e.preventDefault();
    if (!llmApiKeyInput.trim()) return;
    try {
      await ApiClient.post("/api/user/keys", { api_key: llmApiKeyInput.trim() });
      setLlmApiKey(llmApiKeyInput.trim());
      setLlmApiKeyInput("");
    } catch (err) {
      alert("Failed to save LLM Key");
    }
  };

  const handleRemoveLlmKey = async () => {
    try {
      await ApiClient.delete("/api/user/keys");
      setLlmApiKey("");
    } catch (err) {
      alert("Failed to remove LLM Key");
    }
  };

  // Pricing states
  const [pricingPlans, setPricingPlans] = useState([]);
  const [pricingDraft, setPricingDraft] = useState([]);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingSaved, setPricingSaved] = useState(false);
  const [pricingError, setPricingError] = useState("");

  useEffect(() => {
    if (!user || !user.is_admin) {
      onNavigate("dashboard");
      return;
    }
    loadAdminData();
    loadPricing();
  }, [user]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError("");

      const statsData = await ApiClient.get("/api/admin/stats");
      setStats(statsData);

      const usersData = await ApiClient.get("/api/admin/users");
      setUsersList(usersData);

      const chatsData = await ApiClient.get("/api/admin/monitoring/chats");
      setRecentChats(chatsData);

    } catch (err) {
      console.error(err);
      setError("Failed to fetch administrative logs.");
    } finally {
      setLoading(false);
    }
  };

  const loadPricing = async () => {
    try {
      const plans = await ApiClient.get("/api/admin/pricing");
      setPricingPlans(plans);
      setPricingDraft(plans.map(p => ({ ...p })));
    } catch (err) {
      setPricingError("Failed to load pricing config.");
    }
  };

  const handlePricingChange = (tier, field, value) => {
    setPricingDraft(prev => prev.map(p =>
      p.tier === tier ? { ...p, [field]: value } : p
    ));
  };

  const handlePricingSave = async () => {
    try {
      setPricingSaving(true);
      setPricingError("");
      const updated = await ApiClient.put("/api/admin/pricing", { plans: pricingDraft });
      setPricingPlans(updated);
      setPricingDraft(updated.map(p => ({ ...p })));
      setPricingSaved(true);
      setTimeout(() => setPricingSaved(false), 3000);
    } catch (err) {
      setPricingError(err.message || "Failed to save pricing.");
    } finally {
      setPricingSaving(false);
    }
  };

  const handlePricingReset = () => {
    setPricingDraft(pricingPlans.map(p => ({ ...p })));
    setPricingError("");
  };

  // Block/Unblock User
  const handleToggleUserStatus = async (userId) => {
    if (userId === user.id) {
      alert("You cannot deactivate your own admin profile.");
      return;
    }
    try {
      const updatedUser = await ApiClient.put(`/api/admin/users/${userId}/toggle-status`, {});
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: updatedUser.is_active } : u))
      );
    } catch (err) {
      alert("Status toggle failed.");
    }
  };

  // Delete User Account
  const handleDeleteUser = async (userId) => {
    if (userId === user.id) {
      alert("You cannot delete your own admin account.");
      return;
    }
    if (!window.confirm("Are you sure you want to permanently delete this user account and all their chat history? This action cannot be undone.")) {
      return;
    }
    try {
      await ApiClient.delete(`/api/admin/users/${userId}`);
      setUsersList((prev) => prev.filter((u) => u.id !== userId));
      // Reload stats
      const statsData = await ApiClient.get("/api/admin/stats");
      setStats(statsData);
    } catch (err) {
      alert("Failed to delete user account.");
    }
  };

  // Modify user subscription tier
  const handleChangeUserTier = async (userId, tier) => {
    try {
      const updatedUser = await ApiClient.put(`/api/admin/users/${userId}/subscription`, { tier });
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, subscription_tier: updatedUser.subscription_tier, api_key_limit: updatedUser.api_key_limit } : u))
      );
      // Reload stats
      const statsData = await ApiClient.get("/api/admin/stats");
      setStats(statsData);
    } catch (err) {
      alert("Tier update failed.");
    }
  };

  const formatTimeSpent = (seconds) => {
    if (!seconds) return "< 30s";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    if (mins > 0) {
      return `${mins}m`;
    }
    return `${seconds}s`;
  };

  const formatLastActive = (isoString) => {
    if (!isoString) return "Never";
    try {
      const date = new Date(isoString);
      const diffMs = new Date() - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHrs / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHrs < 24) return `${diffHrs}h ago`;
      return `${diffDays}d ago`;
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <div className="min-h-screen bg-slate-55 dark:bg-[#0c0c0c] text-slate-800 dark:text-slate-200 flex flex-col font-sans">

      {/* Main Container with Sidebar */}
      <div className="flex-1 flex overflow-hidden h-screen">
        
        {/* Sidebar Nav */}
        <aside className={`bg-slate-50 dark:bg-[#121212] border-r border-slate-200 dark:border-white/5 flex flex-col shrink-0 overflow-hidden transition-all duration-300 ${
          isSidebarOpen ? "w-60" : "w-14"
        }`}>

          {/* Sidebar Header — logo + toggle */}
          <div className={`flex items-center border-b border-slate-200 dark:border-white/5 h-[52px] shrink-0 ${
            isSidebarOpen ? "px-3 justify-between" : "justify-center"
          }`}>
            {isSidebarOpen && (
              <button
                onClick={() => onNavigate("dashboard")}
                className="flex items-center gap-0.5 hover:opacity-80 transition-opacity group"
                title="Back to Dashboard"
              >
                <AstraLogo size={24} className="text-slate-900 dark:text-white" />
                <span className="text-xl font-black tracking-wider text-slate-900 dark:text-white uppercase">STRA AI</span>
              </button>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0"
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isSidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeft size={15} />}
            </button>
          </div>

          {/* Nav Items */}
          <div className={`flex flex-col gap-1 flex-1 overflow-y-auto scrollbar ${isSidebarOpen ? "p-3" : "items-center px-2 py-3"}`}>
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "overview", label: "Overview", icon: Users },
              { id: "telemetry", label: "Live Telemetry", icon: Zap },
              { id: "pricing", label: "Pricing Config", icon: DollarSign },
              { id: "payment", label: "Payment Settings", icon: CreditCard },
              { id: "general", label: "General Settings", icon: Settings },
              { id: "developer", label: "Developer Keys", icon: Key },
              { id: "account", label: "Account Profile", icon: User },
              { id: "help", label: "Help Center", icon: HelpCircle },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center rounded-lg text-[13px] font-semibold transition-all ${
                    isSidebarOpen ? "w-full gap-3 px-3.5 py-3" : "w-10 h-10 justify-center p-0"
                  } ${
                    isActive
                      ? "bg-slate-200 text-slate-900 dark:bg-white/10 dark:text-white font-bold"
                      : "text-slate-650 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title={!isSidebarOpen ? tab.label : undefined}
                >
                  <Icon size={16} className={isActive ? "text-slate-700 dark:text-white" : "text-slate-500 dark:text-slate-400"} />
                  {isSidebarOpen && <span>{tab.label}</span>}
                </button>
              );
            })}
          </div>

          {/* Sticky Sidebar Footer */}
          <div className={`p-3 border-t border-slate-200 dark:border-white/5 shrink-0 ${!isSidebarOpen && "flex flex-col items-center gap-2 px-2"}`}>
            {/* Appearance Toggle */}
            <div className="w-full flex items-center justify-between mb-2 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
              {isSidebarOpen ? (
                <>
                  <span>Appearance</span>
                  <div className="flex bg-slate-100 dark:bg-white/5 p-0.5 rounded-lg border border-slate-200 dark:border-white/5">
                    <button
                      onClick={() => setTheme("light")}
                      className={`p-1 rounded-md transition-all ${
                        theme === "light"
                          ? "bg-white text-slate-800 shadow-sm"
                          : "text-slate-400 hover:text-slate-650 dark:hover:text-white"
                      }`}
                      title="Light Mode"
                    >
                      <Sun size={13} />
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={`p-1 rounded-md transition-all ${
                        theme === "dark"
                          ? "bg-[#252525] text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-655 dark:hover:text-white"
                      }`}
                      title="Dark Mode"
                    >
                      <Moon size={13} />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={toggleTheme}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                  title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
                >
                  {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                </button>
              )}
            </div>

            <button
              onClick={() => logout()}
              className={`flex items-center rounded-lg text-[13px] font-semibold transition-all text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white ${
                isSidebarOpen ? "w-full gap-3 px-3 py-2.5" : "w-10 h-10 justify-center p-0"
              }`}
              title={!isSidebarOpen ? "Log out" : undefined}
            >
              <LogOut size={16} className="text-slate-500 dark:text-slate-400" />
              {isSidebarOpen && <span>Log out</span>}
            </button>
          </div>
        </aside>

        {/* Content Body */}
        <main className="flex-1 bg-white dark:bg-[#0c0c0c] overflow-y-auto p-6 md:p-8 scrollbar">

          {/* ── DASHBOARD TAB ── */}
          {activeTab === "dashboard" && stats && (
            <div className="animate-fade-in space-y-6">
              <div>
                <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2 select-none">
                  <LayoutDashboard size={20} className="text-slate-500" />
                  Astra Admin Dashboard
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 select-none">
                  Real-time analytics, user growth, revenue metrics, and system activity logs.
                </p>
              </div>

              {/* Summary widgets grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Site Visitors", val: "18", icon: Eye, color: "text-slate-800 dark:text-white bg-slate-100 dark:bg-white/5" },
                  { label: "Total Users", val: stats.total_users, icon: Users, color: "text-slate-800 dark:text-white bg-slate-100 dark:bg-white/5" },
                  { label: "Paid Upgrades", val: stats.premium_users, icon: Sparkles, color: "text-slate-800 dark:text-white bg-slate-100 dark:bg-white/5" },
                  { label: "Est. Revenue", val: `${currencyInfo.symbol}${Math.round(1.99 * currencyInfo.rate)}`, icon: DollarSign, color: "text-emerald-500 bg-emerald-500/10" }
                ].map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <div key={idx} className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{card.label}</span>
                        <div className={`w-7 h-7 rounded-lg ${card.color} flex items-center justify-center`}>
                          <Icon size={14} />
                        </div>
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-white">{card.val}</h3>
                    </div>
                  );
                })}
              </div>

              {/* Analytics Sections */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Platform Conversion Analytics */}
                <div className="md:col-span-3 bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-xs text-slate-800 dark:text-white font-bold select-none">
                    <Zap size={14} className="text-slate-500" />
                    <span>PLATFORM CONVERSION ANALYTICS</span>
                  </div>
                  <div className="space-y-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span>Free Tier Conversion Rate</span>
                        <span className="font-mono">33.3%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="w-[33.3%] h-full bg-slate-300 dark:bg-white/20 rounded-full" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span>Visitors to Sign-up Rate</span>
                        <span className="font-mono">16.7%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="w-[16.7%] h-full bg-slate-300 dark:bg-white/20 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Message Volume */}
                <div className="md:col-span-2 bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-xs text-slate-800 dark:text-white font-bold select-none">
                    <Database size={14} className="text-slate-500" />
                    <span>SYSTEM MESSAGE VOLUME</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Total Chats</span>
                      <span className="text-xl font-bold text-slate-800 dark:text-white">{stats.total_chats}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Total Messages</span>
                      <span className="text-xl font-bold text-slate-800 dark:text-white">{stats.total_messages}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && stats && (
            <div className="animate-fade-in space-y-6 max-w-6xl">
              <div>
                <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2 select-none">
                  <Users size={20} className="text-slate-500" />
                  Registered System Users
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 select-none">
                  Manage user profiles, account permissions, and API key limits.
                </p>
              </div>

              <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-[#151515] border-b border-slate-200 dark:border-white/5 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="p-4">User Email / ID</th>
                        <th className="p-4">Login Via</th>
                        <th className="p-4">Time Spent</th>
                        <th className="p-4">Last Active</th>
                        <th className="p-4">Subscription tier</th>
                        <th className="p-4">Access Level</th>
                        <th className="p-4">Key Limits</th>
                        <th className="p-4">Account Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                      {usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] text-slate-700 dark:text-slate-300">
                          <td className="p-4 flex items-center gap-3">
                            {u.avatar_url ? (
                              <img
                                src={u.avatar_url}
                                alt=""
                                className="w-7 h-7 rounded-full border border-slate-200 dark:border-white/5 object-cover"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-white/10 border border-slate-200 dark:border-white/5 flex items-center justify-center shrink-0">
                                <User size={14} className="text-slate-500 dark:text-white/70" />
                              </div>
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-slate-855 dark:text-white flex items-center gap-1.5 truncate">
                                {u.full_name}
                                {u.deletion_requested_at && (
                                  <span className="px-1.5 py-0.5 rounded bg-white/15 text-white text-[8px] font-bold uppercase tracking-wider animate-pulse flex items-center gap-1 shrink-0">
                                    <AlertTriangle size={8} /> Delete Req
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono truncate">{u.email}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-[#1e1e1e] text-slate-700 dark:text-white uppercase tracking-wider">
                              {u.login_provider || 'email'}
                            </span>
                          </td>
                          <td className="p-4 font-mono">
                            {formatTimeSpent(u.total_time_spent)}
                          </td>
                          <td className="p-4 font-mono text-slate-500">
                            {formatLastActive(u.last_active_at)}
                          </td>
                          <td className="p-4">
                            <select
                              value={u.subscription_tier}
                              onChange={(e) => handleChangeUserTier(u.id, e.target.value)}
                              className="bg-slate-100 dark:bg-[#202020] border border-slate-250 dark:border-white/5 rounded px-2 py-1 text-xs outline-none text-slate-800 dark:text-white"
                            >
                              <option value="free">Free</option>
                              <option value="premium">Premium</option>
                              <option value="enterprise">Enterprise</option>
                            </select>
                          </td>
                          <td className="p-4">
                            {u.is_admin ? (
                              <span className="px-2 py-0.5 rounded bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-[10px]">Admin</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-400 text-[10px]">User</span>
                            )}
                          </td>
                          <td className="p-4 font-mono">{u.api_key_limit} keys</td>
                          <td className="p-4">
                            {u.deletion_requested_at ? (
                              <div className="flex flex-col">
                                <span className="text-slate-800 dark:text-white font-semibold">Pending Deactivate</span>
                                <span className="text-[9px] text-slate-500 font-mono">Req: {new Date(u.deletion_requested_at).toLocaleDateString()}</span>
                              </div>
                            ) : u.is_active ? (
                              <span className="text-emerald-500 font-semibold">Active</span>
                            ) : (
                              <span className="text-slate-400 font-semibold">Deactivated</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleToggleUserStatus(u.id)}
                                className="px-2.5 py-1.5 rounded-lg font-semibold text-[10px] border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                              >
                                {u.is_active ? "Block" : "Grant"}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="px-2.5 py-1.5 rounded-lg font-semibold text-[10px] border border-slate-200 dark:border-white/5 text-rose-600 hover:bg-rose-500/10 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── LIVE TELEMETRY TAB ── */}
          {activeTab === "telemetry" && (
            <div className="animate-fade-in space-y-6 max-w-6xl">
              <div>
                <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2 select-none">
                  <Zap size={20} className="text-slate-500" />
                  Live Telemetry Chat Monitoring
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 select-none">
                  Monitor active chat sessions and database queries in real-time.
                </p>
              </div>

              <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex gap-2 items-center text-xs text-slate-800 dark:text-white font-bold select-none">
                  <Zap size={14} className="text-slate-500 animate-pulse" />
                  <span>Showing 50 most recent active conversations across database sessions:</span>
                </div>

                <div className="space-y-2">
                  {recentChats.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500 select-none">No active conversation traffic recorded.</div>
                  ) : (
                    recentChats.map((c) => (
                      <div
                        key={c.id}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl bg-slate-50 dark:bg-white/[0.01] border border-slate-150 dark:border-white/5 text-xs hover:border-slate-300 dark:hover:border-white/10 transition-all"
                      >
                        <div className="space-y-1">
                          <span className="font-bold text-slate-800 dark:text-white">{c.title}</span>
                          <div className="flex gap-3 text-[10px] text-slate-500">
                            <span>User ID: {c.user_id}</span>
                            <span>•</span>
                            <span className="font-mono">{c.user_email}</span>
                            <span>•</span>
                            <span>Updated: {new Date(c.updated_at).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <div className="mt-2 sm:mt-0 px-2.5 py-1 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-mono text-[10px] text-slate-700 dark:text-white shrink-0">
                          {c.message_count} Messages
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── PRICING CONFIG TAB ── */}
          {activeTab === "pricing" && (
            <div className="animate-fade-in space-y-6 max-w-4xl">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2 select-none">
                    <DollarSign size={20} className="text-slate-500" />
                    Pricing Config
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 select-none">
                    Configure base prices, display names, GST &amp; tax rates for each plan tier.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePricingReset}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all"
                  >
                    <RotateCcw size={13} /> Reset
                  </button>
                  <button
                    onClick={handlePricingSave}
                    disabled={pricingSaving}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {pricingSaving ? "Saving..." : pricingSaved ? <><CheckCircle size={13} /> Saved!</> : <><Save size={13} /> Save</>}
                  </button>
                </div>
              </div>

              {pricingError && (
                <div className="mb-4 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2 font-semibold">
                  <AlertTriangle size={14} /> {pricingError}
                </div>
              )}
              {pricingSaved && (
                <div className="mb-4 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-xs flex items-center gap-2 font-semibold">
                  <CheckCircle size={14} /> Pricing configuration saved successfully!
                </div>
              )}

              <div className="space-y-6">
                {pricingDraft.map((plan, idx) => {
                  const subtotal = parseFloat(plan.base_price_usd) || 0;
                  const gstRate = parseFloat(plan.gst_rate) || 0;
                  const taxAmt = +(subtotal * gstRate / 100).toFixed(2);
                  const totalUSD = +(subtotal + taxAmt).toFixed(2);
                  const tierMeta = {
                    free:       { dot: "bg-slate-400",  badge: "bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-white border border-slate-200 dark:border-white/5" },
                    premium:    { dot: "bg-slate-800 dark:bg-white",     badge: "bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-white border border-slate-200 dark:border-white/5" },
                    enterprise: { dot: "bg-slate-800 dark:bg-white",     badge: "bg-slate-900 text-white dark:bg-white dark:text-black border border-slate-950 dark:border-white" },
                  };
                  const meta = tierMeta[plan.tier] || tierMeta.free;

                  return (
                    <div key={plan.tier} className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#121212] overflow-hidden shadow-sm">
                      {/* Plan Header */}
                      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-white/5">
                        <div className={`w-2 h-2 rounded-full ${meta.dot}`} />
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${meta.badge}`}>
                          {plan.tier}
                        </span>
                        <span className="text-[11px] text-slate-450 dark:text-slate-500 font-mono ml-auto">
                          Last updated: {plan.updated_at ? new Date(plan.updated_at).toLocaleString() : "Never"}
                        </span>
                      </div>

                      {/* Inputs */}
                      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Display Name */}
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Display Name</label>
                          <input
                            type="text"
                            value={plan.display_name}
                            onChange={e => handlePricingChange(plan.tier, "display_name", e.target.value)}
                            className="w-full bg-white dark:bg-[#1a1a1a] border border-slate-250 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:border-slate-350 dark:focus:border-white/20 transition-all"
                            placeholder="Plan display name"
                          />
                        </div>

                        {/* Base Price */}
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Base Price (USD/month)</label>
                          <div className="relative flex items-center bg-white dark:bg-[#1a1a1a] border border-slate-250 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-850 dark:text-white focus-within:border-slate-350 dark:focus-within:border-white/20 transition-all">
                            <span className="text-slate-400 mr-1.5">$</span>
                            <input
                              type="number" min="0" step="0.01"
                              value={plan.base_price_usd}
                              onChange={e => handlePricingChange(plan.tier, "base_price_usd", e.target.value)}
                              className="w-full bg-transparent outline-none text-slate-800 dark:text-white"
                            />
                          </div>
                        </div>

                        {/* GST Rate */}
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">GST / Tax Rate (%)</label>
                          <div className="relative flex items-center bg-white dark:bg-[#1a1a1a] border border-slate-250 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-850 dark:text-white focus-within:border-slate-350 dark:focus-within:border-white/20 transition-all">
                            <input
                              type="number" min="0" max="100" step="0.1"
                              value={plan.gst_rate}
                              onChange={e => handlePricingChange(plan.tier, "gst_rate", e.target.value)}
                              className="w-full bg-transparent outline-none text-slate-800 dark:text-white"
                            />
                            <span className="text-slate-400 ml-1.5">%</span>
                          </div>
                        </div>
                      </div>

                      {/* Live Price Breakdown */}
                      <div className="mx-6 mb-6 rounded-xl bg-white dark:bg-[#1a1a1a] border border-slate-250 dark:border-white/5 p-5 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Live Price Breakdown Preview</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: "Base Price",         val: `$${subtotal.toFixed(2)}` },
                            { label: `GST (${gstRate}%)`,  val: `+$${taxAmt.toFixed(2)}` },
                            { label: "Total/month (USD)",  val: `$${totalUSD.toFixed(2)}` },
                            { label: "Est. INR Total",     val: `₹${Math.round(totalUSD * 83.5)}` },
                          ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center gap-1 py-1">
                              <span className="text-[10px] text-slate-400 font-medium">{item.label}</span>
                              <span className="text-lg font-bold text-slate-800 dark:text-white">{item.val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── PAYMENT SETTINGS TAB ── */}
          {activeTab === "payment" && (
            <div className="animate-fade-in space-y-6 max-w-xl mx-auto">
              <div>
                <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2 select-none">
                  <CreditCard size={20} className="text-slate-500" />
                  Payment Gateway Settings
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 select-none">
                  Manage active key identifiers for payment processors and billing.
                </p>
              </div>

              <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 select-none">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center font-bold text-[10px] uppercase text-slate-600 dark:text-slate-300">
                      RP
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 dark:text-white">Razorpay Key ID</span>
                      <span className="text-[10px] text-slate-400">Used for client checkout initialization</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <input
                      type="text"
                      disabled
                      value="rzp_test_G08k3HjK9Olw3D"
                      className="w-full bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-500 outline-none"
                    />
                    <div className="text-[10px] text-slate-400 font-semibold mt-1">
                      * This key is synced with the backend deployment environment credentials.
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-white/5 my-4"></div>

                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
                  <h3 className="font-bold text-slate-700 dark:text-slate-300">How payment gateway config works:</h3>
                  <ol className="list-decimal pl-4 space-y-1 leading-relaxed">
                    <li>User initiates a subscription upgrade checkout session in the pricing view.</li>
                    <li>Frontend invokes backend payment server endpoints utilizing configured keys.</li>
                    <li>Razorpay checkout widget initializes client-side payment captures securely.</li>
                    <li>Successful payments automatically sync client state updates.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* ── GENERAL SETTINGS TAB ── */}
          {activeTab === "general" && (
            <div className="animate-fade-in space-y-6 max-w-xl mx-auto">
              <div>
                <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2 select-none">
                  <Settings size={20} className="text-slate-500" />
                  General Settings
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 select-none">
                  Customize general site localization, currency displays, and metadata.
                </p>
              </div>

              <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Currency Localizer</label>
                  <select
                    value={selectedCurrencyCode || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        localStorage.setItem('astra_currency', val);
                        setSelectedCurrencyCode(val);
                      } else {
                        localStorage.removeItem('astra_currency');
                        setSelectedCurrencyCode(null);
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white outline-none"
                  >
                    <option value="">Auto-Detect Currency ({autoCurrencyInfo.code})</option>
                    {ALL_CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.label} ({c.code} - {c.symbol})</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-450 dark:text-slate-500">
                    Determines local pricing formatting rules used across the dashboard widgets.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── DEVELOPER KEYS TAB ── */}
          {activeTab === "developer" && (
            <div className="animate-fade-in space-y-6 max-w-xl mx-auto">
              <div>
                <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2 select-none">
                  <Key size={20} className="text-slate-500" />
                  Developer Keys
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 select-none">
                  Provision third-party model inference provider credential configurations.
                </p>
              </div>

              <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-4">
                {settingsKeysLoading ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading active keys...</div>
                ) : llmApiKey ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 text-xs">
                      <div className="flex items-center gap-2.5">
                        <Key size={14} className="text-emerald-500" />
                        <span className="font-semibold text-slate-800 dark:text-white">Active Groq Client Key</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold text-[9px] uppercase tracking-wider">Active</span>
                    </div>
                    <div className="text-[10px] text-slate-550 dark:text-slate-400 leading-relaxed font-mono bg-slate-50 dark:bg-[#1a1a1a] p-3 rounded-lg border border-slate-200 dark:border-white/10 break-all select-all">
                      {llmApiKey.substring(0, 8)}************************************{llmApiKey.substring(llmApiKey.length - 4)}
                    </div>
                    <button
                      onClick={handleRemoveLlmKey}
                      className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl text-xs font-bold transition-all"
                    >
                      Delete API Key
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSaveLlmKey} className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connect Groq Inference API Key</label>
                      <input
                        type="password"
                        required
                        value={llmApiKeyInput}
                        onChange={(e) => setLlmApiKeyInput(e.target.value)}
                        placeholder="gsk_************************************************"
                        className="w-full bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
                    >
                      Save Configuration
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* ── ACCOUNT PROFILE TAB ── */}
          {activeTab === "account" && (
            <div className="animate-fade-in space-y-6 max-w-xl mx-auto">
              <div>
                <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2 select-none">
                  <User size={20} className="text-slate-500" />
                  Account Profile
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 select-none">
                  Manage personal profiles, owner permissions, and metadata.
                </p>
              </div>

              <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between py-3 border-b border-slate-100 dark:border-white/5 gap-2">
                    <span className="text-[14px] text-slate-800 dark:text-white font-medium">Administrator Name</span>
                    <span className="text-[14px] text-slate-700 dark:text-slate-300 font-semibold">{profileName || "System Owner"}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between py-3 border-b border-slate-100 dark:border-white/5 gap-2">
                    <span className="text-[14px] text-slate-800 dark:text-white font-medium">Account Username</span>
                    <span className="text-[14px] text-slate-700 dark:text-slate-300 font-semibold">@{profileUsername || "owner"}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between py-3 border-b border-slate-100 dark:border-white/5 gap-2">
                    <span className="text-[14px] text-slate-800 dark:text-white font-medium">Login Email Address</span>
                    <span className="text-[14px] text-slate-700 dark:text-slate-300 font-semibold font-mono">{user?.email}</span>
                  </div>

                  {user?.created_at && (
                    <div className="flex flex-col sm:flex-row justify-between py-4 border-b border-slate-100 dark:border-white/5 gap-2">
                      <span className="text-[14px] text-slate-800 dark:text-white font-medium">Owner Since</span>
                      <span className="text-[14px] text-slate-700 dark:text-slate-300 font-semibold">
                        {(() => {
                          const d = new Date(user.created_at);
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const year = d.getFullYear();
                          return `${day}/${month}/${year}`;
                        })()}
                      </span>
                    </div>
                  )}

                  <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-slate-200 dark:border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Root Owner System Metadata</span>
                      <span className="px-2 py-0.5 rounded bg-white/10 text-slate-305 font-medium text-[9px] uppercase tracking-wider font-mono">Super Admin Access</span>
                    </div>
                    <div className="space-y-1.5 text-[11px] text-slate-400 leading-relaxed font-mono">
                      <div>• Node Authority: Full read, write, update, and database access</div>
                      <div>• Telemetry Database: Local SQLite (astra_ai_local.db)</div>
                      <div>• Platform Status: Unrestricted VIP Enterprise Access Active</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── HELP CENTER TAB ── */}
          {activeTab === "help" && (
            <div className="animate-fade-in max-w-xl mx-auto">
              <div className="mb-6">
                <div className="flex items-center gap-2.5 mb-1">
                  <HelpCircle size={18} className="text-slate-700 dark:text-slate-350" />
                  <h2 className="text-base font-bold text-slate-800 dark:text-white">Help Center</h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Find guidance on managing the Astra AI platform administration console.</p>
              </div>

              <div className="space-y-4">
                <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Frequently Asked Questions</h3>
                  <div className="space-y-4 divide-y divide-slate-100 dark:divide-white/5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="pt-3 first:pt-0">
                      <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">How do I change a user's subscription tier?</h4>
                      <p>Go to the <strong>Overview</strong> tab, find the user, click on the Tier dropdown next to their info, and select the new tier.</p>
                    </div>
                    <div className="pt-3">
                      <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">How can I block or de-activate a user?</h4>
                      <p>In the <strong>Overview</strong> list, click the lock/shield button next to the user. Blocking a user immediately revokes their API access.</p>
                    </div>
                    <div className="pt-3">
                      <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Where is the database stored?</h4>
                      <p>The system uses a local SQLite database named <code>astra_ai_local.db</code> located in the root backend directory.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-55 dark:bg-[#121212] border border-slate-200 dark:border-white/5 rounded-2xl p-6 text-xs text-slate-550 dark:text-slate-400">
                  <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Need Direct Technical Support?</h3>
                  <p className="leading-relaxed">
                    For platform modifications, codebase bugs, or infrastructure assistance, please contact the developer team or raise a ticket in the repository.
                  </p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
export default AdminPanelPage;
