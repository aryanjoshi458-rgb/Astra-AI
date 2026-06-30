/**
 * chatApi.js — Chat Sessions & Messaging API Services
 *
 * Covers:
 *  - List / Get / Create chat sessions
 *  - Rename / Pin / Delete sessions
 *  - Stream AI responses (SSE)
 *  - Export chat log
 *  - Projects (Create / List / Delete / Assign)
 */

import ApiClient from "./api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ─── Chat Sessions ─────────────────────────────────────────────────────────────

/**
 * Get all chat sessions for the authenticated user.
 * @returns {Promise<Array>}
 */
export const getChatSessions = () => ApiClient.get("/api/chat/sessions");

/**
 * Get a specific chat session with its messages.
 * @param {number} sessionId
 * @returns {Promise<Object>}
 */
export const getChatSessionDetail = (sessionId) =>
  ApiClient.get(`/api/chat/sessions/${sessionId}`);

/**
 * Create a new chat session.
 * @param {string} title
 * @returns {Promise<Object>}
 */
export const createChatSession = (title = "New Chat") =>
  ApiClient.post("/api/chat/sessions", { title });

/**
 * Rename a chat session.
 * @param {number} sessionId
 * @param {string} newTitle
 */
export const renameChatSession = (sessionId, newTitle) =>
  ApiClient.put(`/api/chat/sessions/${sessionId}/rename`, { title: newTitle });

/**
 * Toggle pin state on a chat session.
 * @param {number} sessionId
 */
export const pinChatSession = (sessionId) =>
  ApiClient.put(`/api/chat/sessions/${sessionId}/pin`, {});

/**
 * Delete a specific chat session.
 * @param {number} sessionId
 */
export const deleteChatSession = (sessionId) =>
  ApiClient.delete(`/api/chat/sessions/${sessionId}`);

/**
 * Delete ALL chat sessions for the current user.
 */
export const deleteAllChatSessions = () => ApiClient.delete("/api/chat/sessions");

// ─── AI Message Streaming ─────────────────────────────────────────────────────

/**
 * Stream an AI response for a given chat session (SSE / chunked response).
 * @param {number} sessionId
 * @param {Object} params
 * @param {string} params.content — User message text
 * @param {string|null} params.fileUrl — Uploaded file URL (optional)
 * @param {string|null} params.fileType — MIME type of file (optional)
 * @param {string} params.modelUsed — Model name, e.g. "astra-gpt-4"
 * @param {string|null} params.assistantType — Custom assistant type (optional)
 * @param {string|null} params.fileTextContext — Extracted text from file (optional)
 * @param {function} onChunk — Called with each streamed text chunk
 */
export const streamChatMessage = (sessionId, params, onChunk) => {
  const { content, fileUrl, fileType, modelUsed, assistantType, fileTextContext } = params;
  return ApiClient.getStream(
    `/api/chat/sessions/${sessionId}/stream`,
    { content, file_url: fileUrl, file_type: fileType, model_used: modelUsed },
    onChunk,
    assistantType,
    fileTextContext
  );
};

// ─── Chat Export ───────────────────────────────────────────────────────────────

/**
 * Export a chat session as a downloadable text file.
 * Triggers browser file download automatically.
 * @param {number} sessionId
 */
export const exportChatLog = async (sessionId) => {
  const url = `${API_BASE_URL}/api/chat/sessions/${sessionId}/export`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("astra_token") || ""}`,
      Accept: "application/pdf",
    },
  });
  if (!response.ok) throw new Error("Failed to download chat export");
  const blob = await response.blob();
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = `Astra-AI-Chat-${sessionId}.txt`;
  link.click();
};

// ─── Projects ─────────────────────────────────────────────────────────────────

/**
 * Get all projects for the authenticated user.
 * @returns {Promise<Array>}
 */
export const getProjects = () => ApiClient.get("/api/projects");

/**
 * Create a new project.
 * @param {string} name
 * @returns {Promise<Object>}
 */
export const createProject = (name) => ApiClient.post("/api/projects", { name });

/**
 * Delete a project by ID.
 * @param {number} projectId
 */
export const deleteProject = (projectId) => ApiClient.delete(`/api/projects/${projectId}`);

/**
 * Assign a chat session to a project (or remove by passing null).
 * @param {number} sessionId
 * @param {number|null} projectId
 */
export const assignSessionToProject = (sessionId, projectId) =>
  ApiClient.put(`/api/chat/sessions/${sessionId}/project`, { project_id: projectId });
