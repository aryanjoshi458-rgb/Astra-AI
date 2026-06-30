import React, { createContext, useState, useEffect, useContext } from "react";
import ApiClient from "../services/api";
import { useAuth } from "./AuthContext";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(() => {
    const saved = localStorage.getItem("astra_active_session");
    if (saved) {
      return isNaN(saved) ? saved : Number(saved);
    }
    return null;
  });

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem("astra_active_session", activeSessionId);
    } else {
      localStorage.removeItem("astra_active_session");
    }
  }, [activeSessionId]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(() => {
    return !!localStorage.getItem("astra_active_session");
  });
  const [error, setError] = useState(null);

  // Auto-load sessions when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadSessions();
      loadProjects();
      const savedSessionId = localStorage.getItem("astra_active_session");
      if (savedSessionId) {
        const parsedId = isNaN(savedSessionId) ? savedSessionId : Number(savedSessionId);
        loadSessionDetail(parsedId, true);
      }
    } else if (!isLoading) {
      setSessions([]);
      setProjects([]);
      setCurrentSession(null);
      setActiveSessionId(null);
      localStorage.removeItem("astra_active_session");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading]);

  const loadProjects = async () => {
    try {
      const data = await ApiClient.get("/api/projects");
      setProjects(data);
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  const loadSessions = async () => {
    try {
      setSessionsLoading(true);
      const data = await ApiClient.get("/api/chat/sessions");
      setSessions(data);
    } catch (err) {
      console.error("Failed to load sessions:", err);
      setError("Failed to load conversation history.");
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadSessionDetail = async (sessionId, showLoading = true) => {
    try {
      if (showLoading) setMessagesLoading(true);
      const data = await ApiClient.get(`/api/chat/sessions/${sessionId}`);
      setCurrentSession(data);
      setActiveSessionId(sessionId);
    } catch (err) {
      console.error("Failed to load chat details:", err);
      setError("Failed to load chat messages.");
    } finally {
      if (showLoading) setMessagesLoading(false);
    }
  };

  const clearAllSessions = async () => {
    try {
      await ApiClient.delete("/api/chat/sessions");
      setSessions([]);
      setCurrentSession(null);
      setActiveSessionId(null);
    } catch (err) {
      console.error("Failed to clear chat sessions:", err);
      throw err;
    }
  };

  const createSession = async (title = "New Chat") => {
    try {
      const data = await ApiClient.post("/api/chat/sessions", { title });
      setSessions((prev) => [data, ...prev]);
      setActiveSessionId(data.id);
      setCurrentSession({ ...data, messages: [] });
      return data;
    } catch (err) {
      console.error("Failed to create chat session:", err);
      throw err;
    }
  };

  const renameSession = async (sessionId, newTitle) => {
    try {
      const data = await ApiClient.put(`/api/chat/sessions/${sessionId}/rename`, { title: newTitle });
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle } : s))
      );
      if (activeSessionId === sessionId) {
        setCurrentSession((prev) => ({ ...prev, title: newTitle }));
      }
      return data;
    } catch (err) {
      console.error("Failed to rename session:", err);
      throw err;
    }
  };

  const pinSession = async (sessionId) => {
    try {
      await ApiClient.put(`/api/chat/sessions/${sessionId}/pin`, {});
      await loadSessions();
      if (activeSessionId === sessionId) {
        setCurrentSession((prev) => prev ? { ...prev, is_pinned: !prev.is_pinned } : null);
      }
    } catch (err) {
      console.error("Failed to pin session:", err);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await ApiClient.delete(`/api/chat/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setCurrentSession(null);
        setActiveSessionId(null);
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
      throw err;
    }
  };

  const createProject = async (name) => {
    try {
      const data = await ApiClient.post("/api/projects", { name });
      setProjects((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      console.error("Failed to create project:", err);
      throw err;
    }
  };

  const deleteProject = async (projectId) => {
    try {
      await ApiClient.delete(`/api/projects/${projectId}`);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      await loadSessions(); // Refresh sessions since project_id might be set to NULL
    } catch (err) {
      console.error("Failed to delete project:", err);
      throw err;
    }
  };

  const assignSessionToProject = async (sessionId, projectId) => {
    try {
      await ApiClient.put(`/api/chat/sessions/${sessionId}/project`, { project_id: projectId });
      await loadSessions();
    } catch (err) {
      console.error("Failed to assign session to project:", err);
      throw err;
    }
  };

  const sendMessageStream = async ({
    content,
    fileUrl = null,
    fileType = null,
    fileTextContext = null,
    modelUsed = "astra-gpt-4",
    assistantType = null
  }) => {
    let sessionId = activeSessionId;

    try {
      setIsStreaming(true);
      setError(null);

      // If there is no active chat session, create one first synchronously
      if (!sessionId) {
        const newSess = await createSession();
        sessionId = newSess.id;
      }

      // 1. Optimistically append user message to local state
      const tempUserMsg = {
        id: Date.now(),
        session_id: sessionId,
        sender: "user",
        content,
        file_url: fileUrl,
        file_type: fileType,
        model_used: modelUsed,
        created_at: new Date().toISOString()
      };

      // 2. Append temporary assistant response structure
      const tempAsstMsg = {
        id: Date.now() + 1,
        session_id: sessionId,
        sender: "assistant",
        content: "",
        model_used: modelUsed,
        created_at: new Date().toISOString()
      };

      setCurrentSession((prev) => {
        const prevMsgs = prev && prev.id === sessionId ? (prev.messages || []) : [];
        return {
          id: sessionId,
          title: prev && prev.id === sessionId ? prev.title : "New Chat",
          messages: [...prevMsgs, tempUserMsg, tempAsstMsg]
        };
      });

      // 3. Connect to stream API endpoint
      let assistantText = "";
      let lastUpdateTime = 0;
      let updateTimeout = null;

      const triggerUIUpdate = (force = false) => {
        const now = Date.now();
        if (force || now - lastUpdateTime > 60) {
          lastUpdateTime = now;
          if (updateTimeout) {
            clearTimeout(updateTimeout);
            updateTimeout = null;
          }
          setCurrentSession((prev) => {
            if (!prev || prev.id !== sessionId) return prev;
            const updatedMsgs = [...prev.messages];
            const lastIdx = updatedMsgs.length - 1;
            if (lastIdx >= 0 && updatedMsgs[lastIdx].sender === "assistant") {
              updatedMsgs[lastIdx] = { ...updatedMsgs[lastIdx], content: assistantText };
            }
            return { ...prev, messages: updatedMsgs };
          });
        } else if (!updateTimeout) {
          updateTimeout = setTimeout(() => {
            triggerUIUpdate(true);
          }, 60);
        }
      };
      
      await ApiClient.getStream(
        `/api/chat/sessions/${sessionId}/stream`,
        { content, file_url: fileUrl, file_type: fileType, model_used: modelUsed },
        (chunk) => {
          assistantText += chunk;
          triggerUIUpdate();
        },
        assistantType,
        fileTextContext
      );

      triggerUIUpdate(true);
      if (updateTimeout) clearTimeout(updateTimeout);
      setIsStreaming(false);

      // 4. Stream completed successfully: reload sessions to update titles/messages
      await loadSessions();
      await loadSessionDetail(sessionId, false);
      
    } catch (err) {
      console.error("Error during streaming message:", err);
      setError("AI generation interrupted. Please try again.");
    } finally {
      setIsStreaming(false);
    }
  };

  const exportChatPDF = async (sessionId) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
      const url = `${cleanBaseUrl}/api/chat/sessions/${sessionId}/export`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("astra_token") || ""}`,
          "Accept": "application/pdf"
        }
      });
      if (!response.ok) throw new Error("Failed to download PDF");
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Astra-AI-Chat-${sessionId}.pdf`;
      link.click();
    } catch (err) {
      console.error("PDF export failed:", err);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        sessions,
        projects,
        currentSession,
        activeSessionId,
        isStreaming,
        sessionsLoading,
        messagesLoading,
        error,
        loadSessions,
        loadProjects,
        loadSessionDetail,
        createSession,
        renameSession,
        pinSession,
        deleteSession,
        createProject,
        deleteProject,
        assignSessionToProject,
        sendMessageStream,
        exportChatPDF,
        clearAllSessions,
        setActiveSessionId
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
