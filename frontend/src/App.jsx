import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ChatProvider } from "./context/ChatContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import LandingPage from "./pages/LandingPage";
import AuthPages from "./pages/AuthPages";
import DashboardPage from "./pages/DashboardPage";
import ProfileSettingsPages from "./pages/ProfileSettingsPages";
import AdminPanelPage from "./pages/AdminPanelPage";
import StaticPages from "./pages/StaticPages";

const AppContent = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  console.log("AppContent user:", user, "isAuthenticated:", isAuthenticated, "isLoading:", isLoading);

  // Custom router state: landing, login, register, dashboard, profile, admin, static page routes
  const [currentPage, setCurrentPage] = React.useState(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      localStorage.setItem("astra_current_page", hash);
      return hash;
    }
    const savedPage = localStorage.getItem("astra_current_page");
    return savedPage || "landing";
  });

  const navigateTo = (pageName) => {
    setCurrentPage(pageName);
    localStorage.setItem("astra_current_page", pageName);
    window.history.pushState({ page: pageName }, "", `#${pageName}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  React.useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        setCurrentPage(hash);
        localStorage.setItem("astra_current_page", hash);
      } else {
        setCurrentPage("landing");
        localStorage.setItem("astra_current_page", "landing");
      }
    };

    window.addEventListener("popstate", handlePopState);

    // Set initial hash if none exists to align URL with state
    if (!window.location.hash) {
      window.history.replaceState({ page: currentPage }, "", `#${currentPage}`);
    }

    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentPage]);

  React.useEffect(() => {
    if (currentPage !== "landing") return;
    // Increment page visitor count on server
    const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const API_BASE_URL = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
    fetch(`${API_BASE_URL}/api/analytics/visit`, { method: "POST" })
      .then(res => res.json())
      .then(data => console.log("Visitor analytics registered:", data))
      .catch(err => console.error("Failed to register visitor analytics:", err));
  }, [currentPage]);

  React.useEffect(() => {
    let title = "Astra AI | Think Beyond Limits - Premium AI Assistant Platform";
    let description = "Astra AI is the ultimate next-generation premium AI assistant platform. Engage in real-time advanced conversations, analyze documents/PDFs, write and debug code, search the web with live sources.";

    switch (currentPage) {
      case "landing":
        title = "Astra AI | Think Beyond Limits - Premium AI Assistant Platform";
        break;
      case "login":
        title = "Log In | Astra AI - Premium AI Assistant Platform";
        description = "Sign in to your Astra AI account to access custom AI agents, document scanning, real-time code generation, and premium tools.";
        break;
      case "register":
        title = "Sign Up & Register | Astra AI - Premium AI Assistant Platform";
        description = "Create a free Astra AI account and start talking to our premium AI assistant, analyze PDFs, write code, and configure custom agents.";
        break;
      case "dashboard":
        title = "Dashboard | Astra AI - Premium AI Assistant Platform";
        description = "Access your personal workspace, chat with AI, upload and search documents, and access settings.";
        break;
      case "profile":
        title = "Profile & Settings | Astra AI";
        break;
      case "pricing":
        title = "Pricing Plans & Subscriptions | Astra AI";
        description = "View pricing options and plans for Astra AI. Explore free tier, premium tier, and enterprise offerings for custom AI agents.";
        break;
      case "about":
        title = "About Us | Astra AI - Next-Gen Artificial Intelligence";
        description = "Learn more about Astra AI, our vision to push limits, and the team building premium AI assistant tools.";
        break;
      case "contact":
        title = "Contact Support | Astra AI";
        description = "Get in touch with the Astra AI customer support team for inquiries, billing assistance, feedback, or enterprise requests.";
        break;
      case "help":
        title = "Help & FAQs | Astra AI Documentation";
        description = "Find answers to frequently asked questions, tutorials, and configuration guides for Astra AI assistants.";
        break;
      default:
        break;
    }

    document.title = title;

    // Dynamically update the meta description tag
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    }

    // Dynamically update the Open Graph description tag
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute("content", description);
    }

    // Dynamically update Open Graph Title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute("content", title);
    }
  }, [currentPage]);

  React.useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // If logged in and on landing/login/register, auto-redirect to correct dashboard
        if (currentPage === "landing" || currentPage === "login" || currentPage === "register") {
          navigateTo(!!user?.is_admin ? "admin" : "dashboard");
        } else if (!!user?.is_admin && (currentPage === "dashboard" || currentPage === "admin-dashboard")) {
          // Redirect admin to admin panel hash
          navigateTo("admin");
        } else if (!user?.is_admin && (currentPage === "admin" || currentPage === "admin-dashboard")) {
          // Redirect normal user to standard dashboard hash
          navigateTo("dashboard");
        }
      } else {
        // If not logged in and on protected routes, redirect to login
        const protectedRoutes = ["dashboard", "admin-dashboard", "profile", "admin"];
        if (protectedRoutes.includes(currentPage)) {
          navigateTo("login");
        }
      }
    }
  }, [isAuthenticated, isLoading, currentPage, user]);

  // Auth Guard Helper
  const renderProtectedRoute = (Component, props = {}) => {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-theme flex items-center justify-center text-sm text-theme-muted">
          Authenticating session...
        </div>
      );
    }
    if (!isAuthenticated) {
      return <AuthPages onNavigate={navigateTo} initialMode="login" />;
    }
    return <Component onNavigate={navigateTo} {...props} />;
  };

  // Route controller mapping
  switch (currentPage) {
    case "landing":
      return <LandingPage onNavigate={navigateTo} />;

    case "login":
      return isAuthenticated ? (
        !!user?.is_admin ? (
          <AdminPanelPage onNavigate={navigateTo} />
        ) : (
          <DashboardPage onNavigate={navigateTo} />
        )
      ) : (
        <AuthPages onNavigate={navigateTo} initialMode="login" />
      );

    case "register":
      return isAuthenticated ? (
        !!user?.is_admin ? (
          <AdminPanelPage onNavigate={navigateTo} />
        ) : (
          <DashboardPage onNavigate={navigateTo} />
        )
      ) : (
        <AuthPages onNavigate={navigateTo} initialMode="register" />
      );

    case "dashboard":
      return renderProtectedRoute(DashboardPage);

    case "profile":
      return renderProtectedRoute(DashboardPage, { initialOpenSettings: true });

    case "admin":
      return renderProtectedRoute(AdminPanelPage);

    // Static pages
    case "pricing":
    case "about":
    case "contact":
    case "help":
      return <StaticPages page={currentPage} onNavigate={navigateTo} />;

    default:
      return <LandingPage onNavigate={navigateTo} />;
  }
};

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider>
        <AuthProvider>
          <ChatProvider>
            <AppContent />
          </ChatProvider>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
