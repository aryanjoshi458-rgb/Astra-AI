/**
 * services/index.js — Central Export for All API Services
 *
 * Import from here for clean, organized API access:
 *
 *   import { authApi, chatApi, userApi, adminApi, aiApi } from "../services";
 *
 *   // OR named imports:
 *   import { requestOTP, verifyOTP, googleLogin } from "../services";
 *
 * ─── Service Files ───────────────────────────────────────────────────────────
 *  api.js      → Base HTTP client (ApiClient class)
 *  authApi.js  → OTP login, Google login, register, classic login
 *  chatApi.js  → Chat sessions, messages, SSE stream, exports, projects
 *  userApi.js  → User profile, password, API keys, heartbeat, account deletion
 *  adminApi.js → Admin stats, user management, live monitor, pricing config
 *  aiApi.js    → Image generation, image/PDF analysis, translation helpers
 */

// Base client
export { default as ApiClient } from "./api";

// Auth API
export * as authApi from "./authApi";
export * from "./authApi";

// Chat API
export * as chatApi from "./chatApi";
export * from "./chatApi";

// User API
export * as userApi from "./userApi";
export * from "./userApi";

// Admin API
export * as adminApi from "./adminApi";
export * from "./adminApi";

// AI API
export * as aiApi from "./aiApi";
export * from "./aiApi";
