import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import AstraLogo from "../components/AstraLogo";
import { useGoogleLogin } from "@react-oauth/google";

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
const GitHubIcon = () => (
  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);
const AppleIcon = () => (
  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.05 2.95.72 3.67 1.84-3.04 1.77-2.56 5.86.36 7.04-.68 1.73-1.62 3.28-2.68 4.13zm-3.61-13.62c.49-1.92-1.04-3.83-2.91-4.06-.57 2.04 1.34 3.86 2.91 4.06z" />
  </svg>
);

export const AuthPages = ({ onNavigate, initialMode = "login" }) => {
  const { requestOTP, verifyOTP, googleLogin, authError, isLoading } = useAuth();
  
  const [mode, setMode] = useState(initialMode); // login, register, otp_verify
  const [authAction, setAuthAction] = useState(initialMode === "register" ? "register" : "login");
  
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [otpArray, setOtpArray] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef(null);
  const inputRefs = useRef([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    setResendTimer(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (index, value) => {
    const cleanValue = value.replace(/[^0-9]/g, "");
    if (!cleanValue) {
      const newOtp = [...otpArray];
      newOtp[index] = "";
      setOtpArray(newOtp);
      setOtpCode(newOtp.join(""));
      return;
    }

    const char = cleanValue.substring(cleanValue.length - 1);
    const newOtp = [...otpArray];
    newOtp[index] = char;
    setOtpArray(newOtp);
    setOtpCode(newOtp.join(""));

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otpArray[index] && index > 0) {
        const newOtp = [...otpArray];
        newOtp[index - 1] = "";
        setOtpArray(newOtp);
        setOtpCode(newOtp.join(""));
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otpArray];
        newOtp[index] = "";
        setOtpArray(newOtp);
        setOtpCode(newOtp.join(""));
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").substring(0, 6);
    if (pastedData) {
      const newOtp = [...otpArray];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedData[i] || "";
      }
      setOtpArray(newOtp);
      setOtpCode(pastedData);
      
      const focusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    try {
      setErrorMsg("");
      await requestOTP(email, authAction);
      startTimer();
    } catch (err) {
      setErrorMsg(err.message || "Failed to resend OTP.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    try {
      if (mode === "login" || mode === "register") {
        await requestOTP(email, authAction);
        setMode("otp_verify");
        setOtpArray(["", "", "", "", "", ""]);
        setOtpCode("");
        startTimer();
      } else if (mode === "otp_verify") {
        await verifyOTP(email, otpCode);
        onNavigate("dashboard");
      }
    } catch (err) {
      setErrorMsg(err.message || "Operation failed. Please try again.");
    }
  };

  const handleGoogleSignIn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setErrorMsg("");
        await googleLogin(tokenResponse.access_token);
        onNavigate("dashboard");
      } catch (err) {
        setErrorMsg(err.message || "Google Authentication failed.");
      }
    },
    onError: () => {
      setErrorMsg("Google Login failed. Please try again.");
    }
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-300 flex flex-col justify-center items-center px-4 font-sans">
      <div className="w-full max-w-[340px] flex flex-col items-center">
        
        {/* Brand Title */}
        <div className="flex flex-col items-center gap-1.5 mb-6 cursor-pointer" onClick={() => onNavigate("landing")}>
          <AstraLogo size={42} className="text-white" />
          <span className="text-xl font-medium tracking-widest text-white">ASTRA AI</span>
          <span className="text-sm font-medium hover-sweep-shine">Think Beyond Limits</span>
        </div>

        {/* Social Buttons */}
        <div className="w-full space-y-3 mb-8">
          <button onClick={handleGoogleSignIn} className="w-full py-2.5 px-4 rounded-md bg-[#1a1a1a] hover:bg-[#242424] border border-[#2a2a2a] text-sm font-medium transition-colors flex items-center justify-center gap-3 text-[#ededed]">
            <GoogleIcon /> Sign in with Google
          </button>
          <button className="w-full py-2.5 px-4 rounded-md bg-[#1a1a1a] hover:bg-[#242424] border border-[#2a2a2a] text-sm font-medium transition-colors flex items-center justify-center gap-3 text-[#ededed]">
            <GitHubIcon /> Sign in with GitHub
          </button>
          <button className="w-full py-2.5 px-4 rounded-md bg-[#1a1a1a] hover:bg-[#242424] border border-[#2a2a2a] text-sm font-medium transition-colors flex items-center justify-center gap-3 text-[#ededed]">
            <AppleIcon /> Sign in with Apple
          </button>
        </div>

        {/* Errors display */}
        {(errorMsg || authError) && (
          <div className="w-full mb-4 p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {errorMsg || authError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col">
          {mode === "otp_verify" ? (
            <div className="space-y-3 text-left w-full mb-6">
              <label className="text-[13px] font-medium text-[#888]">Verification Code</label>
              <div className="flex justify-between gap-2.5" onPaste={handleOtpPaste}>
                {otpArray.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-12 text-center text-lg font-semibold rounded-lg bg-[#111] border border-[#2a2a2a] focus:border-[#555] outline-none transition-all text-white focus:shadow-md focus:shadow-white/5"
                  />
                ))}
              </div>
              <div className="flex justify-between items-center text-xs mt-2 px-0.5">
                <span className="text-[#555]">6-digit OTP code</span>
                {resendTimer > 0 ? (
                  <span className="text-[#555]">Resend code in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="text-sky-400 hover:text-sky-300 hover:underline font-medium transition-colors"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className={`flex gap-3 w-full overflow-hidden transition-all duration-400 ease-in-out ${mode === "register" ? "max-h-[100px] opacity-100 mb-3" : "max-h-0 opacity-0 mb-0"}`}>
                <div className="space-y-2 text-left w-1/2">
                  <label className="text-[13px] font-medium text-[#888]">First name</label>
                  <input
                    type="text"
                    required={mode === "register"}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full px-3 py-2.5 rounded-md bg-transparent border border-[#2a2a2a] focus:border-[#555] outline-none text-sm transition-colors text-white placeholder:text-[#555]"
                  />
                </div>
                <div className="space-y-2 text-left w-1/2">
                  <label className="text-[13px] font-medium text-[#888]">Last name</label>
                  <input
                    type="text"
                    required={mode === "register"}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full px-3 py-2.5 rounded-md bg-transparent border border-[#2a2a2a] focus:border-[#555] outline-none text-sm transition-colors text-white placeholder:text-[#555]"
                  />
                </div>
              </div>
              <div className="space-y-2 text-left w-full mb-4">
                <label className="text-[13px] font-medium text-[#888]">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full px-3 py-2.5 rounded-md bg-transparent border border-[#2a2a2a] focus:border-[#555] outline-none text-sm transition-colors text-white placeholder:text-[#555]"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading || (mode === "otp_verify" && otpCode.length !== 6)}
            className="w-full py-2.5 rounded-md bg-[#ededed] hover:bg-white text-black font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Authenticating..." : mode === "otp_verify" ? "Verify code" : mode === "register" ? "Sign up" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-sm text-[#888]">
          {mode === "register" ? (
            <>Already have an account? <button onClick={() => { setMode("login"); setAuthAction("login"); }} className="text-[#ededed] hover:underline">Sign in</button></>
          ) : mode === "otp_verify" ? (
            <button onClick={() => { setMode("login"); setAuthAction("login"); }} className="text-[#ededed] hover:underline">Back to login</button>
          ) : (
            <>Don't have an account? <button onClick={() => { setMode("register"); setAuthAction("register"); }} className="text-[#ededed] hover:underline">Sign up</button></>
          )}
        </div>

        <div className="mt-6 text-[11px] text-[#555] cursor-pointer hover:text-[#888] transition-colors">
          Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  );
};
export default AuthPages;
