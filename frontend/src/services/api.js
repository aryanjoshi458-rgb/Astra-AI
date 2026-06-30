const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_BASE_URL = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

class ApiClient {
  static getHeaders() {
    const token = localStorage.getItem("astra_token");
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Set headers
    const headers = options.isFormData
      ? { Authorization: `Bearer ${localStorage.getItem("astra_token") || ""}` }
      : { ...this.getHeaders(), ...options.headers };

    const config = {
      ...options,
      headers,
    };

    if (options.isFormData) {
      delete config.isFormData;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMsg = "Something went wrong";
        try {
          const errData = await response.json();
          errorMsg = errData.detail || errorMsg;
        } catch (_) {}
        throw new Error(errorMsg);
      }

      // If it's a PDF export or stream, we handle outside this wrapper
      if (config.headers["Accept"] === "application/pdf" || options.responseType === "blob") {
        return response;
      }

      return await response.json();
    } catch (error) {
      console.error(`API Request Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // HTTP Helper Methods
  static get(endpoint) {
    return this.request(endpoint, { method: "GET" });
  }

  static post(endpoint, body, isFormData = false) {
    return this.request(endpoint, {
      method: "POST",
      body: isFormData ? body : JSON.stringify(body),
      isFormData,
    });
  }

  static put(endpoint, body) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  static delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }

  // Custom fetch stream wrapper for SSE message generation
  static async getStream(endpoint, body, onChunk, assistantType = null, fileText = null) {
    const token = localStorage.getItem("astra_token");
    let url = `${API_BASE_URL}${endpoint}`;
    
    const params = [];
    if (assistantType) params.push(`assistant_type=${encodeURIComponent(assistantType)}`);
    if (fileText) params.push(`file_text_context=${encodeURIComponent(fileText)}`);
    
    if (params.length > 0) {
      url += `?${params.join("&")}`;
    }

    const llmApiKey = localStorage.getItem("llm_api_key");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token || ""}`,
        "X-LLM-API-Key": llmApiKey || ""
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      let errorMsg = "Failed to stream message";
      try {
        const errData = await response.json();
        errorMsg = errData.detail || errorMsg;
      } catch (_) {}
      throw new Error(errorMsg);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        const chunk = decoder.decode(value, { stream: !done });
        onChunk(chunk);
      }
    }
  }
}

export default ApiClient;
