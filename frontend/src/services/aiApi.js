/**
 * aiApi.js — AI Feature API Services
 *
 * Covers:
 *  - Image Generation (via Pollinations.ai — no API key needed)
 *  - Image Analysis / Vision (upload image + prompt)
 *  - PDF Analysis (upload PDF for text extraction)
 *
 * Note: Image generation happens inside the chat stream (/api/chat/.../stream)
 * using special prefixes like "/image" or "/draw". The helpers below are for
 * direct file upload-based AI analysis endpoints.
 */

import ApiClient from "./api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ─── Image Generation (Pollinations.ai) ───────────────────────────────────────

/**
 * Build a Pollinations.ai image URL for a given text prompt.
 * This does NOT make an API call — the URL itself fetches the image.
 *
 * Usage in JSX:
 *   <img src={buildImageGenerationUrl("a sunset over mountains")} alt="generated" />
 *
 * @param {string} prompt — The image description / prompt
 * @param {Object} options
 * @param {number} [options.width=1024]
 * @param {number} [options.height=1024]
 * @param {number} [options.seed] — Random if not specified
 * @returns {string} image URL
 */
export const buildImageGenerationUrl = (prompt, { width = 1024, height = 1024, seed } = {}) => {
  const encodedPrompt = encodeURIComponent(prompt);
  const randomSeed = seed ?? Math.floor(Math.random() * 999999) + 1;
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${randomSeed}&nologo=true`;
};

/**
 * Ask the AI to generate an image via the chat stream endpoint.
 * Use chat message prefixes: "/image <prompt>", "/draw <prompt>", etc.
 * This is handled automatically inside the chat stream — no separate call needed.
 *
 * Supported prefixes (backend handles):
 *   /image, /draw, /generate, "generate image ...", "create image ...", "draw ..."
 */
export const IMAGE_GENERATION_PREFIXES = ["/image", "/draw", "/generate"];

// ─── Image Analysis (Vision) ──────────────────────────────────────────────────

/**
 * Upload and analyze an image file using AI vision.
 * @param {File} imageFile — The image file object (from <input type="file">)
 * @param {string} [prompt="Describe this image"] — Custom analysis prompt
 * @returns {Promise<{filename, prompt, description}>}
 */
export const analyzeImage = async (imageFile, prompt = "Describe this image") => {
  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("prompt", prompt);

  const token = localStorage.getItem("astra_token");
  const response = await fetch(`${API_BASE_URL}/api/ai/analyze-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token || ""}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Image analysis failed");
  }
  return response.json();
};

// ─── PDF Analysis ──────────────────────────────────────────────────────────────

/**
 * Upload and analyze a PDF document using AI text extraction.
 * @param {File} pdfFile — The PDF file object (from <input type="file">)
 * @returns {Promise<{filename, char_count, preview, full_text}>}
 */
export const analyzePDF = async (pdfFile) => {
  const formData = new FormData();
  formData.append("file", pdfFile);

  const token = localStorage.getItem("astra_token");
  const response = await fetch(`${API_BASE_URL}/api/ai/analyze-pdf`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token || ""}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "PDF analysis failed");
  }
  return response.json();
};

// ─── Google Translate Helpers ─────────────────────────────────────────────────
// These mirror the backend detect_language / translate_text calls.
// They call Google Translate's public (no-auth) endpoint.

/**
 * Detect the language of a text snippet via Google Translate API.
 * @param {string} text
 * @returns {Promise<string>} BCP-47 language code, e.g. "en", "hi"
 */
export const detectLanguage = async (text) => {
  try {
    const encoded = encodeURIComponent(text.slice(0, 200));
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encoded}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.length > 2) return data[2];
  } catch {
    // fallback
  }
  return "en";
};

/**
 * Translate text from English to a target language via Google Translate API.
 * @param {string} text — Source text (English)
 * @param {string} targetLang — BCP-47 target language code, e.g. "hi"
 * @returns {Promise<string>} translated text
 */
export const translateText = async (text, targetLang) => {
  if (targetLang === "en") return text;
  try {
    const encoded = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encoded}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data?.[0]) {
      return data[0].map((s) => s?.[0] ?? "").join("");
    }
  } catch {
    // fallback to original
  }
  return text;
};
