import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import AstraLogo from "../components/AstraLogo";
import { useChat } from "../context/ChatContext";
import { useTheme } from "../context/ThemeContext";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import {
  MessageSquare, Plus, Trash2, Pin, Download, Send, ArrowUp, SendHorizontal, Navigation, AudioLines, Paperclip, Mic, MicOff,
  Volume2, VolumeX, LogOut, Settings, Shield, User, FileText, Camera, Check, Palette,
  Search, Edit3, X, HelpCircle, Terminal, RefreshCw, Sparkles, BookOpen, PanelLeft, PanelLeftClose, ChevronDown, Zap,
  Folder, FolderPlus, MoreHorizontal, ChevronRight, Copy, ThumbsUp, ThumbsDown, Key, AlertTriangle
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

export const AdminDashboardPage = ({ onNavigate, initialOpenSettings = false }) => {
  const { user, logout, refreshProfile, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const {
    sessions, projects, currentSession, activeSessionId, isStreaming, sessionsLoading,
    messagesLoading, loadSessionDetail, createSession, renameSession, pinSession,
    deleteSession, createProject, deleteProject, assignSessionToProject, sendMessageStream, exportChatPDF, setActiveSessionId,
    clearAllSessions
  } = useChat();

  // Settings Modal States
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState("account");
  const [settingsApiKeys, setSettingsApiKeys] = useState([]);
  const [settingsNewKeyName, setSettingsNewKeyName] = useState("");
  const [settingsCustomKeyValue, setSettingsCustomKeyValue] = useState("");
  const [settingsGeneratedKey, setSettingsGeneratedKey] = useState(null);
  const [settingsCopiedKey, setSettingsCopiedKey] = useState(false);
  const [settingsKeysLoading, setSettingsKeysLoading] = useState(false);
  const [settingsKeyError, setSettingsKeyError] = useState("");

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

  const handleUpgradeTier = async (tier) => {
    showDialog({
      type: "confirm",
      title: "Upgrade Subscription",
      message: `Are you sure you want to upgrade your subscription to the ${tier.toUpperCase()} tier?`,
      confirmText: "Upgrade",
      onConfirm: async () => {
        closeDialog();
        try {
          setIsUpgrading(true);
          await ApiClient.put(`/api/admin/users/${user?.id}/subscription`, { tier });
          await refreshProfile();
          showDialog({ type: "alert", title: "Success", message: `Successfully updated subscription to ${tier.toUpperCase()}!`, onConfirm: closeDialog });
        } catch (err) {
          showDialog({ type: "alert", title: "Error", danger: true, message: "Failed to update subscription. Admins can update this dynamically.", onConfirm: closeDialog });
        } finally {
          setIsUpgrading(false);
        }
      }
    });
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
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAppearanceModalOpen, setIsAppearanceModalOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPersona, setSelectedPersona] = useState("general"); // general, coding, writer, translator, search
  const [selectedModel, setSelectedModel] = useState("astra-gpt-4"); // astra-gpt-4, astra-code-llama, gemma-7b, mixtral-8x7b

  // File Upload states
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [uploadedFileType, setUploadedFileType] = useState(null);
  const [uploadedFileText, setUploadedFileText] = useState(null);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

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

  // Projects / Folders states
  const [expandedProjects, setExpandedProjects] = useState([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
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
    const cleanedText = text.replace(/[#*`>_\-]/g, "");

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
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFileUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      if (file.name.endsWith(".pdf")) {
        // PDF analysis endpoint
        const data = await ApiClient.post("/api/ai/analyze-pdf", formData, true);
        setUploadedFileUrl("/mock/pdf-uploaded");
        setUploadedFileType("pdf");
        setUploadedFileText(data.full_text);
      } else if (/\.(png|jpe?g|webp)$/i.test(file.name)) {
        // Image visual OCR
        formData.append("prompt", "Analyze the layout elements of this user interface");
        const data = await ApiClient.post("/api/ai/analyze-image", formData, true);
        setUploadedFileUrl("/mock/image-uploaded");
        setUploadedFileType("image");
        setUploadedFileText(data.description);
      } else {
        throw new Error("Unsupported format. Please upload a PDF or an Image.");
      }
    } catch (err) {
      console.error(err);
      setUploadError(err.message || "File upload failed.");
    } finally {
      setIsFileUploading(false);
    }
  };

  const clearAttachment = () => {
    setUploadedFileUrl(null);
    setUploadedFileType(null);
    setUploadedFileText(null);
  };

  // Submit Prompts
  const handleSendPrompt = async (e) => {
    e.preventDefault();
    if (isStreaming) return;
    if (!chatInput.trim() && !uploadedFileText) return;

    const promptText = chatInput;
    setChatInput("");

    // Append context from uploads
    let contextPayload = null;
    let fileUrl = null;
    let fileType = null;
    if (uploadedFileText) {
      contextPayload = uploadedFileText;
      fileUrl = uploadedFileUrl;
      fileType = uploadedFileType;
      clearAttachment();
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
          ? "bg-accentBlue/10 border border-accentBlue/20 text-slate-900 dark:text-white"
          : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-white border border-transparent"
          }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <MessageSquare size={16} className={isActive ? "text-sky-400" : "text-slate-500 dark:text-white"} />
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
        <div className="flex flex-col flex-1 overflow-hidden w-full">

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
              className={`flex items-center gap-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-white transition-all text-sm font-medium ${isSidebarOpen ? "w-full justify-start px-3 py-2.5" : "w-9 h-9 justify-center p-0"}`}
              title="New chat"
            >
              <Plus size={18} className="shrink-0" />
              {isSidebarOpen && <span className="truncate">New chat</span>}
            </button>
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className={`flex items-center gap-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-white transition-all text-sm font-medium ${isSidebarOpen ? "w-full justify-start px-3 py-2.5" : "w-9 h-9 justify-center p-0"}`}
              title="Search chats"
            >
              <Search size={18} className="shrink-0" />
              {isSidebarOpen && <span className="truncate">Search chats</span>}
            </button>
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className={`flex items-center gap-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-white transition-all text-sm font-medium ${isSidebarOpen ? "w-full justify-start px-3 py-2.5" : "w-9 h-9 justify-center p-0"}`}
              title="New project"
            >
              <FolderPlus size={18} className="shrink-0" />
              {isSidebarOpen && <span className="truncate">New project</span>}
            </button>
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
              className="w-full mb-3 py-2 px-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 text-xs font-semibold transition-all flex items-center justify-center gap-2"
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
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">ADMIN</span>
                  </span>
                  <span className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold capitalize">Platform</span>
                </div>
              )}
            </div>

            {/* Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl py-1 z-50">
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setIsPlanModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-3 font-medium"
                >
                  <Zap size={16} className="text-slate-500 dark:text-white shrink-0" /> Upgrade Plan
                </button>
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setSettingsActiveTab("account");
                    setIsSettingsModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-3"
                >
                  <Settings size={16} className="text-slate-500 dark:text-white/70" /> Settings
                </button>
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setIsAppearanceModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-3"
                >
                  <Palette size={16} className="text-slate-500 dark:text-white/70" /> Appearance
                </button>
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-3"
                >
                  <User size={16} className="text-slate-500 dark:text-white/70" /> Profile
                </button>
                {!!user?.is_admin && (
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      onNavigate("admin");
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-3 font-medium"
                  >
                    <Shield size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" /> Admin Panel
                  </button>
                )}
                <div className="my-1 border-t border-slate-200 dark:border-white/5"></div>
                <button onClick={() => logout()} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-white hover:bg-rose-500/10 flex items-center gap-3">
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
        {/* Top Right Action Menu */}
        {activeSessionId && currentSession && (
          <div className="absolute top-2 right-5 z-50 flex items-center gap-2">
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
            <AstraLogo size={56} className="text-slate-900 dark:text-white mb-6" />
            <h1 className="text-2xl font-normal text-slate-800 dark:text-white">
              {greeting}
            </h1>
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
                      <div className={`group relative max-w-[85%] md:max-w-[75%] ${isUser ? "bg-indigo-600 text-white dark:bg-[#2f2f2f] dark:text-white rounded-[24px] px-5 py-3 shadow-sm" : "text-slate-800 dark:text-white py-2 w-full"}`}>
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

            {/* Attachment preview area */}
            {uploadedFileUrl && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-indigo-400" />
                  <span className="font-medium text-slate-300">File attached successfully: ready to analyze.</span>
                </div>
                <button onClick={clearAttachment} className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white">
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Error notifications */}
            {uploadError && (
              <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/10 text-xs text-rose-400">
                {uploadError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSendPrompt} className="relative bg-white dark:bg-[#2f2f2f] rounded-3xl p-3 shadow-sm border border-slate-400 dark:border-transparent focus-within:border-slate-600 dark:focus-within:border-white/10 transition-colors flex flex-col gap-2">

              {/* Text Input area */}
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendPrompt(e);
                  }
                }}
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
                    className="p-1.5 rounded-full text-slate-500 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center justify-center"
                    title="Upload context PDF or Image"
                  >
                    <Plus size={20} className={isFileUploading ? "animate-spin" : ""} />
                  </button>

                  {isAttachmentDropdownOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-36 bg-white dark:bg-[#2f2f2f] border border-slate-200 dark:border-white/5 rounded-xl shadow-2xl py-1 z-50 animate-fade-in">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAttachmentDropdownOpen(false);
                          handleFileUploadClick();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-2"
                      >
                        <Camera size={14} /> Media
                      </button>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
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
                    type={(chatInput.trim() || uploadedFileText) ? "submit" : "button"}
                    disabled={isStreaming}
                    onClick={(e) => {
                      if (!chatInput.trim() && !uploadedFileText) {
                        e.preventDefault();
                        triggerVoiceInput();
                      }
                    }}
                    className={`w-8 h-8 rounded-full transition-all flex items-center justify-center bg-white text-black hover:bg-slate-200 shadow-lg ${isVoiceInputActive ? "animate-pulse bg-rose-500 text-white hover:bg-rose-600" : ""}`}
                  >
                    {(!chatInput.trim() && !uploadedFileText) ? (
                      <VoiceWaveIcon size={18} className="" />
                    ) : (
                      <ArrowUp size={18} strokeWidth={2.5} />
                    )}
                  </button>
                </div>
              </div>
            </form>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md px-4 animate-fade-in">
          <div className="w-full max-w-4xl bg-[#1e1e1e]/90 border border-white/10 rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col relative max-h-[90vh] overflow-y-auto scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                  <Zap size={22} className="text-white fill-white animate-pulse" /> Upgrade Your Plan
                </h2>
                <p className="text-xs md:text-sm text-slate-400 mt-1">
                  Choose the plan that fits your workflow. Current Plan: <span className="text-white font-semibold uppercase">{user?.subscription_tier}</span>
                </p>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  tier: "free",
                  name: "Free Plan",
                  price: "$0",
                  period: "/month",
                  desc: "Perfect for exploring the core AI chat controls.",
                  features: [
                    "5 standard chats per day",
                    "Standard text models",
                    "API key creations (max 5 keys)",
                    "Community support"
                  ]
                },
                {
                  tier: "premium",
                  name: "Premium Upgrade",
                  price: "$2",
                  period: "/month",
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
                {
                  tier: "enterprise",
                  name: "Enterprise Upgrade",
                  price: "$4",
                  period: "/month",
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
              ].map((p) => {
                const isCurrent = user?.subscription_tier === p.tier;
                return (
                  <div
                    key={p.tier}
                    className={`glass-card p-6 rounded-2xl flex flex-col relative transition-all border ${isCurrent
                      ? "border-white bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.08)]"
                      : p.popular
                        ? "border-white/20 bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.03)]"
                        : "border-white/5 hover:border-white/20 bg-white/5"
                      }`}
                  >
                    {isCurrent && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">
                        Current Plan
                      </span>
                    )}
                    {!isCurrent && p.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white/80 text-black font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    )}

                    <h3 className="text-lg font-bold text-white mb-1 mt-1">{p.name}</h3>
                    <p className="text-[11px] text-slate-400 min-h-[32px] leading-relaxed mb-4">{p.desc}</p>

                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-3xl font-extrabold text-white">{p.price}</span>
                      <span className="text-xs text-slate-400">{p.period}</span>
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {p.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <Check size={14} className="text-white shrink-0 mt-0.5" />
                          <span className="leading-tight">{feat}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => !isCurrent && handleUpgradeTier(p.tier)}
                      disabled={isCurrent || isUpgrading}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${isCurrent
                        ? "bg-white/5 text-slate-500 cursor-default"
                        : p.popular
                          ? "bg-white hover:bg-slate-200 text-black shadow-lg shadow-white/5 active:scale-98"
                          : "bg-white/10 hover:bg-white/20 text-white active:scale-98"
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
      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-[1px] px-4 animate-fade-in">
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
                <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center overflow-hidden border-2 border-slate-200 dark:border-white/10">
                  {(!profileAvatar && !user?.avatar_url) || avatarError ? (
                    <User size={36} className="text-slate-300 dark:text-white/30" />
                  ) : (
                    <img src={profileAvatar || user?.avatar_url} alt="Profile" className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="text-xs text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors font-medium flex items-center gap-1.5"
                >
                  <Camera size={12} /> Change Photo
                </button>
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
                  className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-[1px] px-4 animate-fade-in">
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
                      ? "bg-indigo-50 border-indigo-200 text-indigo-900 dark:bg-white/10 dark:border-white/20 dark:text-white"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-[#252525] dark:border-white/5 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:border-white/10"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{label}</span>
                    {theme === mode && (
                      <span className="text-xs font-semibold bg-indigo-600 text-white dark:bg-white dark:text-black px-2 py-0.5 rounded-full">Active</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
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
                  onClick={() => setSettingsActiveTab("account")}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all ${settingsActiveTab === "account"
                    ? "bg-slate-200 text-slate-900 dark:bg-[#2f2f2f] dark:text-white font-semibold"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                    }`}
                >
                  <User size={18} className="shrink-0" /> Account
                </button>
                <button
                  onClick={() => setSettingsActiveTab("about")}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all ${settingsActiveTab === "about"
                    ? "bg-slate-200 text-slate-900 dark:bg-[#2f2f2f] dark:text-white font-semibold"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                    }`}
                >
                  <HelpCircle size={18} className="shrink-0" /> About
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 bg-white dark:bg-[#212121] overflow-y-auto p-6 sm:p-8 scrollbar">

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
                        {!!user?.is_admin && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono">ADMIN</span>}
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
                        <span className="text-[14px] text-slate-700 dark:text-slate-300 capitalize flex items-center gap-2 cursor-pointer hover:text-slate-900 dark:hover:text-white">
                          {user?.subscription_tier} <ChevronDown size={14} className="text-slate-500" />
                        </span>
                      )}
                    </div>



                    {user?.created_at && (
                      <div className="flex flex-col sm:flex-row justify-between py-4 border-b border-slate-200 dark:border-white/5 gap-2">
                        <span className="text-[14px] text-slate-800 dark:text-white font-medium">
                          {user?.is_admin ? "Owner Since" : "Member Since"}
                        </span>
                        <span className="text-[14px] text-slate-700 dark:text-slate-300">{new Date(user.created_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    {!!user?.is_admin && (
                      <div className="mt-6 p-4 rounded-2xl bg-indigo-500/5 border border-slate-200 dark:border-white/5 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-indigo-400 font-semibold uppercase tracking-wider">Root Owner System Metadata</span>
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-medium text-[9px] uppercase tracking-wider font-mono">Super Admin Access</span>
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
                          <button onClick={handleDeleteAccount} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-full text-[13px] font-medium transition-all whitespace-nowrap self-start sm:self-center">
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {settingsActiveTab === "about" && (
                <div className="animate-fade-in max-w-xl space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-white/5">
                    <AstraLogo size={32} className="text-slate-900 dark:text-white" />
                    <div>
                      <h2 className="text-xl font-medium text-slate-800 dark:text-white">Astra AI Workspace</h2>
                      <span className="text-[11px] text-indigo-650 dark:text-indigo-400 font-mono tracking-wider">v1.2.0 (Stable release)</span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Astra AI is a next-generation local cognitive workspace. It empowers developers and users with instant hybrid model execution, seamless OCR PDF extraction, visual analysis capabilities, and dedicated active telemetry tools.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {[
                      { title: "Hybrid Engine", desc: "Dual execution modes via fallback endpoints & Groq keys." },
                      { title: "OCR PDF Ingestion", desc: "Lightweight, pure-python document context text parser." },
                      { title: "Multi-Model Matrix", desc: "Interchangeable reasoning models (Llama, Gemma, Mixtral)." },
                      { title: "Real-time Telemetry", desc: "Heartbeat monitoring with active user tracking." }
                    ].map((feat, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-1">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">{feat.title}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-450 block leading-relaxed">{feat.desc}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row justify-between text-[11px] text-slate-450 dark:text-slate-500 gap-2">
                    <span>Designed by Astra AI Group. Think Beyond Limits.</span>
                    <span>© 2026 Astra AI. All rights reserved.</span>
                  </div>
                </div>
              )}
            </div>
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
                  className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-all ${dialogConfig.danger
                    ? "bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/20"
                    : "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
                    }`}
                >
                  {dialogConfig.confirmText || "OK"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminDashboardPage;
