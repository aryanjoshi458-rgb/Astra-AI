/**
 * userApi.js — User Profile & Account API Services
 *
 * Covers:
 *  - Fetch user profile
 *  - Update profile (name, avatar, username)
 *  - Change password
 *  - Activity heartbeat
 *  - Developer API keys (list / create / revoke)
 *  - Delete account
 */

import ApiClient from "./api";

// ─── Profile ───────────────────────────────────────────────────────────────────

/**
 * Fetch the currently authenticated user's profile.
 * @returns {Promise<Object>} user profile data
 */
export const getUserProfile = () => ApiClient.get("/api/user/profile");

/**
 * Update the user's profile details.
 * @param {Object} updates
 * @param {string} [updates.fullName]
 * @param {string} [updates.avatarUrl]
 * @param {string} [updates.username]
 * @returns {Promise<Object>} updated user profile
 */
export const updateUserProfile = ({ fullName, avatarUrl, username } = {}) => {
  const payload = {};
  if (fullName !== undefined) payload.full_name = fullName;
  if (avatarUrl !== undefined) payload.avatar_url = avatarUrl;
  if (username !== undefined) payload.username = username;
  return ApiClient.put("/api/user/profile", payload);
};

/**
 * Change the user's password.
 * @param {string} oldPassword
 * @param {string} newPassword
 */
export const changePassword = (oldPassword, newPassword) =>
  ApiClient.put("/api/user/password", {
    old_password: oldPassword,
    new_password: newPassword,
  });

// ─── Activity Heartbeat ────────────────────────────────────────────────────────

/**
 * Send a 30-second activity heartbeat to keep total_time_spent up to date.
 * Call this on a 30-second interval while the user has the tab open.
 */
export const sendHeartbeat = () => ApiClient.post("/api/user/heartbeat", {});

// ─── Developer API Keys ────────────────────────────────────────────────────────

/**
 * Get all developer API keys for the current user.
 * @returns {Promise<Array>}
 */
export const getApiKeys = () => ApiClient.get("/api/user/keys");

/**
 * Generate a new developer API key.
 * Returns the raw key ONCE — it won't be shown again.
 * @param {string} name — Friendly label for the key
 * @returns {Promise<Object>} key record with raw_key field
 */
export const createApiKey = (name = "Default Key") =>
  ApiClient.post("/api/user/keys", { name });

/**
 * Revoke (permanently delete) a developer API key by ID.
 * @param {number} keyId
 */
export const revokeApiKey = (keyId) => ApiClient.delete(`/api/user/keys/${keyId}`);

// ─── Account Deletion ─────────────────────────────────────────────────────────

/**
 * Request account deletion. Marks account as pending deletion.
 * Does NOT immediately remove the account.
 */
export const deleteUserAccount = () => ApiClient.delete("/api/user/account");
