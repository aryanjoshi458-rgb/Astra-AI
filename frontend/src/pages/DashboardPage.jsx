import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";
import AstraLogo from "../components/AstraLogo";
import { useChat } from "../context/ChatContext";
import { useTheme } from "../context/ThemeContext";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import {
  MessageSquare, Plus, Trash2, Pin, Download, Send, ArrowUp, SendHorizontal, Navigation, AudioLines, Paperclip, Mic, MicOff,
  Volume2, VolumeX, LogOut, Settings, Shield, User, FileText, Camera, Check, Palette,
  Search, Edit3, X, HelpCircle, Terminal, RefreshCw, Sparkles, BookOpen, PanelLeft, PanelLeftClose, ChevronDown, Zap,
  Folder, FolderPlus, MoreHorizontal, ChevronRight, Copy, ThumbsUp, ThumbsDown, Key, AlertTriangle, MessageSquareDashed, Image, Globe, Upload, Code
} from "lucide-react";
import ApiClient from "../services/api";

const VoiceWaveIcon = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2.25 8v8" />
    <path d="M8.75 2v20" />
    <path d="M15.25 4v16" />
    <path d="M21.75 7v10" />
  </svg>
);

const GREETINGS = [
  "How can I help you today?",
  "Ready when you are.",
  "What's on your mind?",
  "How can I assist you today?",
  "Let's create something new."
];

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
  { code: 'HKD', symbol: 'HK$', label: 'Hong Kong Dollar', flag: '🇭🇰', rate: 7.81 },
  { code: 'NZD', symbol: 'NZ$', label: 'New Zealand Dollar', flag: '🇳🇿', rate: 1.63 },
  { code: 'SEK', symbol: 'kr', label: 'Swedish Krona', flag: '🇸🇪', rate: 10.5 },
  { code: 'KRW', symbol: '₩', label: 'South Korean Won', flag: '🇰🇷', rate: 1390 },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar', flag: '🇸🇬', rate: 1.35 },
  { code: 'NOK', symbol: 'kr', label: 'Norwegian Krone', flag: '🇳🇴', rate: 10.6 },
  { code: 'MXN', symbol: '$', label: 'Mexican Peso', flag: '🇲🇽', rate: 18.1 },
  { code: 'RUB', symbol: '₽', label: 'Russian Ruble', flag: '🇷🇺', rate: 88.0 },
  { code: 'ZAR', symbol: 'R', label: 'South African Rand', flag: '🇿🇦', rate: 18.0 },
  { code: 'TRY', symbol: '₺', label: 'Turkish Lira', flag: '🇹🇷', rate: 32.8 },
  { code: 'BRL', symbol: 'R$', label: 'Brazilian Real', flag: '🇧🇷', rate: 5.42 },
  { code: 'TWD', symbol: 'NT$', label: 'Taiwan New Dollar', flag: '🇹🇼', rate: 32.4 },
  { code: 'DKK', symbol: 'kr', label: 'Danish Krone', flag: '🇩🇰', rate: 6.95 },
  { code: 'PLN', symbol: 'zł', label: 'Polish Zloty', flag: '🇵🇱', rate: 3.97 },
  { code: 'ILS', symbol: '₪', label: 'Israeli Shekel', flag: '🇮🇱', rate: 3.72 },
  { code: 'EGP', symbol: '£', label: 'Egyptian Pound', flag: '🇪🇬', rate: 30.9 },
  { code: 'KES', symbol: 'KSh', label: 'Kenyan Shilling', flag: '🇰🇪', rate: 133 },
  { code: 'VND', symbol: '₫', label: 'Vietnamese Dong', flag: '🇻🇳', rate: 25400 },
];

const PLAN_FEATURES = {
  free: {
    desc: "Perfect for exploring the core AI chat controls.",
    features: [
      "5 standard chats per day",
      "Standard text models",
      "API key creations (max 5 keys)",
      "Community support"
    ]
  },
  premium: {
    desc: "Empower your daily workflow with document processing.",
    features: [
      "Unlimited chat sessions",
      "Priority access to GPT-4o & Claude 3.5",
      "PDF analyzer (file uploads)",
      "Image OCR & description",
      "Voice Input & Output commands",
      "API key creations (max 20 keys)"
    ],
    popular: true
  },
  enterprise: {
    desc: "For high-performance engineering & analytics.",
    features: [
      "Everything in Premium",
      "Unlimited PDF & image context",
      "Custom system prompt personalization",
      "Dedicated analytics dashboard",
      "API key creations (max 100 keys)",
      "24/7 dedicated support team"
    ]
  }
};

export const DashboardPage = ({ onNavigate, initialOpenSettings = false }) => {
  const { user, logout, refreshProfile, updateProfile, requestOTP, verifyOTP, googleLogin } = useAuth();
  const { theme, setTheme } = useTheme();

  // Currency state
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState(
    () => localStorage.getItem('astra_currency') || null
  );
  const [autoCurrencyInfo, setAutoCurrencyInfo] = useState({ symbol: '$', code: 'USD', rate: 1 });
  const currencyInfo = selectedCurrencyCode
    ? ALL_CURRENCIES.find(c => c.code === selectedCurrencyCode) || autoCurrencyInfo
    : autoCurrencyInfo;

  const [pricingPlans, setPricingPlans] = useState([]);
  const [paymentConfirmPlan, setPaymentConfirmPlan] = useState(null); // { tier, name, priceUSD, gstRate }
  const {
    sessions, projects, currentSession, activeSessionId, isStreaming, sessionsLoading,
    messagesLoading, loadSessionDetail, createSession, renameSession, pinSession,
    deleteSession, createProject, deleteProject, assignSessionToProject, sendMessageStream, exportChatPDF, setActiveSessionId,
    clearAllSessions
  } = useChat();

  // Settings Modal States
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState("general");
  const [settingsApiKeys, setSettingsApiKeys] = useState([]);
  const [settingsNewKeyName, setSettingsNewKeyName] = useState("");
  const [settingsCustomKeyValue, setSettingsCustomKeyValue] = useState("");
  const [settingsGeneratedKey, setSettingsGeneratedKey] = useState(null);
  const [settingsCopiedKey, setSettingsCopiedKey] = useState(false);
  const [settingsKeysLoading, setSettingsKeysLoading] = useState(false);
  const [settingsKeyError, setSettingsKeyError] = useState("");

  // Local Chat UI states
  const [isPreviewLightboxOpen, setIsPreviewLightboxOpen] = useState(false);
  const [isTemporaryChat, setIsTemporaryChat] = useState(() => localStorage.getItem('astra_temp_chat') === 'true');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAppearanceModalOpen, setIsAppearanceModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isHelpSubmenuOpen, setIsHelpSubmenuOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");


  // Custom Dialog Modal State
  const [dialogConfig, setDialogConfig] = useState(null);

  const showDialog = (config) => {
    setDialogConfig(config);
  };
  const closeDialog = () => setDialogConfig(null);

  useEffect(() => {
    if (initialOpenSettings) {
      setIsSettingsModalOpen(true);
    }
  }, [initialOpenSettings]);

  useEffect(() => {
    if (isSettingsModalOpen && settingsActiveTab === "developer") {
      fetchSettingsApiKeys();
    }
  }, [isSettingsModalOpen, settingsActiveTab]);

  useEffect(() => {
    if (isPlanModalOpen) {
      ApiClient.get("/api/admin/pricing")
        .then(plans => setPricingPlans(plans))
        .catch(() => { /* fallback */ });
    }
  }, [isPlanModalOpen]);

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
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        const country = data.country_code;
        if (country && CURRENCY_MAP[country]) {
          setAutoCurrencyInfo(CURRENCY_MAP[country]);
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar_url]);

  // Telemetry Heartbeat Effect
  useEffect(() => {
    if (!user) return;

    const sendPing = async () => {
      try {
        await ApiClient.post("/api/user/heartbeat", {});
      } catch (err) {
        console.error("Telemetry ping failed:", err);
      }
    };

    sendPing();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        sendPing();
      }
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendPing();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

  const fetchSettingsApiKeys = async () => {
    try {
      setSettingsKeysLoading(true);
      const keys = await ApiClient.get("/api/user/keys");
      setSettingsApiKeys(keys);
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsKeysLoading(false);
    }
  };

  const handleCreateSettingsKey = async (e) => {
    e.preventDefault();
    if (!settingsNewKeyName.trim()) return;
    setSettingsKeyError("");
    setSettingsGeneratedKey(null);

    try {
      const payload = {
        name: settingsNewKeyName,
        custom_key: settingsCustomKeyValue.trim() || undefined
      };
      const result = await ApiClient.post("/api/user/keys", payload);
      setSettingsGeneratedKey(result.raw_key);
      setSettingsNewKeyName("");
      setSettingsCustomKeyValue("");
      fetchSettingsApiKeys();
    } catch (err) {
      setSettingsKeyError(err.message || "Failed to create API key.");
    }
  };

  const handleRevokeSettingsKey = async (keyId) => {
    if (!confirm("Are you sure you want to revoke this API key? Applications using it will lose access immediately.")) {
      return;
    }
    try {
      await ApiClient.delete(`/api/user/keys/${keyId}`);
      fetchSettingsApiKeys();
    } catch (err) {
      alert("Failed to revoke API key.");
    }
  };

  const handleCopySettingsKey = () => {
    if (settingsGeneratedKey) {
      navigator.clipboard.writeText(settingsGeneratedKey);
      setSettingsCopiedKey(true);
      setTimeout(() => setSettingsCopiedKey(false), 2000);
    }
  };

  const handleDeleteSettingsHistory = async () => {
    showDialog({
      type: "confirm",
      title: "Clear Chat History",
      message: "WARNING: This will permanently delete ALL your chat history. This action cannot be undone. Do you want to proceed?",
      danger: true,
      confirmText: "Clear History",
      onConfirm: async () => {
        closeDialog();
        try {
          await clearAllSessions();
          showDialog({ type: "alert", title: "Success", message: "All chat history has been cleared.", onConfirm: closeDialog });
        } catch (err) {
          showDialog({ type: "alert", title: "Error", danger: true, message: "Failed to delete chat history.", onConfirm: closeDialog });
        }
      }
    });
  };

  const handleDeleteAccount = async () => {
    showDialog({
      type: "prompt",
      title: "Delete Account",
      message: "WARNING: This will permanently delete your account, projects, keys, and chat history. This action cannot be undone.",
      danger: true,
      promptExpected: "DELETE",
      confirmText: "Delete Forever",
      onConfirm: async () => {
        closeDialog();
        try {
          await ApiClient.delete("/api/user/account");
          showDialog({
            type: "alert",
            title: "Account Deleted",
            message: "Your account has been deleted successfully.",
            onConfirm: () => { closeDialog(); logout(); }
          });
        } catch (err) {
          showDialog({ type: "alert", title: "Error", danger: true, message: "Failed to delete account. Please try again.", onConfirm: closeDialog });
        }
      }
    });
  };

  const handleClearProfileData = async () => {
    showDialog({
      type: "confirm",
      title: "Clear Profile Details",
      message: "Are you sure you want to clear your profile details? This will reset your name, username, and avatar back to default.",
      danger: true,
      confirmText: "Clear Profile",
      onConfirm: async () => {
        closeDialog();
        try {
          const defaultName = user?.email ? user.email.split("@")[0].charAt(0).toUpperCase() + user.email.split("@")[0].slice(1) : "Astra User";
          await updateProfile(defaultName, "", "");
          setProfileName(defaultName);
          setProfileAvatar("");
          setProfileUsername("");
          showDialog({ type: "alert", title: "Success", message: "Profile details cleared successfully.", onConfirm: closeDialog });
        } catch (err) {
          showDialog({ type: "alert", title: "Error", danger: true, message: "Failed to clear profile details.", onConfirm: closeDialog });
        }
      }
    });
  };

  const handleExecuteUpgrade = async (tier) => {
    try {
      setIsUpgrading(true);

      const plan = paymentConfirmPlan;

      // Step 1: Get public Razorpay Key ID from backend
      const payConfig = await ApiClient.get("/api/payment/config");
      if (!payConfig.configured || !payConfig.key_id) {
        showDialog({ type: "alert", title: "Payment Not Configured", danger: true, message: "Payment gateway is not set up yet. Please contact admin.", onConfirm: closeDialog });
        return;
      }

      // Step 2: Load Razorpay SDK if not loaded
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      // Amount calculation (INR, in paise for Razorpay)
      const amountINR = Math.round(plan.base_price_usd * (1 + plan.gst_rate / 100) * 83.5);
      const amountPaise = amountINR * 100;

      // Step 3: Open Razorpay checkout (client-side only, no server order needed)
      await new Promise((resolve, reject) => {
        const options = {
          key: payConfig.key_id,
          amount: amountPaise,
          currency: "INR",
          name: "Astra AI",
          description: `${plan.display_name || tier} Plan Subscription`,
          handler: async (response) => {
            try {
              // Step 4: Tell backend to upgrade subscription
              await ApiClient.post("/api/payment/upgrade", {
                tier,
                payment_id: response.razorpay_payment_id,
              });
              await refreshProfile();
              setPaymentConfirmPlan(null);
              setIsPlanModalOpen(false);
              showDialog({ type: "alert", title: "Payment Successful! 🎉", message: `Your subscription has been upgraded to ${tier.toUpperCase()}!`, onConfirm: closeDialog });
              resolve();
            } catch (upgradeErr) {
              showDialog({ type: "alert", title: "Upgrade Failed", danger: true, message: "Payment received but upgrade failed. Please contact support.", onConfirm: closeDialog });
              reject(upgradeErr);
            }
          },
          prefill: {
            email: user?.email || "",
            name: user?.full_name || "",
          },
          theme: { color: "#6366f1" },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled")),
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      });
    } catch (err) {
      if (err?.message !== "Payment cancelled") {
        showDialog({ type: "alert", title: "Error", danger: true, message: err?.message || "Payment failed. Please try again.", onConfirm: closeDialog });
      }
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccessMsg("");
    setProfileErrorMsg("");
    setIsSavingProfile(true);
    try {
      await updateProfile(profileName, profileAvatar, profileUsername);
      setProfileSuccessMsg("Profile updated successfully.");
      setTimeout(() => {
        setIsProfileModalOpen(false);
        setProfileSuccessMsg("");
      }, 1500);
    } catch (err) {
      setProfileErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileAvatar(reader.result);
        setAvatarError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Local Chat UI states
  const [greeting] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("astra_sidebar_open");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("astra_sidebar_open", JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);


  useEffect(() => {
    if (user) {
      setProfileName(user.full_name || "");
      setProfileAvatar(user.avatar_url || "");
      setProfileUsername(user.username || (user.email ? user.email.split("@")[0] : ""));
      setAvatarError(false);
    }
  }, [user, isProfileModalOpen]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPersona, setSelectedPersona] = useState("general"); // general, coding, writer, translator, search
  const [selectedModel, setSelectedModel] = useState("astra-gpt-4"); // astra-gpt-4, astra-code-llama, gemma-7b, mixtral-8x7b

  // File Upload states
  const [uploadedFiles, setUploadedFiles] = useState([]); // Array of { name, url, type, text, previewUrl }
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null); // Used for active lightbox preview url
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [libraryActiveTab, setLibraryActiveTab] = useState("images");
  const [isPinnedHoverOpen, setIsPinnedHoverOpen] = useState(false);
  const [isProjectsHoverOpen, setIsProjectsHoverOpen] = useState(false);

  // Add Account / Submenu States
  const [isAccountsSubmenuOpen, setIsAccountsSubmenuOpen] = useState(false);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [addAccountMode, setAddAccountMode] = useState("email"); // email, otp
  const [addAccountEmail, setAddAccountEmail] = useState("");
  const [addAccountOtp, setAddAccountOtp] = useState("");
  const [addAccountLoading, setAddAccountLoading] = useState(false);
  const [addAccountError, setAddAccountError] = useState("");

  const handleAddAccountSubmit = async (e) => {
    e.preventDefault();
    setAddAccountLoading(true);
    setAddAccountError("");
    try {
      // Try login first
      await requestOTP(addAccountEmail, "login");
      setAddAccountMode("otp");
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes("not found")) {
        try {
          // Fallback to register
          await requestOTP(addAccountEmail, "register");
          setAddAccountMode("otp");
        } catch (regErr) {
          setAddAccountError(regErr.message || "Failed to request verification code.");
        }
      } else {
        setAddAccountError(err.message || "Failed to request verification code.");
      }
    } finally {
      setAddAccountLoading(false);
    }
  };

  const handleAddAccountVerifySubmit = async (e) => {
    e.preventDefault();
    setAddAccountLoading(true);
    setAddAccountError("");
    try {
      await verifyOTP(addAccountEmail, addAccountOtp);
      setIsAddAccountModalOpen(false);
      window.location.reload();
    } catch (err) {
      setAddAccountError(err.message || "Invalid verification code.");
    } finally {
      setAddAccountLoading(false);
    }
  };

  const handleAddAccountGoogleSignIn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setAddAccountLoading(true);
      setAddAccountError("");
      try {
        await googleLogin(tokenResponse.access_token);
        setIsAddAccountModalOpen(false);
        window.location.reload();
      } catch (err) {
        setAddAccountError(err.message || "Google authentication failed.");
      } finally {
        setAddAccountLoading(false);
      }
    },
    onError: () => {
      setAddAccountError("Google Sign-In failed.");
    }
  });

  // Helper to scan messages and collect generated/uploaded images and files for Library Modal
  const getLibraryItems = () => {
    const images = [];
    const files = [];

    sessions.forEach(session => {
      if (session.messages && Array.isArray(session.messages)) {
        session.messages.forEach(msg => {
          // 1. Scan content for markdown images (like pollinations images)
          if (msg.content) {
            const imgRegex = /!\[.*?\]\((.*?)\)/g;
            let match;
            while ((match = imgRegex.exec(msg.content)) !== null) {
              const urlStr = match[1];
              images.push({
                url: urlStr,
                name: urlStr.split('/').pop().split('?')[0] || "Generated Photo",
                sessionTitle: session.title,
                sessionId: session.id,
                date: msg.created_at || new Date().toISOString()
              });
            }
          }

          // 2. Scan file attachment attributes from message context
          if (msg.file_url) {
            const fileItem = {
              url: msg.file_url,
              name: msg.content || "Attached File",
              type: msg.file_type || "unknown",
              sessionTitle: session.title,
              sessionId: session.id,
              date: msg.created_at || new Date().toISOString()
            };
            if (fileItem.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/i.test(fileItem.url)) {
              images.push(fileItem);
            } else {
              files.push(fileItem);
            }
          }
        });
      }
    });

    return { images, files };
  };

  // Voice States
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
  const [isVoiceOutputActive, setIsVoiceOutputActive] = useState(false);

  // UI state
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editTitleInput, setEditTitleInput] = useState("");

  // LLM API Key state
  const [llmApiKeyInput, setLlmApiKeyInput] = useState("");
  const [llmApiKey, setLlmApiKey] = useState(() => localStorage.getItem("llm_api_key") || "");

  const handleSaveLlmKey = (e) => {
    e.preventDefault();
    if (llmApiKeyInput.trim()) {
      localStorage.setItem("llm_api_key", llmApiKeyInput.trim());
      setLlmApiKey(llmApiKeyInput.trim());
      setLlmApiKeyInput("");
    }
  };

  const handleRemoveLlmKey = () => {
    showDialog({
      type: "confirm",
      title: "Remove API Key",
      message: "Are you sure you want to remove your active Groq API Key? You will not be able to chat until you add a new one.",
      danger: true,
      confirmText: "Remove Key",
      onConfirm: () => {
        localStorage.removeItem("llm_api_key");
        setLlmApiKey("");
        closeDialog();
      }
    });
  };
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const modelDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const sessionContextMenuRef = useRef(null);
  const textareaRef = useRef(null);

  // Slash Commands Overlay States
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const [activePromptMode, setActivePromptMode] = useState(null);

  const SLASH_COMMANDS = [
    {
      command: "/image",
      label: "Generate AI Image",
      description: "Create visual art using Pollinations.ai",
      icon: <Camera size={16} className="text-pink-500" />,
      placeholder: "/image "
    },
    {
      command: "/code",
      label: "Write & Debug Code",
      description: "Ask coding questions or write scripts",
      icon: <Terminal size={16} className="text-emerald-500" />,
      placeholder: "/code "
    },
    {
      command: "/summarize",
      label: "Summarize Text",
      description: "Create brief summaries of long texts",
      icon: <FileText size={16} className="text-blue-500" />,
      placeholder: "/summarize "
    },
    {
      command: "/search",
      label: "Web Search",
      description: "Search the web for real-time information",
      icon: <Search size={16} className="text-amber-500" />,
      placeholder: "/search "
    }
  ];

  const filteredSlashCommands = SLASH_COMMANDS.filter(cmd =>
    cmd.command.toLowerCase().startsWith(chatInput.toLowerCase())
  );

  const handleInputChange = (e) => {
    const val = e.target.value;
    setChatInput(val);

    if (val.startsWith("/") && !val.includes(" ")) {
      const matches = SLASH_COMMANDS.filter(cmd =>
        cmd.command.toLowerCase().startsWith(val.toLowerCase())
      );
      if (matches.length > 0) {
        setShowSlashMenu(true);
        setSlashSelectedIndex(0);
      } else {
        setShowSlashMenu(false);
      }
    } else {
      setShowSlashMenu(false);
    }
  };

  const handleSelectSlashCommand = (cmd) => {
    setChatInput(cmd.placeholder);
    setShowSlashMenu(false);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  // Projects / Folders states
  const [expandedProjects, setExpandedProjects] = useState([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isAttachmentDropdownOpen, setIsAttachmentDropdownOpen] = useState(false);
  const attachmentDropdownRef = useRef(null);
  const [activeSessionContextMenu, setActiveSessionContextMenu] = useState(null);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  // Top right chat header menu
  const [isChatHeaderMenuOpen, setIsChatHeaderMenuOpen] = useState(false);
  const [isMoveToProjectHovered, setIsMoveToProjectHovered] = useState(false);
  const chatHeaderMenuRef = useRef(null);

  // Message Interaction states
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [likedMessageIds, setLikedMessageIds] = useState(new Set());

  const handleCopy = (id, content) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleLike = (id) => {
    setLikedMessageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setIsModelDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (sessionContextMenuRef.current && !sessionContextMenuRef.current.contains(event.target)) {
        setActiveSessionContextMenu(null);
      }
      if (chatHeaderMenuRef.current && !chatHeaderMenuRef.current.contains(event.target)) {
        setIsChatHeaderMenuOpen(false);
      }
      if (attachmentDropdownRef.current && !attachmentDropdownRef.current.contains(event.target)) {
        setIsAttachmentDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Auto Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages, isStreaming]);

  // Voice input mock recorder
  const triggerVoiceInput = () => {
    if (isVoiceInputActive) {
      setIsVoiceInputActive(false);
      return;
    }

    setIsVoiceInputActive(true);
    // Simulate speech-to-text feedback
    setTimeout(() => {
      setChatInput("Summarize my active subscription key stats");
      setIsVoiceInputActive(false);
    }, 2000);
  };

  // Text-To-Speech execution
  const speakText = (text) => {
    if (!isVoiceOutputActive) return;

    // Clean markdown characters before speaking
    const cleanedText = text.replace(/[#*\`>_\-]/g, "");

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop active speaking
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Trigger speak when a new message completes streaming
  useEffect(() => {
    if (isVoiceOutputActive && currentSession?.messages?.length > 0 && !isStreaming) {
      const lastMsg = currentSession.messages[currentSession.messages.length - 1];
      if (lastMsg && lastMsg.sender === "assistant") {
        speakText(lastMsg.content);
      }
    }
  }, [isStreaming, isVoiceOutputActive]);

  // Handle PDF/Image upload ingestion
  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsFileUploading(true);
    setUploadError("");

    try {
      const processed = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          const previewUrl = URL.createObjectURL(file);

          if (file.name.endsWith(".pdf")) {
            // PDF analysis endpoint
            const data = await ApiClient.post("/api/ai/analyze-pdf", formData, true);
            return {
              name: file.name,
              url: previewUrl,
              type: "pdf",
              text: data.full_text,
              previewUrl
            };
          } else if (/\.(png|jpe?g|webp)$/i.test(file.name)) {
            // Image visual OCR
            formData.append("prompt", "Analyze the layout elements of this user interface");
            const data = await ApiClient.post("/api/ai/analyze-image", formData, true);
            return {
              name: file.name,
              url: previewUrl,
              type: "image",
              text: data.description,
              previewUrl
            };
          } else {
            throw new Error(`Unsupported format for ${file.name}. Please upload a PDF or an Image.`);
          }
        })
      );

      setUploadedFiles(prev => [...prev, ...processed]);
    } catch (err) {
      console.error(err);
      setUploadError(err.message || "File upload failed.");
    } finally {
      setIsFileUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index) => {
    setUploadedFiles(prev => {
      const updated = [...prev];
      try {
        URL.revokeObjectURL(updated[index].previewUrl);
      } catch (e) {
        console.error(e);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const clearAttachments = () => {
    uploadedFiles.forEach(file => {
      try {
        URL.revokeObjectURL(file.previewUrl);
      } catch (e) {
        console.error(e);
      }
    });
    setUploadedFiles([]);
  };

  // Submit Prompts
  const handleSendPrompt = async (e) => {
    e.preventDefault();
    if (isStreaming) return;
    if (!chatInput.trim() && uploadedFiles.length === 0) return;

    let promptText = chatInput;
    if (activePromptMode) {
      let prefix = "";
      if (activePromptMode === "image") prefix = "/image";
      else if (activePromptMode === "code") prefix = "/code";
      else if (activePromptMode === "search") prefix = "/search";

      if (prefix && !promptText.toLowerCase().trim().startsWith(prefix)) {
        promptText = `${prefix} ${promptText}`;
      }
      setActivePromptMode(null);
    }
    setChatInput("");
    setIsInputFocused(false);

    // Append context from uploads
    let contextPayload = null;
    let fileUrl = null;
    let fileType = null;
    if (uploadedFiles.length > 0) {
      contextPayload = uploadedFiles.map(f => `--- File Context: ${f.name} ---\n${f.text}`).join("\n\n");

      if (uploadedFiles.length === 1) {
        fileUrl = uploadedFiles[0].url;
        fileType = uploadedFiles[0].type;
      } else {
        fileUrl = JSON.stringify(uploadedFiles.map(f => f.url));
        fileType = JSON.stringify(uploadedFiles.map(f => f.type));
      }
      clearAttachments();
    }

    await sendMessageStream({
      content: promptText,
      fileUrl,
      fileType,
      fileTextContext: contextPayload,
      modelUsed: selectedModel,
      assistantType: selectedPersona
    });
  };

  // Rename Session controls
  const startEditingSession = (session) => {
    setEditingSessionId(session.id);
    setEditTitleInput(session.title);
  };

  const saveSessionName = async (sessionId) => {
    if (!editTitleInput.trim()) return;
    await renameSession(sessionId, editTitleInput);
    setEditingSessionId(null);
  };

  const toggleProject = (projectId) => {
    setExpandedProjects(prev =>
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    );
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    await createProject(newProjectName);
    setNewProjectName("");
    setIsProjectModalOpen(false);
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSession = (session) => {
    const isActive = activeSessionId === session.id;
    const isEditing = editingSessionId === session.id;

    return (
      <div
        key={session.id}
        onClick={() => !isEditing && loadSessionDetail(session.id)}
        className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all ${isActive
          ? "bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
          : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-white border border-transparent"
          }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <MessageSquare size={16} className={isActive ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-white/40"} />
          {isEditing ? (
            <input
              type="text"
              value={editTitleInput}
              onChange={(e) => setEditTitleInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveSessionName(session.id)}
              onBlur={() => saveSessionName(session.id)}
              className="bg-transparent border border-slate-200 dark:border-white/10 rounded px-1.5 py-0.5 text-sm outline-none text-slate-800 dark:text-slate-200 w-[80%]"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate pr-2">{session.title}</span>
          )}
        </div>

        {/* Quick controls on hover */}
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {session.is_pinned && (
            <Pin size={14} className="text-white shrink-0" onClick={(e) => { e.stopPropagation(); pinSession(session.id); }} />
          )}
          {!isEditing && (
            <>
              {!session.is_pinned && (
                <Pin size={14} className="hover:text-white text-white/70 shrink-0" onClick={(e) => { e.stopPropagation(); pinSession(session.id); }} />
              )}
              <Edit3 size={14} className="hover:text-white text-white/70 shrink-0" onClick={(e) => { e.stopPropagation(); startEditingSession(session); }} />

              <div className="relative">
                <Folder size={14} className="hover:text-white text-white/70 shrink-0" onClick={(e) => { e.stopPropagation(); setActiveSessionContextMenu(session.id); }} />
                {activeSessionContextMenu === session.id && (
                  <div ref={sessionContextMenuRef} className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl py-1 z-50">
                    <div className="px-3 py-1 text-[10px] font-medium text-slate-500 dark:text-white/50 uppercase tracking-wider">Move to Project</div>
                    <button onClick={(e) => { e.stopPropagation(); assignSessionToProject(session.id, null); setActiveSessionContextMenu(null); }} className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5">Unassign</button>
                    {projects.map(p => (
                      <button key={p.id} onClick={(e) => { e.stopPropagation(); assignSessionToProject(session.id, p.id); setActiveSessionContextMenu(null); }} className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 truncate">
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Trash2 size={14} className="hover:text-white text-white/70 shrink-0" onClick={(e) => { e.stopPropagation(); setSessionToDelete(session.id); }} />
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-theme text-theme-primary overflow-hidden font-sans">

      {/* 1. Left Sidebar Navigation */}
      <aside className={`shrink-0 border-r border-slate-200 dark:border-white/5 bg-white dark:bg-[#000000] flex flex-col justify-between h-full z-20 transition-all duration-300 ease-in-out ${isSidebarOpen ? "w-[260px]" : "w-[60px]"}`}>
        <div className={`flex flex-col flex-1 w-full ${isSidebarOpen ? "overflow-hidden" : "overflow-visible"}`}>

          {/* Sidebar Brand Header */}
          <div className={`pt-3 pb-1 flex items-center ${isSidebarOpen ? "justify-between px-4" : "justify-center px-0 w-full"}`}>
            {isSidebarOpen ? (
              <>
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate("landing")}>
                  <AstraLogo size={28} className="text-slate-900 dark:text-white" />
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0"
                  title="Close sidebar"
                >
                  <PanelLeftClose size={20} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="group p-1.5 rounded-lg text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0 flex items-center justify-center w-8 h-8"
                title="Open sidebar"
              >
                <div className="block group-hover:hidden">
                  <AstraLogo size={24} className="text-slate-900 dark:text-white" />
                </div>
                <div className="hidden group-hover:block">
                  <PanelLeft size={20} />
                </div>
              </button>
            )}
          </div>

          {/* Actions & Search bar */}
          <div className={`pb-3 flex flex-col ${isSidebarOpen ? "px-3 space-y-1" : "px-0 items-center space-y-2 mt-2 w-full"}`}>
            <button
              onClick={() => setActiveSessionId(null)}
              className={`flex items-center gap-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-900 dark:text-white transition-all text-sm font-medium ${isSidebarOpen ? "w-full justify-start px-3 py-2.5" : "w-9 h-9 justify-center p-0"}`}
              title="New chat"
            >
              <Plus size={18} className="shrink-0 text-slate-900 dark:text-white" />
              {isSidebarOpen && <span className="truncate">New chat</span>}
            </button>
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className={`flex items-center gap-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-900 dark:text-white transition-all text-sm font-medium ${isSidebarOpen ? "w-full justify-start px-3 py-2.5" : "w-9 h-9 justify-center p-0"}`}
              title="Search chats"
            >
              <Search size={18} className="shrink-0 text-slate-900 dark:text-white" />
              {isSidebarOpen && <span className="truncate">Search chats</span>}
            </button>
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className={`flex items-center gap-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-900 dark:text-white transition-all text-sm font-medium ${isSidebarOpen ? "w-full justify-start px-3 py-2.5" : "w-9 h-9 justify-center p-0"}`}
              title="New project"
            >
              <FolderPlus size={18} className="shrink-0 text-slate-900 dark:text-white" />
              {isSidebarOpen && <span className="truncate">New project</span>}
            </button>

            {/* Library Section Tab */}
            <button
              onClick={() => setIsLibraryModalOpen(true)}
              className={`flex items-center gap-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-900 dark:text-white transition-all text-sm font-medium ${isSidebarOpen ? "w-full justify-start px-3 py-2.5" : "w-9 h-9 justify-center p-0"}`}
              title="Library"
            >
              <Image size={18} className="shrink-0 text-slate-900 dark:text-white" />
              {isSidebarOpen && <span className="truncate">Library</span>}
            </button>

            {/* Folders (Projects) Hover Trigger - Closed Sidebar Only */}
            {!isSidebarOpen && projects && projects.length > 0 && (
              <div
                className="relative"
                onMouseEnter={() => setIsProjectsHoverOpen(true)}
                onMouseLeave={() => setIsProjectsHoverOpen(false)}
              >
                <button
                  type="button"
                  className="w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-900 dark:text-white transition-all flex items-center justify-center p-0"
                  title="Folders"
                >
                  <Folder size={18} className="shrink-0 text-slate-900 dark:text-white" />
                </button>

                {isProjectsHoverOpen && (
                  <div className="absolute left-full top-0 pl-2 z-50">
                    <div className="w-64 bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl py-2 animate-fade-in text-slate-800 dark:text-white text-left">
                      <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/5 mb-1.5 flex items-center gap-2">
                        <Folder size={12} className="text-slate-500 dark:text-white/60" />
                        <span>Folders</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto scrollbar px-1 space-y-1">
                        {projects.map(project => {
                          const projectSessions = sessions.filter(s => s.project_id === project.id);
                          return (
                            <div key={project.id} className="p-1">
                              <div className="px-2 py-1.5 rounded-lg text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                <Folder size={14} className="text-slate-500 dark:text-white/65 shrink-0" />
                                <span className="truncate">{project.name}</span>
                              </div>
                              {projectSessions.length > 0 ? (
                                <div className="pl-4 pr-1 mt-0.5 space-y-0.5 border-l border-slate-200 dark:border-white/10 ml-3.5">
                                  {projectSessions.map(session => (
                                    <div
                                      key={session.id}
                                      onClick={() => {
                                        setActiveSessionId(session.id);
                                        setIsProjectsHoverOpen(false);
                                      }}
                                      className="px-2 py-1 rounded text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer truncate transition-colors"
                                    >
                                      {session.title || "Untitled Session"}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400 dark:text-white/30 pl-8 py-0.5">Empty</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pinned Hover Trigger - Closed Sidebar Only */}
            {!isSidebarOpen && sessions.some(s => s.is_pinned) && (
              <div
                className="relative"
                onMouseEnter={() => setIsPinnedHoverOpen(true)}
                onMouseLeave={() => setIsPinnedHoverOpen(false)}
              >
                <button
                  type="button"
                  className="w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-900 dark:text-white transition-all flex items-center justify-center p-0"
                  title="Pinned chats"
                >
                  <Pin size={18} className="shrink-0 text-slate-900 dark:text-white rotate-45" />
                </button>

                {isPinnedHoverOpen && (
                  <div className="absolute left-full top-0 pl-2 z-50">
                    <div className="w-64 bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-fade-in text-slate-800 dark:text-white text-left">
                      <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/5 mb-1.5 flex items-center gap-2">
                        <Pin size={12} className="text-slate-500 dark:text-white/60 rotate-45" />
                        <span>Pinned Chats</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto scrollbar px-1 space-y-0.5">
                        {sessions.filter(s => s.is_pinned).map(session => (
                          <div
                            key={session.id}
                            onClick={() => {
                              setActiveSessionId(session.id);
                              setIsPinnedHoverOpen(false);
                            }}
                            className="px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer truncate transition-colors flex items-center justify-between"
                          >
                            <span className="truncate">{session.title || "Untitled Session"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chat Sessions list scroll */}
          <div className={`flex-1 overflow-y-auto px-2 py-1 scrollbar space-y-6 ${!isSidebarOpen ? "hidden" : ""}`}>
            {sessionsLoading ? (
              <div className="text-center py-8 text-xs text-white">Loading history...</div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-xs text-white">No chats found</div>
            ) : (
              <div className="space-y-4">
                {/* Projects Section */}
                {projects && projects.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between px-3 mb-1">
                      <h3 className="text-xs font-medium text-white/50">Projects</h3>
                      <button onClick={() => setIsProjectModalOpen(true)} className="text-white/50 hover:text-white transition-colors" title="New Project">
                        <FolderPlus size={14} />
                      </button>
                    </div>
                    <div className="space-y-0.5">
                      {projects.map(project => {
                        const isExpanded = expandedProjects.includes(project.id);
                        const projectSessions = sessions.filter(s => s.project_id === project.id);
                        return (
                          <div key={project.id}>
                            <div
                              onClick={() => toggleProject(project.id)}
                              className="group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all hover:bg-white/5 text-white/90"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <ChevronRight size={14} className={`transition-transform duration-200 ${isExpanded ? "rotate-90 text-white" : "text-white/50"}`} />
                                <Folder size={14} className="text-white/70" />
                                <span className="truncate">{project.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={14} className="hover:text-rose-400 text-white/50 shrink-0" onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }} title="Delete Project" />
                              </div>
                            </div>
                            {isExpanded && (
                              <div className="pl-6 pr-1 mt-0.5 space-y-0.5 border-l-2 border-white/5 ml-4">
                                {projectSessions.length === 0 ? (
                                  <div className="text-[10px] text-white/40 py-1 pl-2">Empty</div>
                                ) : (
                                  projectSessions.map(renderSession)
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* If no projects exist, still show the create button somewhere or just rely on a top level button. Wait, if projects array is empty, we don't show the section header. So let's add the create project button to the Actions & Search bar. */}

                {sessions.some(s => s.is_pinned && !s.project_id) && (
                  <div>
                    <h3 className="px-3 text-xs font-medium text-slate-400 dark:text-white/50 mb-1">Pinned</h3>
                    <div className="space-y-0.5">
                      {sessions.filter(s => s.is_pinned && !s.project_id).map(renderSession)}
                    </div>
                  </div>
                )}
                {sessions.some(s => !s.is_pinned && !s.project_id) && (
                  <div>
                    <h3 className="px-3 text-xs font-medium text-slate-400 dark:text-white/50 mb-1">Recent</h3>
                    <div className="space-y-0.5">
                      {sessions.filter(s => !s.is_pinned && !s.project_id).map(renderSession)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer User Info */}
        <div ref={profileDropdownRef} className={`border-t border-slate-200 dark:border-white/5 bg-white dark:bg-[#000000] flex flex-col relative ${isSidebarOpen ? "p-3" : "py-3 px-0 items-center w-full"}`}>
          {!!user?.is_admin && isSidebarOpen && (
            <button
              onClick={() => onNavigate("admin")}
              className="w-full mb-3 py-2 px-3 rounded-lg bg-slate-100 dark:bg-white/10 border border-slate-300 dark:border-white/20 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Shield size={14} />
              Admin control panel
            </button>
          )}

          <div
            className={`flex items-center gap-3 min-w-0 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors relative ${isSidebarOpen ? "p-2 justify-between" : "p-1 justify-center w-10 h-10"}`}
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                {(!user?.avatar_url || avatarError) ? (
                  <User size={18} className="text-slate-500 dark:text-white/80" />
                ) : (
                  <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
                )}
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-slate-800 dark:text-white truncate flex items-center gap-1.5">
                    {user?.full_name}
                    {!!user?.is_admin && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white font-mono">ADMIN</span>
                    )}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-white/60 font-semibold capitalize">
                    {user?.is_admin ? "Platform" : (user?.subscription_tier || "Starter - Free")}
                  </span>
                </div>
              )}
            </div>

            {/* Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-60 bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl py-1 z-50 animate-fade-in text-slate-800 dark:text-white">
                {/* User Info Header Item Wrapper with hover detection */}
                <div
                  className="relative"
                  onMouseLeave={() => setIsAccountsSubmenuOpen(false)}
                >
                  <button
                    onClick={() => setIsAccountsSubmenuOpen(!isAccountsSubmenuOpen)}
                    onMouseEnter={() => setIsAccountsSubmenuOpen(true)}
                    className="w-full text-left px-4 py-3 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-between border-b border-slate-100 dark:border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center shrink-0 overflow-hidden text-slate-500 dark:text-white/80">
                        {(!user?.avatar_url || avatarError) ? (
                          <span className="text-slate-550 dark:text-white/80 text-xs font-bold font-sans uppercase">
                            {user?.full_name ? user.full_name.substring(0, 2) : "US"}
                          </span>
                        ) : (
                          <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium leading-tight truncate text-slate-800 dark:text-white">{user?.full_name || "User"}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight font-medium">Go</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </button>

                  {/* Submenu for Account Switching / Adding */}
                  {isAccountsSubmenuOpen && (
                    <div className="absolute bottom-full sm:bottom-auto sm:top-0 left-0 sm:left-full sm:ml-2 mb-2 sm:mb-0 w-64 bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl py-2 z-[60] animate-fade-in text-slate-800 dark:text-white">
                      <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 border-b border-slate-100 dark:border-white/5 truncate">
                        <User size={14} className="shrink-0" />
                        <span className="truncate">{user?.email || "user@astra.ai"}</span>
                      </div>
                      <div className="px-4 py-2.5 flex items-center justify-between text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center shrink-0 overflow-hidden text-slate-500 dark:text-white/80">
                            {(!user?.avatar_url || avatarError) ? (
                              <span className="text-slate-550 dark:text-white/80 text-[10px] font-bold uppercase">
                                {user?.full_name ? user.full_name.substring(0, 2) : "US"}
                              </span>
                            ) : (
                              <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
                            )}
                          </div>
                          <span className="text-sm font-normal text-slate-800 dark:text-white">{user?.full_name || "User"}</span>
                        </div>
                        <Check size={16} className="text-slate-800 dark:text-white" />
                      </div>
                      <div className="my-1.5 border-t border-slate-100 dark:border-white/5"></div>
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          setIsAccountsSubmenuOpen(false);
                          setAddAccountMode("email");
                          setAddAccountEmail("");
                          setAddAccountOtp("");
                          setAddAccountError("");
                          setIsAddAccountModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-3"
                      >
                        <Plus size={16} className="text-slate-400" />
                        <span>Add account</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setIsPlanModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-750 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-3 mt-1"
                >
                  <Sparkles size={16} className="text-slate-500 dark:text-white/70" /> Upgrade plan
                </button>
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setIsAppearanceModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-750 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-3"
                >
                  <Palette size={16} className="text-slate-500 dark:text-white/70" /> Appearance
                </button>
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-750 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-3"
                >
                  <User size={16} className="text-slate-500 dark:text-white/70" /> Profile
                </button>
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setSettingsActiveTab("general");
                    setIsSettingsModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-750 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-3"
                >
                  <Settings size={16} className="text-slate-500 dark:text-white/70" /> Settings
                </button>
                {!!user?.is_admin && (
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      onNavigate("admin");
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-3 font-medium"
                  >
                    <Shield size={16} className="text-slate-500 dark:text-slate-400 shrink-0" /> Admin Panel
                  </button>
                )}
                <div className="my-1 border-t border-slate-100 dark:border-white/5"></div>
                <div
                  className="relative"
                  onMouseLeave={() => setIsHelpSubmenuOpen(false)}
                >
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setIsHelpModalOpen(true);
                    }}
                    onMouseEnter={() => setIsHelpSubmenuOpen(true)}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-755 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle size={16} className="text-slate-500 dark:text-white/70" /> Help
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>

                  {/* Help Submenu */}
                  {isHelpSubmenuOpen && (
                    <div className="absolute bottom-full sm:bottom-0 left-0 sm:left-full sm:pl-2 mb-2 sm:mb-0 z-[60]">
                      <div className="w-60 bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl py-2 animate-fade-in text-slate-800 dark:text-white">
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            setIsHelpSubmenuOpen(false);
                            showDialog({
                              type: "info",
                              title: "Coming Soon",
                              message: "Terms of Service are coming soon to Astra AI!",
                              confirmText: "Okay",
                              onConfirm: () => closeDialog()
                            });
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-3"
                        >
                          <BookOpen size={15} className="text-slate-500 dark:text-white/70" />
                          <span>Terms of Service</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            setIsHelpSubmenuOpen(false);
                            showDialog({
                              type: "info",
                              title: "Coming Soon",
                              message: "Privacy Policy is coming soon to Astra AI!",
                              confirmText: "Okay",
                              onConfirm: () => closeDialog()
                            });
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-3"
                        >
                          <Shield size={15} className="text-slate-500 dark:text-white/70" />
                          <span>Privacy Policy</span>
                        </button>
                        <a
                          href="mailto:support@astra.ai?subject=Bug Report - Astra AI"
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-3"
                        >
                          <AlertTriangle size={15} className="text-slate-500 dark:text-white/70" />
                          <span>Report a bug</span>
                        </a>

                        <div className="my-1.5 border-t border-slate-100 dark:border-white/5"></div>

                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            setIsHelpSubmenuOpen(false);
                            showDialog({
                              type: "info",
                              title: "Coming Soon",
                              message: "Help center is coming soon to Astra AI!",
                              confirmText: "Okay",
                              onConfirm: () => closeDialog()
                            });
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-3"
                        >
                          <HelpCircle size={15} className="text-slate-500 dark:text-white/70" />
                          <span>Help center</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={() => logout()} className="w-full text-left px-4 py-2.5 text-sm text-slate-750 dark:text-white hover:bg-rose-500/10 hover:text-rose-600 flex items-center gap-3">
                  <LogOut size={16} className="text-slate-500 dark:text-white/70" /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Main Conversation Section */}
      <main className="flex-1 flex flex-col justify-between bg-slate-50 dark:bg-[#000000] relative overflow-hidden">

        {/* Top Left Model Selector Dropdown */}
        <div className="absolute top-2 left-5 z-50" ref={modelDropdownRef}>
          <div className="relative">
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[1.15rem] font-medium text-slate-800 dark:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors"
            >
              Astra AI <ChevronDown size={20} className="text-slate-500 dark:text-white/70" />
            </button>
            {isModelDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-[340px] bg-white dark:bg-[#2f2f2f] border border-slate-200 dark:border-white/5 rounded-2xl shadow-2xl py-2 z-50">

                {/* Llama 3.1 8B (Default) */}
                <button
                  onClick={() => { setSelectedModel("astra-gpt-4"); setIsModelDropdownOpen(false); }}
                  className="w-full text-left px-4 py-3 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
                >
                  <AstraLogo size={20} className="text-slate-900 dark:text-white shrink-0" />
                  <div className="flex flex-col flex-1">
                    <span className="font-medium text-slate-800 dark:text-white text-[15px] flex items-center gap-2">
                      Astra AI (Llama 3.1 8B)
                      {selectedModel === "astra-gpt-4" && <Check size={14} className="text-emerald-400" />}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-white/60">Fastest · Great for everyday tasks</span>
                  </div>
                </button>

                {/* Llama 3 70B */}
                <button
                  onClick={() => { setSelectedModel("astra-code-llama"); setIsModelDropdownOpen(false); }}
                  className="w-full text-left px-4 py-3 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-3 transition-colors mt-1 border-t border-slate-200 dark:border-white/5"
                >
                  <Terminal size={20} className="text-slate-600 dark:text-white shrink-0" />
                  <div className="flex flex-col flex-1">
                    <span className="font-medium text-slate-800 dark:text-white text-[15px] flex items-center gap-2">
                      Astra Coder (Llama 3 70B)
                      {selectedModel === "astra-code-llama" && <Check size={14} className="text-emerald-400" />}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-white/60">Highest quality · Best for coding/logic</span>
                  </div>
                </button>

                {/* Google Gemma 2 */}
                <button
                  onClick={() => { setSelectedModel("gemma-7b"); setIsModelDropdownOpen(false); }}
                  className="w-full text-left px-4 py-3 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-3 transition-colors mt-1 border-t border-slate-200 dark:border-white/5"
                >
                  <Sparkles size={20} className="text-slate-600 dark:text-white shrink-0" />
                  <div className="flex flex-col flex-1">
                    <span className="font-medium text-slate-800 dark:text-white text-[15px] flex items-center gap-2">
                      Astra Creative (Gemma 2 9B)
                      {selectedModel === "gemma-7b" && <Check size={14} className="text-emerald-400" />}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-white/60">Creative writing & Google's intelligence</span>
                  </div>
                </button>

                {/* Mixtral */}
                <button
                  onClick={() => { setSelectedModel("mixtral-8x7b"); setIsModelDropdownOpen(false); }}
                  className="w-full text-left px-4 py-3 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-3 transition-colors mt-1 border-t border-slate-200 dark:border-white/5"
                >
                  <Zap size={20} className="text-slate-600 dark:text-white shrink-0" />
                  <div className="flex flex-col flex-1">
                    <span className="font-medium text-slate-800 dark:text-white text-[15px] flex items-center gap-2">
                      Astra Pro (Mixtral 8x7B)
                      {selectedModel === "mixtral-8x7b" && <Check size={14} className="text-emerald-400" />}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-white/60">Excellent balance of speed & reasoning</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Top Right Temporary Chat Toggle */}
        <div className="absolute top-3 right-5 z-50 flex items-center gap-3">
          <div className="relative group">
            <button
              onClick={() => {
                const next = !isTemporaryChat;
                setIsTemporaryChat(next);
                localStorage.setItem('astra_temp_chat', String(next));
              }}
              className={`p-2 rounded-full transition-all flex items-center justify-center ${isTemporaryChat ? 'bg-white/10 text-white' : 'text-slate-500 dark:text-white/50 hover:text-white hover:bg-white/10'}`}
              title={isTemporaryChat ? 'Turn off temporary chat' : 'Turn on temporary chat'}
            >
              {isTemporaryChat ? <Check size={18} /> : <MessageSquareDashed size={18} />}
            </button>
            {/* Tooltip */}
            <div className="absolute top-full right-0 mt-2 px-3 py-1.5 bg-[#2f2f2f] text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/5 shadow-xl">
              {isTemporaryChat ? 'Turn off temporary chat' : 'Turn on temporary chat'}
            </div>
          </div>
        </div>

        {/* Top Right Action Menu */}
        {activeSessionId && currentSession && (
          <div className="absolute top-2 right-16 z-50 flex items-center gap-2">
            <button
              onClick={() => exportChatPDF(currentSession.id)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 text-sm font-medium text-white transition-colors"
            >
              <Download size={14} className="rotate-180" /> Share
            </button>
            <div className="relative" ref={chatHeaderMenuRef}>
              <button
                onClick={() => setIsChatHeaderMenuOpen(!isChatHeaderMenuOpen)}
                className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
              >
                <MoreHorizontal size={20} />
              </button>

              {isChatHeaderMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-[#2f2f2f] border border-white/5 rounded-xl shadow-2xl py-1 z-50">
                  <button
                    onClick={() => {
                      setEditingSessionId(currentSession.id);
                      setEditTitleInput(currentSession.title);
                      setIsChatHeaderMenuOpen(false);
                      setIsSidebarOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5 flex items-center gap-2"
                  >
                    <Edit3 size={14} /> Rename
                  </button>

                  <button
                    onClick={() => {
                      pinSession(currentSession.id);
                      setIsChatHeaderMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5 flex items-center gap-2"
                  >
                    <Pin size={14} /> {currentSession.is_pinned ? "Unpin chat" : "Pin chat"}
                  </button>

                  {/* Move to Project Hover Item */}
                  <div
                    className="relative"
                    onMouseEnter={() => setIsMoveToProjectHovered(true)}
                    onMouseLeave={() => setIsMoveToProjectHovered(false)}
                  >
                    <button className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5 flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <Folder size={14} /> Move to
                      </div>
                      <ChevronRight size={14} className="text-white/50 group-hover:text-white transition-colors" />
                    </button>

                    {isMoveToProjectHovered && (
                      <div className="absolute top-0 right-full mr-1 w-48 bg-[#2f2f2f] border border-white/5 rounded-xl shadow-2xl py-1 z-50">
                        <button
                          onClick={() => {
                            setIsProjectModalOpen(true);
                            setIsChatHeaderMenuOpen(false);
                            setIsMoveToProjectHovered(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5 flex items-center gap-2"
                        >
                          <FolderPlus size={14} /> New project
                        </button>
                        {projects && projects.length > 0 && <div className="my-1 border-t border-white/5"></div>}
                        {projects.map(p => (
                          <button
                            key={p.id}
                            onClick={() => {
                              assignSessionToProject(currentSession.id, p.id);
                              setIsChatHeaderMenuOpen(false);
                              setIsMoveToProjectHovered(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5 truncate"
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="my-1 border-t border-white/5"></div>
                  <button
                    onClick={() => {
                      setSessionToDelete(currentSession.id);
                      setIsChatHeaderMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inactive Chat Session: Show Dashboard Hub screen */}
        {!activeSessionId ? (
          <div className="flex-1 overflow-y-auto px-6 pt-12 flex flex-col items-center justify-end max-w-3xl mx-auto text-center scrollbar w-full pb-6 -translate-y-16">
            {isTemporaryChat ? (
              <>
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-5">
                  <MessageSquareDashed size={28} className="text-white" />
                </div>
                <h1 className="text-[28px] font-semibold text-slate-800 dark:text-white mb-2 tracking-tight">
                  Temporary Chat
                </h1>
                <p className="text-[14px] text-slate-500 dark:text-[#9b9b9b] leading-normal max-w-md">
                  This chat won't appear in history or be used to train our models. For safety purposes, we may keep a copy of this chat for up to 30 days.
                </p>
              </>
            ) : (
              <>
                <AstraLogo key={`logo-${!!(isInputFocused || chatInput.trim())}`} size={56} className="text-slate-900 dark:text-white mb-6" animated={!(isInputFocused || !!chatInput.trim())} />
                <h1 className="text-2xl font-normal text-slate-800 dark:text-white">
                  {greeting}
                </h1>
              </>
            )}
          </div>
        ) : (

          /* Active Chat: Render Conversation Thread Log */
          <div className="flex-1 overflow-y-auto px-6 pt-16 pb-6 scrollbar">
            <div className="max-w-3xl mx-auto space-y-6 w-full">
              {messagesLoading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                  <RefreshCw className="animate-spin text-white/50" size={28} />
                </div>
              ) : !currentSession || !currentSession.messages || currentSession.messages.length === 0 ? (
                <div className="text-center py-20 text-xs text-slate-600">No messages in this chat. Submit a prompt below to start.</div>
              ) : (
                currentSession.messages.map((msg, index) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div
                      key={msg.id || index}
                      className={`flex flex-col w-full animate-fade-in ${isUser ? "items-end" : "items-start"}`}
                    >
                      <div className={`group relative max-w-[85%] md:max-w-[75%] ${isUser ? "bg-slate-100 text-slate-800 dark:bg-[#2f2f2f] dark:text-white rounded-[24px] px-5 py-3 shadow-sm border border-slate-200/60 dark:border-transparent" : "text-slate-800 dark:text-white py-2 w-full"}`}>
                        {/* If user uploaded a document, display a file tag */}
                        {msg.file_url && (() => {
                          let urls = [];
                          let types = [];
                          try {
                            if (msg.file_url.startsWith("[")) {
                              urls = JSON.parse(msg.file_url);
                              types = JSON.parse(msg.file_type || "[]");
                            } else {
                              urls = [msg.file_url];
                              types = [msg.file_type || "pdf"];
                            }
                          } catch (e) {
                            urls = [msg.file_url];
                            types = [msg.file_type || "pdf"];
                          }

                          return (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {urls.map((url, uIdx) => {
                                const type = types[uIdx] || "pdf";
                                return (
                                  <div key={uIdx} className="inline-flex items-center gap-2 p-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-lg text-xs text-sky-500 dark:text-sky-400 font-medium select-none">
                                    {type === "pdf" ? <FileText size={14} /> : <Camera size={14} />}
                                    <span>Attached Context Ingestion ({type.toUpperCase()})</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}

                        {/* Parse content */}
                        {isUser ? (
                          <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</p>
                        ) : (
                          <div className="text-[15px] leading-relaxed">
                            <MarkdownRenderer content={msg.content} />
                          </div>
                        )}

                        {/* Action Icons for AI message */}
                        {!isUser && (
                          <div className="flex items-center gap-1.5 mt-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleCopy(msg.id || index, msg.content)} className="p-1.5 rounded-md hover:bg-white/5 hover:text-slate-200 transition-colors" title="Copy">
                              {copiedMessageId === (msg.id || index) ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                            </button>
                            <button onClick={() => handleLike(msg.id || index)} className={`p-1.5 rounded-md hover:bg-white/5 transition-colors ${likedMessageIds.has(msg.id || index) ? 'text-white' : 'hover:text-slate-200'}`} title="Good response">
                              <ThumbsUp size={15} className={likedMessageIds.has(msg.id || index) ? 'fill-white text-white' : ''} />
                            </button>
                            {!likedMessageIds.has(msg.id || index) && (
                              <button className="p-1.5 rounded-md hover:bg-white/5 hover:text-slate-200 transition-colors" title="Bad response"><ThumbsDown size={15} /></button>
                            )}
                            <button className="p-1.5 rounded-md hover:bg-white/5 hover:text-slate-200 transition-colors" title="Regenerate"><RefreshCw size={15} /></button>
                            <button className="p-1.5 rounded-md hover:bg-white/5 hover:text-slate-200 transition-colors" title="More options"><MoreHorizontal size={15} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* SSE dynamic loading indicators */}
              {isStreaming && (!currentSession?.messages || currentSession.messages.length === 0 || currentSession.messages[currentSession.messages.length - 1].sender !== "assistant" || !currentSession.messages[currentSession.messages.length - 1].content) && (
                <div className="flex flex-col w-full items-start">
                  <div className="group relative max-w-[85%] md:max-w-[75%] text-slate-200 py-2 w-full">
                    <div className="flex gap-1 py-3 px-1 items-center">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* 3. Bottom Chat prompt entry bar */}
        <div className={`p-4 md:px-6 md:pb-6 bg-transparent w-full transition-transform duration-300 ${!activeSessionId ? "flex-1 flex flex-col justify-start -translate-y-16" : ""}`}>
          <div className="max-w-3xl mx-auto space-y-3 w-full">

            {/* Error notifications */}
            {uploadError && (
              <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/10 text-xs text-rose-400">
                {uploadError}
              </div>
            )}

            {/* Border Snake Animation Wrapper */}
            <div className={`relative p-[1.5px] rounded-[24px] overflow-hidden transition-all duration-300 ${(isInputFocused || chatInput.trim().length > 0)
              ? "bg-slate-300 dark:bg-[#404040]"
              : "bg-slate-200 dark:bg-zinc-800 focus-within:bg-transparent"
              }`}>
              {/* Animated Snake Light */}
              {!(isInputFocused || chatInput.trim().length > 0) && (
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-[24px]">
                  <div className="absolute inset-[-300%] bg-[conic-gradient(from_0deg,transparent_60%,#38bdf8_80%,#3b82f6_90%,#818cf8_95%,transparent_100%)] animate-border-snake origin-center"></div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSendPrompt} className="relative z-10 bg-white dark:bg-[#2f2f2f] rounded-[23px] p-3 shadow-sm flex flex-col gap-2 w-full h-full border-none outline-none">
                {/* Slash commands autocomplete list */}
                {showSlashMenu && filteredSlashCommands.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-3 w-full bg-white dark:bg-[#2e2e2e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1.5 z-50 animate-fade-in max-h-64 overflow-y-auto">
                    <div className="px-4 py-1.5 text-[10px] font-semibold text-slate-450 dark:text-slate-400 uppercase tracking-wider select-none border-b border-slate-100 dark:border-white/5 mb-1">
                      Quick Commands
                    </div>
                    {filteredSlashCommands.map((cmd, idx) => {
                      const isSelected = idx === slashSelectedIndex;
                      return (
                        <div
                          key={cmd.command}
                          onClick={() => handleSelectSlashCommand(cmd)}
                          className={`flex items-center justify-between px-4 py-2.5 cursor-pointer select-none transition-colors ${isSelected
                            ? "bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white font-medium"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                            }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-slate-150 dark:bg-white/5 flex items-center justify-center shrink-0">
                              {cmd.icon}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-semibold truncate">{cmd.command}</span>
                              <span className="text-xs text-slate-450 dark:text-slate-400 truncate">{cmd.description}</span>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-250/50 dark:bg-white/10 text-slate-500 dark:text-slate-400 font-medium">
                            {cmd.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Attachment Preview (Rendered inside the input form for high-end look) */}
                {uploadedFiles.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mb-1 px-1">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx}>
                        {file.type === "image" ? (
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 group cursor-pointer hover:border-white/50 transition-all">
                            <img
                              src={file.previewUrl}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onClick={() => {
                                setUploadedFileUrl(file.previewUrl);
                                setIsPreviewLightboxOpen(true);
                              }}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeAttachment(idx);
                              }}
                              className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors flex items-center justify-center w-4 h-4 z-10"
                              title="Remove image"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-xs text-slate-700 dark:text-white">
                            <FileText size={14} className="text-white" />
                            <span className="truncate max-w-[150px]">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeAttachment(idx)}
                              className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center"
                              title="Remove file"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Text Input area */}
                <textarea
                  ref={textareaRef}
                  value={chatInput}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (showSlashMenu && filteredSlashCommands.length > 0) {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setSlashSelectedIndex(prev => (prev + 1) % filteredSlashCommands.length);
                        return;
                      }
                      if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setSlashSelectedIndex(prev => (prev - 1 + filteredSlashCommands.length) % filteredSlashCommands.length);
                        return;
                      }
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (filteredSlashCommands[slashSelectedIndex]) {
                          handleSelectSlashCommand(filteredSlashCommands[slashSelectedIndex]);
                        }
                        return;
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setShowSlashMenu(false);
                        return;
                      }
                    }

                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendPrompt(e);
                    }
                  }}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  placeholder="Ask anything"
                  rows={1}
                  className="w-full max-h-36 min-h-[40px] px-2 py-1.5 bg-transparent outline-none border-none text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#a0a0a0] placeholder:opacity-100 font-normal antialiased text-[16px] resize-none scrollbar"
                />

                <div className="flex justify-between items-center px-1">
                  {/* Left Side */}
                  <div className="flex items-center gap-2 select-none relative" ref={attachmentDropdownRef}>
                    {/* Upload Clip icon button */}
                    <button
                      type="button"
                      onClick={() => setIsAttachmentDropdownOpen(!isAttachmentDropdownOpen)}
                      disabled={isFileUploading}
                      className="p-1.5 rounded-full text-slate-500 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center justify-center animate-fade-in"
                      title="Upload context PDF or Image"
                    >
                      <Plus size={20} className={isFileUploading ? "animate-spin" : ""} />
                    </button>

                    {activePromptMode && (
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#1a1a1a] border border-slate-300 dark:border-[#2d2d2d] text-slate-700 dark:text-[#e0e0e0] rounded-full px-2.5 py-1 text-xs select-none animate-fade-in shadow-inner">
                        <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-white/5 flex items-center justify-center">
                          {activePromptMode === 'image' && <Sparkles size={11} className="text-pink-500" />}
                          {activePromptMode === 'code' && <Code size={11} className="text-emerald-500" />}
                          {activePromptMode === 'search' && <Search size={11} className="text-sky-500" />}
                        </div>
                        <span className="text-[11.5px] font-normal leading-none">
                          {activePromptMode === 'image' && "Create an image"}
                          {activePromptMode === 'code' && "Write or edit"}
                          {activePromptMode === 'search' && "Look something up"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActivePromptMode(null)}
                          className="ml-1 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-full w-3.5 h-3.5 flex items-center justify-center transition-colors font-bold"
                        >
                          <X size={8} strokeWidth={3.5} />
                        </button>
                      </div>
                    )}

                    {isAttachmentDropdownOpen && (
                      <div className="absolute bottom-full left-0 mb-2 w-44 bg-white dark:bg-[#2f2f2f] border border-slate-200 dark:border-white/5 rounded-xl shadow-2xl py-1.5 z-50 animate-fade-in">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAttachmentDropdownOpen(false);
                            handleFileUploadClick();
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                        >
                          <Upload size={14} className="text-slate-500 dark:text-white/75" /> Upload photos & files
                        </button>
                      </div>
                    )}

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                      multiple
                      className="hidden"
                    />
                  </div>

                  {/* Right Side Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Voice Input icon button */}
                    <button
                      type="button"
                      onClick={triggerVoiceInput}
                      className={`p-1.5 rounded-full transition-all ${isVoiceInputActive
                        ? "text-rose-400 bg-rose-500/10"
                        : "text-slate-500 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                        }`}
                      title="Voice Input"
                    >
                      {isVoiceInputActive ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>

                    {/* Dynamic Voice/Send Button */}
                    <button
                      type={(chatInput.trim() || uploadedFiles.length > 0) ? "submit" : "button"}
                      disabled={isStreaming}
                      onClick={(e) => {
                        if (!chatInput.trim() && uploadedFiles.length === 0) {
                          e.preventDefault();
                          triggerVoiceInput();
                        }
                      }}
                      className={`w-8 h-8 rounded-full transition-all flex items-center justify-center bg-white text-black hover:bg-slate-200 shadow-lg ${isVoiceInputActive ? "animate-pulse bg-rose-500 text-white hover:bg-rose-600" : ""}`}
                    >
                      {(!chatInput.trim() && uploadedFiles.length === 0) ? (
                        <VoiceWaveIcon size={18} className="" />
                      ) : (
                        <ArrowUp size={18} strokeWidth={2.5} />
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Horizontal line of chips right below the input form, matching user screenshot style */}
            <div className={`flex flex-wrap items-center justify-center gap-3 mt-4 select-none transition-all duration-300 ${(chatInput.trim() || activeSessionId) ? 'opacity-0 pointer-events-none h-0 mt-0 overflow-hidden' : 'opacity-100 animate-fade-in'}`}>
              <button
                type="button"
                onClick={() => setActivePromptMode(activePromptMode === 'image' ? null : 'image')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-[13px] font-normal transition-all duration-200 cursor-pointer shadow-sm ${activePromptMode === 'image'
                  ? 'bg-pink-500/10 border-pink-500/40 text-pink-500 dark:text-pink-400'
                  : 'bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
              >
                <Sparkles size={14} className={activePromptMode === 'image' ? "text-pink-500 animate-pulse" : "text-slate-500 dark:text-slate-400"} />
                <span>Create an image</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePromptMode(activePromptMode === 'code' ? null : 'code')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-[13px] font-normal transition-all duration-200 cursor-pointer shadow-sm ${activePromptMode === 'code'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
              >
                <Code size={14} className={activePromptMode === 'code' ? "text-emerald-500 animate-pulse" : "text-slate-500 dark:text-slate-400"} />
                <span>Write or edit</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePromptMode(activePromptMode === 'search' ? null : 'search')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-[13px] font-normal transition-all duration-200 cursor-pointer shadow-sm ${activePromptMode === 'search'
                  ? 'bg-sky-500/10 border-sky-500/40 text-sky-600 dark:text-sky-400'
                  : 'bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
              >
                <Search size={14} className={activePromptMode === 'search' ? "text-sky-500 animate-pulse" : "text-slate-500 dark:text-slate-400"} />
                <span>Look something up</span>
              </button>
            </div>

            <div className="text-[12px] text-center text-[#9b9b9b] select-none mt-3 mb-1">
              Astra AI can make mistakes. Check important info.
            </div>
          </div>
        </div>
      </main>

      {/* Search Modal Overlay */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <Search size={18} className="text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-slate-500"
              />
              <button onClick={() => setIsSearchModalOpen(false)} className="p-1 text-slate-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 scrollbar">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-500">No matches found.</div>
              ) : (
                <div className="space-y-1">
                  {filteredSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => {
                        loadSessionDetail(session.id);
                        setIsSearchModalOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-3"
                    >
                      <MessageSquare size={16} className="text-slate-500" />
                      <span className="text-sm font-medium text-slate-200 truncate">{session.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal Overlay */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] px-4">
          <div className="w-full max-w-md bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-white">Create New Folder</h2>
              <button onClick={() => setIsProjectModalOpen(false)} className="p-1 text-slate-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <input
              autoFocus
              type="text"
              placeholder="Folder Name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateProject();
                }
              }}
              className="w-full bg-darkBg border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 outline-none focus:border-white/20 transition-colors mb-6"
            />

            <div className="flex justify-end gap-3">
              <button onClick={() => setIsProjectModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleCreateProject} disabled={!newProjectName.trim()} className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-medium text-white mb-2">Delete Chat</h3>
            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to delete this chat? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSessionToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteSession(sessionToDelete);
                  setSessionToDelete(null);
                }}
                className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-medium rounded-lg hover:bg-red-500 hover:text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Upgrade Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-[2px] px-4 animate-fade-in">
          <div className="w-full max-w-4xl bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col relative max-h-[90vh] overflow-y-auto scrollbar text-slate-800 dark:text-white">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Zap size={22} className="text-slate-800 dark:text-white fill-slate-800 dark:fill-white animate-pulse" /> Upgrade Your Plan
                </h2>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Choose the plan that fits your workflow. Current Plan: <span className="text-slate-800 dark:text-white font-semibold uppercase">{user?.subscription_tier}</span>
                </p>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-150 dark:hover:bg-white/5 text-slate-450 hover:text-slate-800 dark:hover:text-white transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(pricingPlans.length > 0 ? pricingPlans : [
                { tier: "free", display_name: "Free", base_price_usd: 0.0, gst_rate: 18.0 },
                { tier: "premium", display_name: "Premium", base_price_usd: 2.0, gst_rate: 18.0 },
                { tier: "enterprise", display_name: "Enterprise", base_price_usd: 4.0, gst_rate: 18.0 }
              ]).map((p) => {
                const isCurrent = user?.subscription_tier === p.tier;
                const priceUSD = p.base_price_usd;
                const convertedPrice = (priceUSD * currencyInfo.rate).toFixed(2);

                // Static metadata mapper
                const planMeta = PLAN_FEATURES[p.tier] || {
                  desc: "Custom plan tier.",
                  features: ["All active features"]
                };
                return (
                  <div
                    key={p.tier}
                    className={`p-6 rounded-2xl flex flex-col relative transition-all border ${isCurrent
                      ? "border-slate-800 dark:border-white bg-slate-100/50 dark:bg-white/10 shadow-md dark:shadow-[0_0_15px_rgba(255,255,255,0.08)]"
                      : planMeta.popular
                        ? "border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 shadow-sm dark:shadow-[0_0_15px_rgba(255,255,255,0.03)]"
                        : "border-slate-200 dark:border-white/5 hover:border-slate-350 dark:hover:border-white/20 bg-transparent dark:bg-white/5"
                      }`}
                  >
                    {isCurrent && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-black font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border border-slate-250 dark:border-transparent">
                        Current Plan
                      </span>
                    )}
                    {!isCurrent && planMeta.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-200 dark:bg-white/80 text-slate-850 dark:text-black font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border border-slate-300 dark:border-transparent">
                        Most Popular
                      </span>
                    )}

                    <h3 className="text-lg font-bold text-slate-850 dark:text-white mb-1 mt-1">{p.display_name}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 min-h-[32px] leading-relaxed mb-4">{planMeta.desc}</p>

                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        {currencyInfo.symbol}{convertedPrice}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">/month</span>
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {planMeta.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-650 dark:text-slate-300">
                          <Check size={14} className="text-slate-800 dark:text-white shrink-0 mt-0.5" />
                          <span className="leading-tight">{feat}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => !isCurrent && setPaymentConfirmPlan(p)}
                      disabled={isCurrent || isUpgrading}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${isCurrent
                        ? "bg-slate-100 dark:bg-white/5 text-slate-450 dark:text-slate-500 cursor-default"
                        : "bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-black active:scale-98"
                        }`}
                    >
                      {isCurrent ? "Active Plan" : isUpgrading ? "Upgrading..." : "Select Plan"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {paymentConfirmPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-[2px] px-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 relative text-slate-800 dark:text-white">
            <h3 className="text-lg font-bold text-slate-855 dark:text-white mb-2">Confirm Payment</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Please review the details for your new plan subscription.</p>

            <div className="space-y-3 p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 text-sm text-slate-600 dark:text-slate-300 mb-6">
              <div className="flex justify-between">
                <span>Selected Plan</span>
                <span className="font-bold text-slate-855 dark:text-white">{paymentConfirmPlan.display_name || paymentConfirmPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-slate-850 dark:text-white font-medium">{currencyInfo.symbol}{(paymentConfirmPlan.base_price_usd * currencyInfo.rate).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>Tax / GST ({paymentConfirmPlan.gst_rate}%)</span>
                <span>+{currencyInfo.symbol}{(paymentConfirmPlan.base_price_usd * (paymentConfirmPlan.gst_rate / 100) * currencyInfo.rate).toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-white/10 my-2 pt-2 flex justify-between font-bold text-slate-855 dark:text-white text-base">
                <span>Total Amount</span>
                <span className="text-slate-900 dark:text-white">
                  {currencyInfo.symbol}{(paymentConfirmPlan.base_price_usd * (1 + paymentConfirmPlan.gst_rate / 100) * currencyInfo.rate).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setPaymentConfirmPlan(null)}
                className="px-4 py-2 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-350 rounded-xl text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExecuteUpgrade(paymentConfirmPlan.tier)}
                disabled={isUpgrading}
                className="px-5 py-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-black rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {isUpgrading ? "Processing..." : "Confirm & Pay"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-[2px] px-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-[#1e1e1e]/95 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-6 md:p-8 relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-white/5">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <User size={20} className="text-slate-500" /> Edit Profile
              </h2>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Alerts */}
            {profileSuccessMsg && (
              <div className="mb-4 p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                {profileSuccessMsg}
              </div>
            )}
            {profileErrorMsg && (
              <div className="mb-4 p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl">
                {profileErrorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              {/* Avatar Display */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center overflow-hidden border-2 border-slate-200 dark:border-white/10">
                    {(!profileAvatar && !user?.avatar_url) || avatarError ? (
                      <User size={36} className="text-slate-300 dark:text-white/30" />
                    ) : (
                      <img src={profileAvatar || user?.avatar_url} alt="Profile" className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
                    )}
                  </div>
                  {/* Circular edit badge overlay */}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 rounded-full bg-white dark:bg-[#2b2b2b] text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-[#3b3b3b] shadow-lg transition-all flex items-center justify-center cursor-pointer active:scale-90"
                    title="Change Photo"
                  >
                    <Upload size={14} />
                  </button>
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                />
              </div>

              {/* Display Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-650 dark:text-slate-300">Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-darkCard border border-slate-200 dark:border-white/10 text-sm focus:border-slate-400 dark:focus:border-white/20 outline-none text-slate-850 dark:text-slate-200"
                />
              </div>

              {/* Username (editable) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-650 dark:text-slate-300">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">@</span>
                  <input
                    type="text"
                    placeholder="your_username"
                    value={profileUsername}
                    onChange={(e) => setProfileUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    maxLength={20}
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-darkCard border border-slate-200 dark:border-white/10 text-sm focus:border-slate-400 dark:focus:border-white/20 outline-none text-slate-850 dark:text-slate-200"
                  />
                </div>
                <p className="text-[10px] text-slate-500 pl-1">3-20 characters · letters, numbers, underscores only</p>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-250 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-700 dark:hover:bg-slate-200 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appearance Modal */}
      {isAppearanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-[2px] px-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-[#1e1e1e]/95 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-6 md:p-8 relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-white/5">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Appearance</h2>
              <button
                onClick={() => setIsAppearanceModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Theme list */}
            <div className="space-y-2">
              {[
                { mode: "system", label: "System" },
                { mode: "light", label: "Light" },
                { mode: "dark", label: "Dark" },
              ].map(({ mode, label }) => (
                <button
                  key={mode}
                  onClick={() => setTheme(mode)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${theme === mode
                    ? "bg-slate-100 border-slate-300 text-slate-900 dark:bg-white/10 dark:border-white/20 dark:text-white"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-[#252525] dark:border-white/5 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:border-white/10"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{label}</span>
                    {theme === mode && (
                      <span className="text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-black px-2 py-0.5 rounded-full">Active</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-[2px] px-4 animate-fade-in">
          <div className="w-full max-w-[850px] h-[650px] max-h-[85vh] bg-white dark:bg-[#212121] rounded-2xl shadow-2xl flex flex-col sm:flex-row overflow-hidden border border-slate-200 dark:border-white/5">

            {/* Sidebar Tabs */}
            <div className="w-full sm:w-64 bg-slate-50 dark:bg-[#212121] flex flex-col p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-white/5 shrink-0 overflow-y-auto">
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors mb-4 shrink-0"
              >
                <X size={16} />
              </button>

              <div className="flex flex-col gap-0.5">
                {!!user?.is_admin && (
                  <button
                    onClick={() => setSettingsActiveTab("developer")}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all ${settingsActiveTab === "developer"
                      ? "bg-slate-200 text-slate-900 dark:bg-[#2f2f2f] dark:text-white font-semibold"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                      }`}
                  >
                    <Key size={18} className="shrink-0" /> Developer Keys
                  </button>
                )}
                <button
                  onClick={() => setSettingsActiveTab("general")}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all ${settingsActiveTab === "general"
                    ? "bg-slate-200 text-slate-900 dark:bg-[#2f2f2f] dark:text-white font-semibold"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                    }`}
                >
                  <Settings size={18} className="shrink-0" /> General
                </button>
                <button
                  onClick={() => setSettingsActiveTab("account")}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all ${settingsActiveTab === "account"
                    ? "bg-slate-200 text-slate-900 dark:bg-[#2f2f2f] dark:text-white font-semibold"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                    }`}
                >
                  <User size={18} className="shrink-0" /> Account
                </button>

              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 bg-white dark:bg-[#212121] overflow-y-auto p-6 sm:p-8 scrollbar">

              {settingsActiveTab === "general" && (
                <div className="animate-fade-in max-w-xl">
                  <h2 className="text-xl font-medium text-slate-800 dark:text-white mb-2">General</h2>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-6 pb-4 border-b border-slate-200 dark:border-white/5">Manage your system preference configurations.</p>

                  <div className="flex flex-col gap-2 max-w-sm mt-4">
                    <label className="text-xs font-semibold text-slate-655 dark:text-slate-350">System Currency</label>
                    <p className="text-[11px] text-slate-500 mb-2">Choose the currency rate to display in plan prices. Defaults to your local region based on IP.</p>
                    <select
                      value={selectedCurrencyCode || "AUTO"}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedCurrencyCode(val === "AUTO" ? null : val);
                        if (val === "AUTO") {
                          localStorage.removeItem('astra_currency');
                        } else {
                          localStorage.setItem('astra_currency', val);
                        }
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-darkCard border border-slate-200 dark:border-white/10 text-sm focus:border-slate-400 dark:focus:border-white/20 outline-none text-slate-800 dark:text-slate-200"
                    >
                      <option value="AUTO" className="bg-white dark:bg-[#212121]">
                        🌐 Auto Detect ({autoCurrencyInfo.code} - {autoCurrencyInfo.symbol})
                      </option>
                      {ALL_CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code} className="bg-white dark:bg-[#212121]">
                          {c.flag} {c.label} ({c.code} - {c.symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {settingsActiveTab === "developer" && (
                <div className="animate-fade-in max-w-xl">
                  <h2 className="text-xl font-medium text-slate-800 dark:text-white mb-2">Developer Keys</h2>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-6 pb-4 border-b border-slate-200 dark:border-white/5">Configure the AI models by providing your secure Groq LLM API Key.</p>

                  <div className="mb-8">
                    <h3 className="text-[14px] text-slate-800 dark:text-white font-medium mb-3">Backend LLM API Key (Groq)</h3>
                    <form onSubmit={handleSaveLlmKey} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] text-slate-650 dark:text-slate-300 font-medium">Add Groq API Key</label>
                        <input
                          type="password"
                          value={llmApiKeyInput}
                          onChange={(e) => setLlmApiKeyInput(e.target.value)}
                          placeholder="gsk_..."
                          className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-[#2f2f2f] border border-slate-200 dark:border-transparent focus:border-slate-400 dark:focus:border-white/20 outline-none text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      </div>
                      <div className="flex justify-start mt-1">
                        <button type="submit" disabled={!llmApiKeyInput.trim()} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full text-sm font-medium transition-all flex items-center gap-2">
                          <Plus size={16} /> Save LLM Key
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[14px] text-slate-800 dark:text-white font-medium border-t border-slate-200 dark:border-white/5 pt-6">Active Connection Keys</h3>

                    <div className="flex flex-col">
                      {llmApiKey ? (
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center py-4 border-b border-slate-200 dark:border-white/5 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[14px] text-emerald-600 dark:text-emerald-400 font-medium">Backend LLM Key (Groq)</span>
                            <span className="font-mono text-[11px] text-slate-500 mt-0.5">
                              {llmApiKey.substring(0, 8)}••••••••••••••••
                            </span>
                          </div>
                          <button onClick={handleRemoveLlmKey} className="px-3 py-1.5 border border-slate-200 dark:border-white/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg text-[13px] font-medium transition-colors">
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="text-[13px] text-slate-500 py-4">No active keys found. Chat is disabled.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {settingsActiveTab === "account" && (
                <div className="animate-fade-in max-w-xl">
                  <h2 className="text-xl font-medium text-slate-800 dark:text-white mb-6 pb-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                    <span>Account</span>
                    {!!user?.is_admin && (
                      <span className="text-[10px] font-bold px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full uppercase tracking-wider select-none">
                        Platform (Owner)
                      </span>
                    )}
                  </h2>

                  <div className="flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between py-4 border-b border-slate-200 dark:border-white/5 gap-2">
                      <span className="text-[14px] text-slate-800 dark:text-white font-medium">Display Name</span>
                      <span className="text-[14px] text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        {profileName || "Not set"}
                        {!!user?.is_admin && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-slate-300 dark:text-slate-300 font-mono">ADMIN</span>}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between py-4 border-b border-slate-200 dark:border-white/5 gap-2">
                      <span className="text-[14px] text-slate-800 dark:text-white font-medium">Username</span>
                      <span className="text-[14px] text-slate-700 dark:text-slate-300">@{profileUsername || "not_set"}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between py-4 border-b border-slate-200 dark:border-white/5 gap-2">
                      <span className="text-[14px] text-slate-800 dark:text-white font-medium">
                        {user?.is_admin ? "Primary Owner Email" : "Registered Email"}
                      </span>
                      <span className="text-[14px] text-slate-700 dark:text-slate-300 font-mono">{user?.email || "Unknown"}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between py-4 border-b border-white/5 gap-2">
                      <span className="text-[14px] text-slate-800 dark:text-white font-medium">Subscription Tier</span>
                      {user?.is_admin ? (
                        <span className="text-[14px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">
                          Platform Owner (Unlimited)
                        </span>
                      ) : (
                        <span className="text-[14px] text-slate-700 dark:text-slate-300 capitalize font-semibold">
                          {user?.subscription_tier}
                        </span>
                      )}
                    </div>



                    {user?.created_at && (
                      <div className="flex flex-col sm:flex-row justify-between py-4 border-b border-slate-200 dark:border-white/5 gap-2">
                        <span className="text-[14px] text-slate-800 dark:text-white font-medium">
                          {user?.is_admin ? "Owner Since" : "Member Since"}
                        </span>
                        <span className="text-[14px] text-slate-700 dark:text-slate-300">
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
                    {!!user?.is_admin && (
                      <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-slate-200 dark:border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Root Owner System Metadata</span>
                          <span className="px-2 py-0.5 rounded bg-white/10 text-slate-300 font-medium text-[9px] uppercase tracking-wider font-mono">Super Admin Access</span>
                        </div>
                        <div className="space-y-1.5 text-[11px] text-slate-400 leading-relaxed font-mono">
                          <div>• Node Authority: Full read, write, update, and database access</div>
                          <div>• Telemetry Database: Local SQLite (astra_ai_local.db)</div>
                          <div>• Platform Status: Unrestricted VIP Enterprise Access Active</div>
                        </div>
                      </div>
                    )}

                    {!user?.is_admin && (
                      <>
                        <div className="mt-4 mb-2">
                          <h3 className="text-sm font-semibold text-rose-500 dark:text-rose-400">Danger Zone</h3>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between py-4 border-b border-slate-200 dark:border-white/5 gap-4">
                          <div>
                            <span className="block text-[14px] text-slate-800 dark:text-white font-medium">Clear history</span>
                            <span className="block text-[13px] text-slate-550 dark:text-slate-400 mt-0.5 max-w-[280px]">Permanently purge all chat logs, streaming sessions, and message elements.</span>
                          </div>
                          <button onClick={handleDeleteSettingsHistory} className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-full text-[13px] font-medium transition-all whitespace-nowrap self-start sm:self-center">
                            Clear
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between py-4 border-b border-slate-200 dark:border-white/5 gap-4">
                          <div>
                            <span className="block text-[14px] text-slate-800 dark:text-white font-medium">Delete account</span>
                            <span className="block text-[13px] text-slate-550 dark:text-slate-400 mt-0.5 max-w-[280px]">Permanently delete your profile account, credentials, and connection keys.</span>
                          </div>
                          <button onClick={handleDeleteAccount} className="px-4 py-2 border border-rose-500/30 hover:bg-rose-500/10 text-rose-500 rounded-full text-[13px] font-medium transition-all whitespace-nowrap self-start sm:self-center">
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}




            </div>
          </div>
        </div>
      )}

      {/* Workspace Library Modal */}
      {isLibraryModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 dark:bg-black/75 backdrop-blur-[2px] px-4 py-8 animate-fade-in">
          <div className="w-full max-w-4xl h-[80vh] bg-white dark:bg-[#151515] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-[#181818]">
              <div className="flex items-center gap-3">
                <Image className="text-sky-500 shrink-0" size={22} />
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Workspace Library</h2>
              </div>
              <button
                onClick={() => setIsLibraryModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 flex items-center justify-center text-slate-650 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content section */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-slate-200 dark:border-white/5 px-6 bg-slate-50 dark:bg-[#1e1e1e] shrink-0">
                <button
                  type="button"
                  onClick={() => setLibraryActiveTab("images")}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${libraryActiveTab === "images"
                    ? "border-sky-500 text-sky-500 dark:text-sky-400 font-bold"
                    : "border-transparent text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                    }`}
                >
                  Images & Photos
                </button>
                <button
                  type="button"
                  onClick={() => setLibraryActiveTab("files")}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${libraryActiveTab === "files"
                    ? "border-sky-500 text-sky-500 dark:text-sky-400 font-bold"
                    : "border-transparent text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                    }`}
                >
                  Attached Files & PDFs
                </button>
              </div>

              {/* Grid Scroll */}
              <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-[#151515] scrollbar">
                {libraryActiveTab === "images" ? (
                  getLibraryItems().images.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12">
                      <Image size={40} className="text-slate-350 dark:text-slate-650 mb-3" />
                      <span className="text-sm font-medium">No images or photos found in history.</span>
                      <span className="text-xs text-slate-400 mt-1">Upload images or generate them with "/image [prompt]".</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {getLibraryItems().images.map((item, idx) => (
                        <div key={idx} className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#1e1e1e] flex flex-col shadow-sm">
                          <div className="aspect-square overflow-hidden bg-black/10 flex items-center justify-center">
                            <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop"; }} />
                          </div>
                          <div className="p-3 flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-slate-700 dark:text-white truncate" title={item.name}>{item.name}</span>
                            <span className="text-[10px] text-slate-450 dark:text-slate-500 truncate mt-0.5" title={item.sessionTitle}>Chat: {item.sessionTitle}</span>
                          </div>
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSessionId(item.sessionId);
                                setIsLibraryModalOpen(false);
                              }}
                              className="px-3 py-1.5 bg-sky-500 text-white rounded-lg text-xs font-semibold hover:bg-sky-600 transition-colors"
                            >
                              Go to chat
                            </button>
                            <a
                              href={item.url}
                              download={item.name}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center"
                            >
                              <Download size={14} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  getLibraryItems().files.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12">
                      <FileText size={40} className="text-slate-350 dark:text-slate-650 mb-3" />
                      <span className="text-sm font-medium">No files or PDF documents found in history.</span>
                      <span className="text-xs text-slate-400 mt-1">Files you upload for analysis will appear here.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getLibraryItems().files.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#1e1e1e] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                              <FileText size={18} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-semibold text-slate-800 dark:text-white truncate" title={item.name}>{item.name}</span>
                              <span className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5 truncate">From Chat: {item.sessionTitle} · {new Date(item.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSessionId(item.sessionId);
                                setIsLibraryModalOpen(false);
                              }}
                              className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 rounded-lg text-xs font-semibold transition-colors"
                            >
                              Go to chat
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Preview Modal Overlay */}
      {isPreviewLightboxOpen && uploadedFileUrl && (
        <div
          onClick={() => setIsPreviewLightboxOpen(false)}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 px-4 py-8 animate-fade-in cursor-default"
        >
          <div className="relative max-w-4xl w-full flex items-center justify-center pointer-events-none">
            <img
              src={uploadedFileUrl}
              alt="Full size preview"
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl animate-scale-up border border-white/10"
            />
            <button
              onClick={() => setIsPreviewLightboxOpen(false)}
              className="absolute -top-10 right-0 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all pointer-events-auto cursor-pointer"
              title="Close preview"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Custom Dialog Modal */}
      {dialogConfig && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-6">
              <h3 className={`text-lg font-semibold mb-2 flex items-center gap-2 ${dialogConfig.danger ? "text-rose-600 dark:text-rose-400" : "text-slate-800 dark:text-white"}`}>
                {dialogConfig.danger && <AlertTriangle size={18} />}
                {dialogConfig.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                {dialogConfig.message}
              </p>

              {dialogConfig.type === "prompt" && (
                <div className="mb-6">
                  <label className="block text-xs text-slate-555 dark:text-slate-400 mb-2">Type <span className="font-mono text-slate-700 dark:text-white">'{dialogConfig.promptExpected}'</span> below to confirm:</label>
                  <input
                    type="text"
                    id="dialog-prompt-input"
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-[#2f2f2f] border border-slate-200 dark:border-white/10 focus:border-rose-500/50 outline-none text-sm text-slate-800 dark:text-white font-mono"
                    placeholder={dialogConfig.promptExpected}
                    autoComplete="off"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 mt-8">
                {dialogConfig.type !== "alert" && (
                  <button
                    onClick={() => setDialogConfig(null)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    {dialogConfig.cancelText || "Cancel"}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (dialogConfig.type === "prompt") {
                      const val = document.getElementById("dialog-prompt-input")?.value;
                      if (val !== dialogConfig.promptExpected) {
                        return; // do nothing if wrong
                      }
                    }
                    if (dialogConfig.onConfirm) dialogConfig.onConfirm();
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${dialogConfig.danger
                    ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20"
                    : "bg-white hover:bg-slate-200 text-black shadow-lg shadow-black/10"
                    }`}
                >
                  {dialogConfig.confirmText || "OK"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add Account Modal Overlay (Log in or sign up) */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
          <div className="w-full max-w-[380px] bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl p-6 relative flex flex-col text-center font-sans animate-slide-up text-white">
            <button
              onClick={() => setIsAddAccountModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl font-semibold mt-4 mb-2 text-white">Log in or sign up</h3>
            <p className="text-[13px] text-slate-400 mb-6 px-2">
              You'll get smarter responses and can upload files, images, and more.
            </p>

            <div className="w-full space-y-3">
              <button
                type="button"
                onClick={handleAddAccountGoogleSignIn}
                className="w-full py-3 px-4 rounded-full bg-transparent hover:bg-white/5 border border-zinc-700 hover:border-zinc-500 text-sm font-medium transition-all flex items-center justify-center gap-3 text-white"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={() => alert("Apple sign-in is not configured for local development.")}
                className="w-full py-3 px-4 rounded-full bg-transparent hover:bg-white/5 border border-zinc-700 hover:border-zinc-500 text-sm font-medium transition-all flex items-center justify-center gap-3 text-white"
              >
                <svg className="w-4 h-4 text-white fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.05 2.95.72 3.67 1.84-3.04 1.77-2.56 5.86.36 7.04-.68 1.73-1.62 3.28-2.68 4.13zm-3.61-13.62c.49-1.92-1.04-3.83-2.91-4.06-.57 2.04 1.34 3.86 2.91 4.06z" />
                </svg>
                <span>Continue with Apple</span>
              </button>

              <button
                type="button"
                onClick={() => alert("Phone sign-in is not configured for local development.")}
                className="w-full py-3 px-4 rounded-full bg-transparent hover:bg-white/5 border border-zinc-700 hover:border-zinc-500 text-sm font-medium transition-all flex items-center justify-center gap-3 text-white"
              >
                <svg className="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Continue with phone</span>
              </button>
            </div>

            <div className="flex items-center my-5">
              <div className="flex-1 border-t border-zinc-800"></div>
              <span className="px-3 text-xs text-zinc-500 font-medium tracking-wider">OR</span>
              <div className="flex-1 border-t border-zinc-800"></div>
            </div>

            {addAccountMode === "email" && (
              <form onSubmit={handleAddAccountSubmit} className="space-y-4 text-left">
                <div>
                  <input
                    type="email"
                    required
                    value={addAccountEmail}
                    onChange={(e) => setAddAccountEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full px-4 py-3 rounded-full bg-black border border-zinc-700 text-white placeholder:text-zinc-500 outline-none focus:border-zinc-500 transition-all text-sm"
                  />
                </div>
                {addAccountError && (
                  <p className="text-rose-500 text-xs px-2">{addAccountError}</p>
                )}
                <button
                  type="submit"
                  disabled={addAccountLoading}
                  className="w-full py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-slate-200 transition-all cursor-pointer flex items-center justify-center"
                >
                  {addAccountLoading ? "Please wait..." : "Continue"}
                </button>
              </form>
            )}

            {addAccountMode === "otp" && (
              <form onSubmit={handleAddAccountVerifySubmit} className="space-y-4 text-left">
                <p className="text-xs text-zinc-400 text-center mb-2">
                  We sent a 6-digit code to <b className="text-white">{addAccountEmail}</b>
                </p>
                <div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={addAccountOtp}
                    onChange={(e) => setAddAccountOtp(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="Enter 6-digit code"
                    className="w-full px-4 py-3 rounded-full bg-black border border-zinc-700 text-white placeholder:text-zinc-500 outline-none focus:border-zinc-500 transition-all text-sm text-center tracking-[0.5em] font-mono text-lg"
                  />
                </div>
                {addAccountError && (
                  <p className="text-rose-500 text-xs px-2">{addAccountError}</p>
                )}
                <button
                  type="submit"
                  disabled={addAccountLoading}
                  className="w-full py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-slate-200 transition-all cursor-pointer flex items-center justify-center"
                >
                  {addAccountLoading ? "Verifying..." : "Verify and Login"}
                </button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setAddAccountMode("email");
                      setAddAccountError("");
                    }}
                    className="text-xs text-zinc-400 hover:text-white underline mt-2"
                  >
                    Back to Email
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default DashboardPage;
