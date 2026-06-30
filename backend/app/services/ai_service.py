import asyncio
import json
import logging
import urllib.parse
import random
from typing import AsyncGenerator, List, Dict, Optional
import httpx
from app.config import settings

logger = logging.getLogger("astra_ai.ai_service")

# Global HTTP client to reuse connection pooling and reduce handshake overhead
_shared_client = None

def get_shared_client() -> httpx.AsyncClient:
    global _shared_client
    if _shared_client is None:
        _shared_client = httpx.AsyncClient(timeout=3.0)
    return _shared_client

class AIService:
    @staticmethod
    def _get_mock_response(prompt: str, assistant_type: Optional[str] = None, file_content: Optional[str] = None) -> str:
        prompt_lower = prompt.lower()
        
        # Determine the contextual response based on prompt queries
        if "summarize" in prompt_lower or "summary" in prompt_lower:
            return (
                "### Summary Report\n\n"
                "Based on the input document or text provided, here is a concise summarization:\n\n"
                "1. **Core Concept**: The text primarily details the deployment, scaling, and architectural patterns of modern web systems.\n"
                "2. **Key Takeaways**:\n"
                "   - *Efficiency*: Minimizing overhead is crucial for low-latency feedback loops.\n"
                "   - *Scalability*: A stateless backend layered over high-performance cache pools ensures dynamic traffic routing.\n"
                "   - *Modularity*: Keeping services isolated prevents compounding database connection exhaustions.\n\n"
                "Please let me know if you would like me to expand on any of these points!"
            )
        elif "translate" in prompt_lower or "translation" in prompt_lower:
            return (
                "### Translation Results\n\n"
                "Here is the translated text styled in the requested locale:\n\n"
                "> \"The boundaries of human learning expand only when we dare to step beyond the limitations of our current paradigms.\"\n\n"
                "**Translation (French)**:\n"
                "> \"Les frontières de l'apprentissage humain ne s'élargissent que lorsque nous osons dépasser les limites de nos paradigms actuels.\"\n\n"
                "**Translation (Spanish)**:\n"
                "> \"Los límites del aprendizaje humano se expanden solo cuando nos atrevemos a ir más allá de las limitaciones de nuestros paradigmas actuales.\""
            )
        elif "resume" in prompt_lower or "cv" in prompt_lower:
            return (
                "# Professional Resume\n\n"
                "## ASTRA DEVELOPER\n"
                "*Full-Stack AI Software Engineer | San Francisco, CA | developer@astra.ai*\n\n"
                "---\n\n"
                "### Professional Profile\n"
                "Dynamic and detail-oriented Software Engineer with 5+ years of experience designing high-throughput APIs, premium user interfaces, and custom machine learning pipelines. Expert in React, FastAPI, PostgreSQL, and LLM integrations.\n\n"
                "### Technical Skills\n"
                "- **Languages**: Python, JavaScript, TypeScript, SQL, HTML/CSS\n"
                "- **Frameworks**: FastAPI, Flask, Django, React.js, Next.js, Express\n"
                "- **Databases**: PostgreSQL, Redis, MongoDB, SQLite\n"
                "- **Tools & Practices**: Docker, Git, REST APIs, GraphQL, Microservices, CI/CD\n\n"
                "### Experience\n"
                "**Lead Software Engineer** | *Astra AI Platform* (2025 - Present)\n"
                "- Architected a real-time streaming chat application supporting PDF ingestion, saving users 35% time on report review.\n"
                "- Built a robust database layer handling 10k+ active sessions with efficient connection pools and indexing."
            )
        elif "code" in prompt_lower or "function" in prompt_lower or "debug" in prompt_lower or "write a program" in prompt_lower:
            return (
                "Here is a complete, production-ready implementation of a secure JWT authentication middleware in Python, utilizing FastAPI:\n\n"
                "```python\n"
                "from fastapi import Depends, HTTPException, status\n"
                "from fastapi.security import OAuth2PasswordBearer\n"
                "from jose import JWTError, jwt\n\n"
                "SECRET_KEY = \"astra_secure_key\"\n"
                "ALGORITHM = \"HS256\"\n"
                "oauth2_scheme = OAuth2PasswordBearer(tokenUrl=\"token\")\n\n"
                "async def get_current_user(token: str = Depends(oauth2_scheme)):\n"
                "    credentials_exception = HTTPException(\n"
                "        status_code=status.HTTP_401_UNAUTHORIZED,\n"
                "        detail=\"Could not validate credentials\",\n"
                "        headers={\"WWW-Authenticate\": \"Bearer\"},\n"
                "    )\n"
                "    try:\n"
                "        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])\n"
                "        username: str = payload.get(\"sub\")\n"
                "        if username is None:\n"
                "            raise credentials_exception\n"
                "        return {\"username\": username}\n"
                "    except JWTError:\n"
                "        raise credentials_exception\n"
                "```\n\n"
                "### Key Details:\n"
                "- **Bearer Authentication**: Integrates seamlessly with OpenAPI docs.\n"
                "- **JWT Decode**: Validates signatures and expiration times.\n"
                "- **Robust Handling**: Raises 401 Unauthorized in case of tampering."
            )
        elif "search" in prompt_lower or "web search" in prompt_lower or "find info" in prompt_lower:
            return (
                "### 🔍 Astra Web Search Results\n\n"
                "I have searched the web for your query. Here is the synthesized summary:\n\n"
                "According to recent articles, **Astra AI** is emerging as a premier platform for SaaS developers due to its cohesive tool stack (FastAPI + React) and elegant glassmorphic interface. Reviewers praise its fast stream latency and the built-in context memory.\n\n"
                "**Sources Checked**:\n"
                "- *TechSphere Monthly (June 2026)* - \"The Rise of Glassmorphic AI Platforms\"\n"
                "- *DevOps Digest (2026)* - \"Why FastAPI is the Go-To Backend for LLM Orchestration\""
            )
        
        # Default assistant personalization
        persona_intro = ""
        if assistant_type:
            persona_intro = f"*[Response personalized for: {assistant_type.capitalize()} Assistant]*\n\n"

        file_info = ""
        if file_content:
            file_info = f"\n\n*(Parsed PDF/File context loaded: {len(file_content)} characters)*"

        return (
            f"{persona_intro}Hello! I am your **Astra AI** personal assistant, operating with the **Think Beyond Limits** paradigm.\n\n"
            f"Here is a helpful, detailed response to your query:\n\n"
            f"**Your Prompt**: \"{prompt}\"\n\n"
            f"I have context tracking enabled and can digest document uploads, generate code blocks, or compile tables easily. "
            f"How else can I empower your workflow today?{file_info}"
        )

    @staticmethod
    async def detect_language(text: str) -> str:
        try:
            client = get_shared_client()
            encoded_text = urllib.parse.quote(text[:200])
            url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q={encoded_text}"
            response = await client.get(url, timeout=1.0)
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 2:
                    return data[2]
        except Exception as e:
            logger.error(f"Language detection error: {e}")
        return "en"

    @staticmethod
    async def translate_text(text: str, target_lang: str) -> str:
        if target_lang == "en":
            return text
        try:
            client = get_shared_client()
            encoded_text = urllib.parse.quote(text)
            url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl={target_lang}&dt=t&q={encoded_text}"
            response = await client.get(url, timeout=1.5)
            if response.status_code == 200:
                data = response.json()
                translated_segments = []
                if data and isinstance(data, list) and len(data) > 0 and data[0]:
                    for segment in data[0]:
                        if segment and len(segment) > 0:
                            translated_segments.append(segment[0])
                if translated_segments:
                    return "".join(translated_segments)
        except Exception as e:
            logger.error(f"Translation error: {e}")
        return text

    @classmethod
    async def stream_chat(
        cls, 
        prompt: str, 
        history: List[Dict[str, str]] = [], 
        assistant_type: Optional[str] = None,
        file_content: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        
        # Check for creator/launch date query
        is_branding_query = False
        lower_prompt = prompt.strip().lower()
        if any(x in lower_prompt for x in ["kisne banaya", "created you", "made you", "developed you", "creator", "developer", "owner of you", "who are you"]) or \
           any(x in lower_prompt for x in ["launch", "starting", "start hua", "kab start", "kab bana", "release", "birthday"]):
            if any(x in lower_prompt for x in ["you", "tum", "aap", "tu ", "assistant", "model", "system"]):
                is_branding_query = True

        if is_branding_query:
            response_text = "मैं **Astra AI** द्वारा विकसित एक पेशेवर AI सहायक हूँ। मेरी शुरुआत **23 जून 2026** को हुई थी। मैं आपकी विभिन्न तकनीकी, रचनात्मक और कोडिंग कार्यों में सहायता करने के लिए प्रतिबद्ध हूँ।"
            yield response_text
            return

        # Check if this is an image generation request
        prefixes = ["/image", "/draw", "/generate", "generate image", "create image", "draw"]
        lower_prompt = prompt.strip().lower()
        is_image_request = False
        prompt_text = ""
        for prefix in prefixes:
            if lower_prompt.startswith(prefix):
                is_image_request = True
                prompt_text = prompt[len(prefix):].strip()
                if not prompt_text:
                    prompt_text = "A beautiful digital artwork"
                break

        if is_image_request:
            encoded_prompt = urllib.parse.quote(prompt_text)
            seed = random.randint(1, 999999)
            image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&seed={seed}&nologo=true"
            response_text = f"Here is your generated image for **\"{prompt_text}\"**:\n\n![{prompt_text}]({image_url})"
            yield response_text
            return
        
        # Check if OpenAI API Key is provided. If so, attempt real API streaming.
        if settings.OPENAI_API_KEY:
            try:
                # Prepare message payload
                messages = []
                system_prompt = "You are Astra AI, an advanced AI Assistant. Think Beyond Limits. Be helpful, concise, and professional."
                if assistant_type:
                    system_prompt += f" You are acting as a specialized {assistant_type} assistant."
                if file_content:
                    system_prompt += f" A file has been uploaded for analysis. Here is its content: {file_content}"
                
                messages.append({"role": "system", "content": system_prompt})
                for h in history:
                    messages.append({"role": h["sender"], "content": h["content"]})
                messages.append({"role": "user", "content": prompt})

                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": "gpt-4o",
                            "messages": messages,
                            "stream": True
                        }
                    )
                    
                    if response.status_code == 200:
                        # Stream the chunks
                        buffer = ""
                        async for chunk in response.aiter_text():
                            buffer += chunk
                            while "\n" in buffer:
                                line, buffer = buffer.split("\n", 1)
                                line = line.strip()
                                if line.startswith("data: "):
                                    data_str = line[6:]
                                    if data_str == "[DONE]":
                                        break
                                    try:
                                        data_json = json.loads(data_str)
                                        content = data_json["choices"][0]["delta"].get("content", "")
                                        if content:
                                            yield content
                                            await asyncio.sleep(0.01)
                                    except Exception:
                                        pass
                        return
                    else:
                        logger.warning(f"OpenAI API error code {response.status_code}, falling back to mock response.")
            except Exception as e:
                logger.error(f"OpenAI API exception: {e}, falling back to mock response.")

        # Fallback to simulated high-fidelity streaming
        # Only detect language if it contains non-ASCII characters
        lang = "en"
        if any(ord(c) > 127 for c in prompt):
            try:
                lang = await asyncio.wait_for(cls.detect_language(prompt), timeout=1.0)
            except Exception:
                lang = "en"
                
        response_text = cls._get_mock_response(prompt, assistant_type, file_content)
        
        if lang != "en":
            try:
                response_text = await asyncio.wait_for(cls.translate_text(response_text, lang), timeout=1.5)
            except Exception:
                pass
            
        words = response_text.split(" ")
        if len(words) > 5:
            for i, word in enumerate(words):
                yield word + (" " if i < len(words) - 1 else "")
                await asyncio.sleep(0.02)
        else:
            chunk_size = 2 if len(response_text) > 50 else 1
            for i in range(0, len(response_text), chunk_size):
                yield response_text[i:i+chunk_size]
                await asyncio.sleep(0.015)
