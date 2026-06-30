/**
 * adminApi.js — Admin Panel API Services
 *
 * Covers:
 *  - System telemetry stats
 *  - User management (list / toggle status / upgrade subscription / delete)
 *  - Live traffic monitoring
 *  - Pricing configuration (get / update)
 *
 * ⚠️  All endpoints in this file require admin privileges.
 *    Non-admin requests will receive a 403 Forbidden response.
 */

import ApiClient from "./api";

// ─── Dashboard Stats ───────────────────────────────────────────────────────────

/**
 * Get system-wide telemetry stats for the admin dashboard.
 * @returns {Promise<{total_users, total_chats, total_messages, premium_users, active_keys, monthly_requests}>}
 */
export const getAdminStats = () => ApiClient.get("/api/admin/stats");

// ─── User Management ───────────────────────────────────────────────────────────

/**
 * List all registered users.
 * @returns {Promise<Array>}
 */
export const getAllUsers = () => ApiClient.get("/api/admin/users");

/**
 * Toggle a user's active/deactivated status.
 * @param {number} userId
 * @returns {Promise<Object>} updated user record
 */
export const toggleUserStatus = (userId) =>
  ApiClient.put(`/api/admin/users/${userId}/toggle-status`, {});

/**
 * Upgrade or downgrade a user's subscription tier.
 * @param {number} userId
 * @param {"free"|"premium"|"enterprise"} tier
 * @returns {Promise<Object>} updated user record
 */
export const updateUserSubscription = (userId, tier) =>
  ApiClient.put(`/api/admin/users/${userId}/subscription`, { tier });

/**
 * Permanently delete a user account and all related data.
 * @param {number} userId
 */
export const deleteUserAsAdmin = (userId) =>
  ApiClient.delete(`/api/admin/users/${userId}`);

// ─── Live Traffic Monitoring ───────────────────────────────────────────────────

/**
 * Get the 50 most recent chat sessions across all users (live monitor view).
 * @returns {Promise<Array>}
 */
export const getMonitoringChats = () => ApiClient.get("/api/admin/monitoring/chats");

// ─── Pricing Configuration ─────────────────────────────────────────────────────

/**
 * Get the current pricing configuration for all plans.
 * @returns {Promise<Array<{id, tier, display_name, base_price_usd, gst_rate, is_active}>>}
 */
export const getPricingConfig = () => ApiClient.get("/api/admin/pricing");

/**
 * Update pricing for one or more subscription plans.
 * @param {Array<{tier: string, display_name: string, base_price_usd: number, gst_rate: number}>} plans
 * @returns {Promise<Array>} updated plans list
 */
export const updatePricingConfig = (plans) =>
  ApiClient.put("/api/admin/pricing", { plans });
