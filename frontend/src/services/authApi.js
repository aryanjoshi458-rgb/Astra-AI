/**
 * authApi.js — Authentication API Services
 * 
 * Covers:
 *  - OTP Request & Verify (Email-based login/register)
 *  - Classic Email+Password Login
 *  - User Registration
 *  - Google OAuth Login
 *  - Logout
 */

import ApiClient from "./api";

// ─── OTP-Based Auth ────────────────────────────────────────────────────────────

/**
 * Request an OTP code to the user's email.
 * @param {string} email
 * @param {"login"|"register"} action
 */
export const requestOTP = (email, action = "login") =>
  ApiClient.post("/api/auth/otp/request", { email, action });

/**
 * Verify the OTP code entered by the user.
 * Returns { access_token, token_type } on success.
 * @param {string} email
 * @param {string} otpCode — 6-digit code
 */
export const verifyOTP = (email, otpCode) =>
  ApiClient.post("/api/auth/otp/verify", { email, otp_code: otpCode });

// ─── Classic Login / Register ──────────────────────────────────────────────────

/**
 * Classic email + password login.
 * Returns { access_token, token_type } on success.
 * @param {string} email
 * @param {string} password
 */
export const classicLogin = (email, password) =>
  ApiClient.post("/api/auth/login/classic", { email, password });

/**
 * Register a new user account.
 * @param {string} email
 * @param {string} password
 * @param {string} fullName
 */
export const registerUser = (email, password, fullName) =>
  ApiClient.post("/api/auth/register", { email, password, full_name: fullName });

// ─── Google OAuth ──────────────────────────────────────────────────────────────

/**
 * Login / Register using a Google credential token (access_token from @react-oauth/google).
 * Returns { access_token, token_type } on success.
 * @param {string} credential — Google access token or ID token
 */
export const googleLogin = (credential) =>
  ApiClient.post("/api/auth/google", { credential });
