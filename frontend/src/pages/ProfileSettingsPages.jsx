import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  ArrowLeft, User, Shield, Key, Settings, Lock, Trash2, Plus, Check, Copy, AlertTriangle, Eye, EyeOff, Sparkles
} from "lucide-react";
import ApiClient from "../services/api";

export const ProfileSettingsPages = ({ onNavigate }) => {
  const { user, updateProfile, logout } = useAuth();
  
  // Tabs: profile, security, developer, danger
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("astra_settings_active_tab") || "profile";
  });

  // Profile form states
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // API keys states
  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keyError, setKeyError] = useState("");

  // LLM API Key state
  const [llmApiKey, setLlmApiKey] = useState(() => localStorage.getItem("llm_api_key") || "");
  const [savedLlmKey, setSavedLlmKey] = useState(false);


  const handleSaveLlmKey = (e) => {
    e.preventDefault();
    localStorage.setItem("llm_api_key", llmApiKey);
    setSavedLlmKey(true);
    setTimeout(() => setSavedLlmKey(false), 2000);
  };

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setUsername(user.username || "");
      setAvatarUrl(user.avatar_url || "");
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("astra_settings_active_tab", activeTab);
    if (activeTab === "developer") {
      fetchApiKeys();
    }
  }, [activeTab]);

  const fetchApiKeys = async () => {
    try {
      setKeysLoading(true);
      const keys = await ApiClient.get("/api/user/keys");
      setApiKeys(keys);
    } catch (err) {
      console.error(err);
    } finally {
      setKeysLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess("");
    setProfileError("");
    setSavingProfile(true);
    try {
      await updateProfile(fullName, avatarUrl, username || undefined);
      setProfileSuccess("Profile updated successfully!");
    } catch (err) {
      setProfileError(err.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess("");
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      await ApiClient.put("/api/user/password", {
        old_password: oldPassword,
        new_password: newPassword
      });
      setPasswordSuccess("Password updated successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err.message || "Failed to update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setKeyError("");
    setGeneratedKey(null);

    try {
      const result = await ApiClient.post("/api/user/keys", { name: newKeyName });
      setGeneratedKey(result.raw_key);
      setNewKeyName("");
      fetchApiKeys();
    } catch (err) {
      setKeyError(err.message || "Failed to create API key.");
    }
  };

  const handleRevokeKey = async (keyId) => {
    if (!confirm("Are you sure you want to revoke this API key? Applications using it will lose access immediately.")) {
      return;
    }
    try {
      await ApiClient.delete(`/api/user/keys/${keyId}`);
      fetchApiKeys();
    } catch (err) {
      alert("Failed to revoke API key.");
    }
  };

  const handleCopyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleDeleteHistory = async () => {
    if (!confirm("WARNING: This will permanently delete ALL your chat history. This action cannot be undone. Do you want to proceed?")) {
      return;
    }
    try {
      await ApiClient.delete("/api/chat/sessions");
      alert("All chat history has been cleared.");
    } catch (err) {
      alert("Failed to delete chat history.");
    }
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const menuItems = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "security", label: "Security & Password", icon: Lock },
    { id: "developer", label: "Developer Keys", icon: Key },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle }
  ];

  return (
    <div className="min-h-screen bg-theme text-theme-primary flex flex-col font-sans">
      {/* Top Header Navigation */}
      <header className="px-6 py-4 border-b border-white/5 bg-darkCard/60 backdrop-blur-xl flex items-center justify-between z-10">
        <button
          onClick={() => onNavigate("dashboard")}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>
        <span className="font-semibold text-sm tracking-wider uppercase text-sky-400 flex items-center gap-1.5 select-none">
          <Settings size={14} />
          Astra User Settings
        </span>
        <div className="w-16" />
      </header>

      <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8 overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-white/5 pr-0 md:pr-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  isActive 
                    ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" 
                    : "hover:bg-white/5 text-slate-400 hover:text-white border border-transparent"
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Dynamic Settings View Area */}
        <main className="flex-1 bg-darkCard/30 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-md overflow-y-auto">
          
          {/* TAB 1: USER PROFILE */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Profile Settings</h2>
                <p className="text-xs text-slate-450 mt-1">Manage your public information and avatar branding.</p>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Avatar Uploader UI */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b border-white/5">
                  <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 relative group">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={36} className="text-white/60" />
                    )}
                  </div>
                  <div className="space-y-2 text-center sm:text-left w-full sm:w-auto">
                    <h3 className="text-sm font-medium text-white">Profile Avatar Image</h3>
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <label className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white cursor-pointer transition-all">
                        Upload Image file
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
                      </label>
                      {avatarUrl && (
                        <button 
                          type="button" 
                          onClick={() => setAvatarUrl("")}
                          className="px-4 py-2 border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-semibold transition-all"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">Supports PNG, JPG, or SVG. Base64 conversion will automatically compile.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-2.5 rounded-xl bg-darkBg border border-white/10 text-xs focus:border-sky-500/50 outline-none text-slate-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400">Username (Handle)</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. johndoe123"
                      className="w-full px-4 py-2.5 rounded-xl bg-darkBg border border-white/10 text-xs focus:border-sky-500/50 outline-none text-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Direct Avatar Link URL (Optional)</label>
                  <input
                    type="url"
                    value={avatarUrl && !avatarUrl.startsWith("data:") ? avatarUrl : ""}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                    className="w-full px-4 py-2.5 rounded-xl bg-darkBg border border-white/10 text-xs focus:border-sky-500/50 outline-none text-slate-200"
                  />
                </div>

                {profileSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                    <Check size={14} />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {profileError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs flex items-center gap-2">
                    <AlertTriangle size={14} />
                    <span>{profileError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 bg-white hover:bg-slate-100 text-black rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {savingProfile ? "Saving Profile..." : "Save Profile Details"}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: SECURITY & PASSWORD */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Security & Password</h2>
                <p className="text-xs text-slate-450 mt-1">Keep your account credentials secure by updating your password credentials.</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Current Password</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-darkBg border border-white/10 text-xs focus:border-sky-500/50 outline-none text-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-darkBg border border-white/10 text-xs focus:border-sky-500/50 outline-none text-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-darkBg border border-white/10 text-xs focus:border-sky-500/50 outline-none text-slate-200"
                  />
                </div>

                {passwordSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                    <Check size={14} />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs flex items-center gap-2">
                    <AlertTriangle size={14} />
                    <span>{passwordError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-6 py-2.5 bg-white hover:bg-slate-100 text-black rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {savingPassword ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: DEVELOPER API KEYS */}
          {activeTab === "developer" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Developer API Keys</h2>
                <p className="text-xs text-slate-450 mt-1">
                  Integrate Astra AI directly into your Python scripts or web platforms using secure hashed access keys.
                </p>
              </div>

              {/* LLM Provider Key Form */}
              <form onSubmit={handleSaveLlmKey} className="glass-card p-5 border border-sky-500/20 bg-sky-500/5 rounded-2xl space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-sky-400" />
                    AI Provider Configuration (Groq / OpenAI)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter your Groq API Key to power Astra AI. This key is stored securely in your local browser storage.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="password"
                    value={llmApiKey}
                    onChange={(e) => setLlmApiKey(e.target.value)}
                    placeholder="gsk_xxxxxxxxxxxxxxxx"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-darkBg border border-white/10 text-xs focus:border-sky-500/50 outline-none text-slate-200"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    {savedLlmKey ? <Check size={16} /> : <Settings size={16} />}
                    <span>{savedLlmKey ? "Saved!" : "Save Key"}</span>
                  </button>
                </div>
              </form>

              {/* Generate New Key Form */}
              <form onSubmit={handleCreateKey} className="glass-card p-5 border border-white/5 rounded-2xl space-y-4">
                <h3 className="text-sm font-medium text-white">Generate Developer API Key</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    required
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. Local Python Connection"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-darkBg border border-white/10 text-xs focus:border-sky-500/50 outline-none text-slate-200"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    <span>Generate Key</span>
                  </button>
                </div>
                {keyError && <p className="text-xs text-rose-450 font-medium">{keyError}</p>}
              </form>

              {/* Newly Generated Key Alert Box */}
              {generatedKey && (
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                    <AlertTriangle size={16} />
                    <span>Copy your API Key now!</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    For security purposes, you can only view this key code once. Save it to a private password vault immediately.
                  </p>
                  <div className="flex items-center gap-2 bg-darkBg/80 p-2.5 rounded-xl border border-white/10">
                    <span className="font-mono text-xs text-slate-100 flex-1 truncate select-all">{generatedKey}</span>
                    <button
                      onClick={handleCopyKey}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedKey ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* API Keys Table */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">Active Connection API Keys</h3>
                {keysLoading ? (
                  <div className="text-center py-6 text-xs text-slate-500">Retrieving API keys...</div>
                ) : apiKeys.length === 0 ? (
                  <div className="text-center py-8 bg-darkBg/50 border border-white/5 rounded-2xl text-xs text-slate-550">
                    No keys found. Generate a key above to configure access.
                  </div>
                ) : (
                  <div className="border border-white/5 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-darkBg border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider">
                            <th className="p-4">Key Name</th>
                            <th className="p-4">Key Hash Identifier</th>
                            <th className="p-4">Created Date</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {apiKeys.map((k) => (
                            <tr key={k.id} className="hover:bg-white/5 text-slate-350">
                              <td className="p-4 font-medium text-slate-200">{k.name}</td>
                              <td className="p-4 font-mono text-[10px] text-slate-500">
                                {k.key_hash ? k.key_hash.substring(0, 16) + "..." : "N/A"}
                              </td>
                              <td className="p-4">
                                {k.created_at ? new Date(k.created_at).toLocaleDateString() : "N/A"}
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => handleRevokeKey(k.id)}
                                  className="px-2.5 py-1.5 rounded-lg border border-rose-500/20 text-rose-450 hover:bg-rose-500/10 transition-colors font-medium text-[10px]"
                                >
                                  Revoke
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DANGER ZONE */}
          {activeTab === "danger" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white text-rose-400">Danger Zone</h2>
                <p className="text-xs text-slate-450 mt-1">Irreversible account operations and clear logs options.</p>
              </div>

              <div className="space-y-4">
                {/* Clear chat history */}
                <div className="p-5 border border-rose-500/20 rounded-2xl bg-rose-500/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-200">Delete All Conversations History</h3>
                    <p className="text-[11px] text-slate-400">
                      Permanently purge all chat logs, streaming sessions, and message elements from PostgreSQL.
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteHistory}
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Clear History
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default ProfileSettingsPages;