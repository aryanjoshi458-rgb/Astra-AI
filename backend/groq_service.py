"""
groq_service.py — Groq AI API Service for Astra AI Backend

Handles:
  - Groq API client initialization using the user-supplied API key
  - Model name mapping (frontend model IDs → Groq model IDs)
  - Streaming chat completions via OpenAI-compatible Groq endpoint
  - Image generation URL building via Pollinations.ai (free, no key required)

Groq API Docs: https://console.groq.com/docs/openai
Pollinations Docs: https://pollinations.ai
"""

import urllib.parse
import random


# ─── Model Mapping ─────────────────────────────────────────────────────────────

# Maps frontend model IDs (sent by client) to real Groq model identifiers
GROQ_MODEL_MAP = {
    "astra-gpt-4":       "llama-3.1-8b-instant",   # Default fast model
    "astra-code-llama":  "llama3-70b-8192",          # Large model for coding tasks
    "gemma-7b":          "gemma2-9b-it",              # Google Gemma 2
    "mixtral-8x7b":      "mixtral-8x7b-32768",        # Mixtral long context
}

DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant"

# ─── System Prompt ─────────────────────────────────────────────────────────────

ASTRA_SYSTEM_PROMPT = (
    "You are Astra AI, an intelligent, fast, and helpful assistant. "
    "You were created by the Astra AI team and launched on 23 June 2026. "
    "CRITICAL RULE: You MUST reply in the EXACT SAME LANGUAGE the user uses. "
    "If they speak English, reply ONLY in English. "
    "If they speak Hindi, reply ONLY in Hindi. "
    "If they use Hinglish, reply in Hinglish. "
    "Do NOT mix languages unless the user does. "
    "Be extremely helpful, concise, and professional. "
    "Always act like a real person, using emojis where appropriate. "
    "Do not use markdown unless formatting code or lists."
)

# ─── Groq Client Builder ──────────────────────────────────────────────────────

def build_groq_client(api_key: str):
    """
    Build and return an OpenAI-compatible client pointed at the Groq API.

    Args:
        api_key: The user's Groq API key (from X-LLM-API-Key request header)

    Returns:
        OpenAI client configured for Groq, or None if openai package is missing
    """
    try:
        from openai import OpenAI
        return OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=api_key,
        )
    except ImportError:
        print(
            "[Groq] 'openai' package not installed. Run: pip install openai",
            flush=True,
        )
        return None


def resolve_groq_model(frontend_model_id: str) -> str:
    """
    Translate a frontend model identifier to the real Groq model name.

    Args:
        frontend_model_id: Model ID from the client request (e.g. "astra-gpt-4")

    Returns:
        Groq API model name string
    """
    return GROQ_MODEL_MAP.get(frontend_model_id, DEFAULT_GROQ_MODEL)


# ─── Streaming Chat ───────────────────────────────────────────────────────────

def stream_groq_response(client, model_id: str, message_history: list):
    """
    Create a streaming Groq chat completion.

    Args:
        client: Groq-compatible OpenAI client (from build_groq_client)
        model_id: Groq model name (use resolve_groq_model() to get this)
        message_history: List of {"role": "user"|"assistant"|"system", "content": str}
                         Include the system prompt as the first message.

    Yields:
        str — text chunks as they stream from the API

    Example:
        for chunk in stream_groq_response(client, "llama-3.1-8b-instant", messages):
            print(chunk, end="", flush=True)
    """
    stream = client.chat.completions.create(
        model=model_id,
        messages=message_history,
        stream=True,
        temperature=0.7,
        max_tokens=2048,
    )
    for chunk in stream:
        delta_content = chunk.choices[0].delta.content
        if delta_content is not None:
            yield delta_content


def build_messages_for_groq(history_rows, user_content: str) -> list:
    """
    Build the messages array required by the Groq API from DB history rows.

    Args:
        history_rows: DB rows with 'sender' and 'content' fields (recent history)
        user_content: The new user message to append at the end

    Returns:
        List of {"role": ..., "content": ...} dicts
    """
    messages = [{"role": "system", "content": ASTRA_SYSTEM_PROMPT}]
    for msg in history_rows:
        role = "user" if msg["sender"] == "user" else "assistant"
        messages.append({"role": role, "content": msg["content"]})
    messages.append({"role": "user", "content": user_content})
    return messages


# ─── Image Generation (Pollinations.ai) ───────────────────────────────────────

def build_pollinations_image_url(
    prompt: str,
    width: int = 1024,
    height: int = 1024,
    seed: int = None,
) -> str:
    """
    Build a Pollinations.ai image generation URL.
    The URL itself serves as the image — no additional API call needed.

    Args:
        prompt: Image description text
        width: Output image width in pixels (default 1024)
        height: Output image height in pixels (default 1024)
        seed: Random seed for reproducibility (random if None)

    Returns:
        URL string pointing to the generated image
    """
    encoded_prompt = urllib.parse.quote(prompt)
    random_seed = seed if seed is not None else random.randint(1, 999999)
    return (
        f"https://image.pollinations.ai/prompt/{encoded_prompt}"
        f"?width={width}&height={height}&seed={random_seed}&nologo=true"
    )


# ─── Image Generation Detection ──────────────────────────────────────────────

IMAGE_PREFIXES = ["/image", "/draw", "/generate", "generate image", "create image", "draw"]


def detect_image_request(content: str):
    """
    Check whether a user message is an image generation request.

    Args:
        content: The raw user message text

    Returns:
        Tuple (is_image_request: bool, prompt_text: str)
        prompt_text is the cleaned image prompt, or "" if not an image request
    """
    lower = content.strip().lower()
    for prefix in IMAGE_PREFIXES:
        if lower.startswith(prefix):
            prompt = content[len(prefix):].strip()
            if not prompt:
                prompt = "A beautiful digital artwork"
            return True, prompt
    return False, ""
