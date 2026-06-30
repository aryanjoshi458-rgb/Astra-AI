import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Users, MessageSquare, Key, Shield, Zap, TrendingUp, AlertTriangle, UserMinus, ShieldAlert, Sparkles, Database, User, DollarSign, Percent, Save, RotateCcw, ChevronDown, CheckCircle } from "lucide-react";
import ApiClient from "../services/api";

export const AdminPanelPage = ({ onNavigate }) => {
  const { user } = useAuth();

  // Dashboard Analytics States
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

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
    <div className="min-h-screen bg-theme text-theme-primary flex flex-col font-sans">

      {/* Top Navbar */}
      <header className="px-6 py-4 border-b border-theme bg-theme-card/80 backdrop-blur-xl flex items-center justify-between z-10">
        <button
          onClick={() => onNavigate("dashboard")}
          className="flex items-center gap-2 text-sm text-theme-secondary hover:text-theme-primary transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>
        <span className="font-semibold text-sm tracking-wider uppercase text-theme-primary flex items-center gap-1.5 select-none">
          <Shield size={14} />
          Admin Telemetry Hub
        </span>
        <div className="w-16" />
      </header>

      {/* Tab Nav */}
      <div className="border-b border-theme px-6 flex gap-1 bg-theme-card/60">
        {[
          { id: "overview", label: "Overview", icon: Database },
          { id: "pricing", label: "Pricing Management", icon: DollarSign },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === tab.id
                  ? "border-white text-white"
                  : "border-transparent text-slate-400 hover:text-white"
                }`}
            >
              <Icon size={15} />{tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && loading && (
        <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
          Syncing system logs...
        </div>
      )}

      {activeTab === "overview" && error && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <AlertTriangle className="text-rose-400" size={32} />
          <p className="text-slate-400 text-sm">{error}</p>
          <button onClick={loadAdminData} className="px-4 py-2 bg-theme-primary text-theme-card rounded-lg text-xs font-medium">Retry Sync</button>
        </div>
      )}

      {activeTab === "overview" && !loading && !error && stats && (
        <div className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-8 overflow-y-auto">

          {/* Summary widgets grid */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              { label: "Total Users", val: stats.total_users, icon: Users, color: "text-theme-primary bg-theme-subtle" },
              { label: "Active Chats", val: stats.total_chats, icon: MessageSquare, color: "text-theme-primary bg-theme-subtle" },
              { label: "Total Messages", val: stats.total_messages, icon: Database, color: "text-theme-primary bg-theme-subtle" },
              { label: "Premium Tiers", val: stats.premium_users, icon: Sparkles, color: "text-theme-primary bg-theme-subtle" },
              { label: "Active API Keys", val: stats.active_keys, icon: Key, color: "text-theme-primary bg-theme-subtle" },
              { label: "Monthly API hits", val: stats.monthly_requests, icon: TrendingUp, color: "text-theme-primary bg-theme-subtle" }
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div key={idx} className="glass-card p-5 rounded-2xl border border-theme space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-theme-muted font-medium uppercase tracking-wider">{card.label}</span>
                    <div className={`w-7 h-7 rounded-lg ${card.color} flex items-center justify-center`}>
                      <Icon size={14} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-semibold text-theme-primary">{card.val}</h3>
                </div>
              );
            })}
          </div>

          {/* User Management Section */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-theme-primary">Registered System Users</h2>

            <div className="glass-card border border-theme rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-theme-card border-b border-theme text-theme-muted font-medium uppercase tracking-wider">
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
                  <tbody className="divide-y divide-theme">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-theme-subtle text-theme-secondary">
                        <td className="p-4 flex items-center gap-3">
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url}
                              alt=""
                              className="w-7 h-7 rounded-full border border-theme object-cover"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-theme-subtle border border-theme flex items-center justify-center shrink-0">
                              <User size={14} className="text-theme-primary" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium text-theme-primary flex items-center gap-1.5">
                              {u.full_name}
                              {u.deletion_requested_at && (
                                <span className="px-1.5 py-0.5 rounded bg-white/15 text-white text-[8px] font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
                                  <AlertTriangle size={8} /> Delete Req
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">{u.email}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium border border-theme bg-theme-subtle text-theme-primary uppercase tracking-wider">
                            {u.login_provider || 'email'}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-theme-secondary">
                          {formatTimeSpent(u.total_time_spent)}
                        </td>
                        <td className="p-4 font-mono text-theme-muted">
                          {formatLastActive(u.last_active_at)}
                        </td>
                        <td className="p-4">
                          <select
                            value={u.subscription_tier}
                            onChange={(e) => handleChangeUserTier(u.id, e.target.value)}
                            className="bg-theme-card border border-theme rounded px-2.5 py-1 text-xs outline-none text-theme-primary focus:border-theme"
                          >
                            <option value="free">Free</option>
                            <option value="premium">Premium</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        </td>
                        <td className="p-4">
                          {u.is_admin ? (
                            <span className="px-2 py-0.5 rounded bg-white text-black font-semibold text-[10px] border border-white">Admin</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-theme-subtle text-theme-secondary text-[10px]">User</span>
                          )}
                        </td>
                        <td className="p-4 font-mono">{u.api_key_limit} keys</td>
                        <td className="p-4">
                          {u.deletion_requested_at ? (
                            <div className="flex flex-col">
                              <span className="text-theme-primary font-semibold flex items-center gap-1">
                                Pending Deactivate
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">
                                Req: {new Date(u.deletion_requested_at).toLocaleDateString()}
                              </span>
                            </div>
                          ) : u.is_active ? (
                            <span className="text-theme-primary font-medium">Active</span>
                          ) : (
                            <span className="text-slate-400 font-medium">Deactivated</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleToggleUserStatus(u.id)}
                              className="px-3 py-1.5 rounded-lg font-medium text-[10px] border border-theme text-theme-primary hover:bg-theme-subtle transition-colors"
                            >
                              {u.is_active ? "Block Access" : "Grant Access"}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="px-3 py-1.5 rounded-lg font-medium text-[10px] border border-theme text-theme-secondary hover:bg-theme-subtle transition-colors"
                            >
                              Delete Account
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Active telemetry logging monitoring */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-theme-primary">Live Telemetry Chat Monitoring</h2>

            <div className="glass-card border border-theme rounded-2xl overflow-hidden p-6 space-y-4">
              <div className="flex gap-2 items-center text-xs text-theme-primary font-medium mb-2 select-none">
                <Zap size={14} className="animate-pulse" />
                <span>Showing 50 most recent active conversations across database sessions:</span>
              </div>

              <div className="space-y-2">
                {recentChats.length === 0 ? (
                  <div className="text-center py-6 text-xs text-theme-muted select-none">No conversation traffic recorded.</div>
                ) : (
                  recentChats.map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 rounded-xl bg-theme-subtle border border-theme text-xs text-theme-secondary hover:border-theme transition-all"
                    >
                      <div className="space-y-1">
                        <span className="font-medium text-theme-primary">{c.title}</span>
                        <div className="flex gap-4 text-[10px] text-slate-500">
                          <span>User ID: {c.user_id}</span>
                          <span>•</span>
                          <span className="font-mono">{c.user_email}</span>
                          <span>•</span>
                          <span>Updated: {new Date(c.updated_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div className="mt-2 sm:mt-0 px-2.5 py-1 rounded bg-theme-card border border-theme font-mono text-[10px] text-theme-primary shrink-0">
                        {c.message_count} Messages
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── Pricing Management Tab ── */}
      {activeTab === "pricing" && (
        <div className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8 overflow-y-auto">

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-white flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <DollarSign size={18} className="text-white" />
                </div>
                Pricing Management
              </h2>
              <p className="text-xs text-slate-500 ml-10">Configure base prices, display names, GST &amp; tax rates for each plan tier.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePricingReset}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-theme text-theme-secondary hover:bg-theme-subtle hover:text-theme-primary text-xs font-medium transition-all"
              >
                <RotateCcw size={13} /> Reset
              </button>
              <button
                onClick={handlePricingSave}
                disabled={pricingSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-semibold transition-all disabled:opacity-50"
              >
                {pricingSaving ? "Saving..." : pricingSaved ? <><CheckCircle size={13} /> Saved!</> : <><Save size={13} /> Save Changes</>}
              </button>
            </div>
          </div>

          {pricingError && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle size={14} /> {pricingError}
            </div>
          )}
          {pricingSaved && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs flex items-center gap-2">
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
                free:       { dot: "bg-white/50",  badge: "bg-white/10 text-white border border-white/10" },
                premium:    { dot: "bg-white",     badge: "bg-white/10 text-white border border-white/10" },
                enterprise: { dot: "bg-white",     badge: "bg-white text-black border border-white" },
              };
              const meta = tierMeta[plan.tier] || tierMeta.free;

              return (
                <div key={plan.tier} className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
                  {/* Plan Header */}
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
                    <div className={`w-2 h-2 rounded-full ${meta.dot}`} />
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${meta.badge}`}>
                      {plan.tier}
                    </span>
                    <span className="text-[11px] text-theme-muted font-mono">
                      Last updated: {plan.updated_at ? new Date(plan.updated_at).toLocaleString() : "Never"}
                    </span>
                  </div>

                  {/* Inputs */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Display Name */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Display Name</label>
                      <div className="relative p-[1.5px] rounded-xl overflow-hidden bg-theme-subtle transition-colors group">
                        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
                          <div className="absolute inset-[-300%] bg-[conic-gradient(from_0deg,transparent_60%,#38bdf8_80%,#3b82f6_90%,#818cf8_95%,transparent_100%)] animate-border-snake origin-center" />
                        </div>
                        <input
                          type="text"
                          value={plan.display_name}
                          onChange={e => handlePricingChange(plan.tier, "display_name", e.target.value)}
                          className="relative z-10 w-full bg-theme-card rounded-[10px] px-3 py-2.5 text-sm text-theme-primary outline-none placeholder:text-theme-muted"
                          placeholder="Plan display name"
                        />
                      </div>
                    </div>

                    {/* Base Price */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Base Price (USD/month)</label>
                      <div className="relative p-[1.5px] rounded-xl overflow-hidden bg-theme-subtle transition-colors group">
                        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
                          <div className="absolute inset-[-300%] bg-[conic-gradient(from_0deg,transparent_60%,#38bdf8_80%,#3b82f6_90%,#818cf8_95%,transparent_100%)] animate-border-snake origin-center" />
                        </div>
                        <div className="relative z-10 flex items-center bg-theme-card rounded-[10px] px-3 py-2.5 gap-1.5">
                          <span className="text-slate-500 text-sm">$</span>
                          <input
                            type="number" min="0" step="0.01"
                            value={plan.base_price_usd}
                            onChange={e => handlePricingChange(plan.tier, "base_price_usd", e.target.value)}
                            className="w-full bg-transparent text-sm text-white outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* GST Rate */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">GST / Tax Rate (%)</label>
                      <div className="relative p-[1.5px] rounded-xl overflow-hidden bg-theme-subtle transition-colors group">
                        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
                          <div className="absolute inset-[-300%] bg-[conic-gradient(from_0deg,transparent_60%,#38bdf8_80%,#3b82f6_90%,#818cf8_95%,transparent_100%)] animate-border-snake origin-center" />
                        </div>
                        <div className="relative z-10 flex items-center bg-theme-card rounded-[10px] px-3 py-2.5 gap-1.5">
                          <input
                            type="number" min="0" max="100" step="0.1"
                            value={plan.gst_rate}
                            onChange={e => handlePricingChange(plan.tier, "gst_rate", e.target.value)}
                            className="w-full bg-transparent text-sm text-white outline-none"
                          />
                          <span className="text-slate-500 text-sm">%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Price Breakdown */}
                  <div className="mx-6 mb-6 rounded-xl bg-theme-subtle border border-theme p-5">
                    <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest mb-4">Live Price Breakdown Preview</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "Base Price",         val: `$${subtotal.toFixed(2)}` },
                        { label: `GST (${gstRate}%)`,  val: `+$${taxAmt.toFixed(2)}` },
                        { label: "Total/month (USD)",  val: `$${totalUSD.toFixed(2)}` },
                        { label: "Est. INR Total",     val: `₹${Math.round(totalUSD * 83.5)}` },
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 py-2">
                          <span className="text-[10px] text-theme-muted">{item.label}</span>
                          <span className="text-xl font-bold text-theme-primary">{item.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {pricingDraft.length === 0 && (
            <div className="text-center py-16 text-theme-muted text-sm">
              No pricing configuration found. Restart the server to seed defaults.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default AdminPanelPage;
