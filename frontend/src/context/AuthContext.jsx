import React, { createContext, useState, useEffect, useContext } from "react";
import ApiClient from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("astra_token"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (token) {
      fetchUserProfile(token);
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async (authToken) => {
    try {
      setIsLoading(true);
      const profile = await ApiClient.get("/api/user/profile");
      setUser(profile);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (err) {
      console.error("Failed to load user profile:", err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email, fullName) => {
    try {
      setAuthError(null);
      setIsLoading(true);
      await ApiClient.post("/api/auth/register", { email, full_name: fullName });
      setIsLoading(false);
      return true;
    } catch (err) {
      setAuthError(err.message || "Registration failed");
      setIsLoading(false);
      throw err;
    }
  };

  const requestOTP = async (email, action = "login") => {
    try {
      setAuthError(null);
      await ApiClient.post("/api/auth/otp/request", { email, action });
      return true;
    } catch (err) {
      setAuthError(err.message || "OTP request failed");
      throw err;
    }
  };

  const verifyOTP = async (email, otpCode) => {
    try {
      setAuthError(null);
      setIsLoading(true);
      const data = await ApiClient.post("/api/auth/otp/verify", { email, otp_code: otpCode });
      localStorage.setItem("astra_token", data.access_token);
      setToken(data.access_token);
      await fetchUserProfile(data.access_token);
      return true;
    } catch (err) {
      setAuthError(err.message || "OTP verification failed");
      setIsLoading(false);
      throw err;
    }
  };

  const googleLogin = async (credential) => {
    try {
      setAuthError(null);
      setIsLoading(true);
      const data = await ApiClient.post("/api/auth/google", { credential });
      localStorage.setItem("astra_token", data.access_token);
      setToken(data.access_token);
      await fetchUserProfile(data.access_token);
      return true;
    } catch (err) {
      setAuthError(err.message || "Google Login failed");
      setIsLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("astra_token");
    localStorage.removeItem("astra_current_page");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    setAuthError(null);
  };

  const updateProfile = async (fullName, avatarUrl, username) => {
    try {
      const payload = { full_name: fullName, avatar_url: avatarUrl };
      if (username !== undefined && username !== null) payload.username = username;
      const updatedUser = await ApiClient.put("/api/user/profile", payload);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      console.error("Failed to update profile:", err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        authError,
        register,
        requestOTP,
        verifyOTP,
        googleLogin,
        logout,
        updateProfile,
        refreshProfile: () => fetchUserProfile(token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
