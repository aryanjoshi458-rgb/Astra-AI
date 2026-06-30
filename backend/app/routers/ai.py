import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app import auth
from app.database import get_db
from app.services.pdf_service import PDFService

logger = logging.getLogger("astra_ai.ai_router")
router = APIRouter(prefix="/api/ai", tags=["AI Auxiliary Features"])

@router.post("/analyze-pdf")
async def analyze_pdf(
    file: UploadFile = File(...),
    current_user: str = Depends(auth.get_current_user)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    try:
        content = await file.read()
        extracted_text = PDFService.extract_text_from_bytes(content)
        
        # Get a shortened preview to avoid sending thousands of lines immediately,
        # but return both preview and full text for context inclusion.
        preview = extracted_text[:1000] + ("..." if len(extracted_text) > 1000 else "")
        
        return {
            "filename": file.filename,
            "char_count": len(extracted_text),
            "preview": preview,
            "full_text": extracted_text
        }
    except Exception as e:
        logger.error(f"Error handling PDF upload: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

@router.post("/analyze-image")
async def analyze_image(
    file: UploadFile = File(...),
    prompt: str = Form("Describe this image"),
    current_user: str = Depends(auth.get_current_user)
):
    # Validates supported formats
    valid_extensions = [".jpg", ".jpeg", ".png", ".webp"]
    if not any(file.filename.lower().endswith(ext) for ext in valid_extensions):
        raise HTTPException(status_code=400, detail="Unsupported image format. Use JPG, PNG, or WebP.")

    # Image analysis simulated fallback
    logger.info(f"Image analysis requested for {file.filename} with prompt: {prompt}")
    
    # In a real setup, you would pass the file bytes and prompt to Gemini Pro Vision or GPT-4o.
    analysis_desc = (
        f"**[Image Analysis Result for {file.filename}]**\n\n"
        f"The image appears to contain visual layouts with high fidelity components. "
        f"Based on your inquiry: '{prompt}', here is what I detected:\n\n"
        f"1. **Core Subject**: A clean dashboard UI mock-up displaying telemetry charts and user account details.\n"
        f"2. **Styling**: Uses a dark mode palette with active teal (#38BDF8) highlights.\n"
        f"3. **Text / OCR**: Text in the header reads 'Astra AI Performance Monitoring'."
    )

    return {
        "filename": file.filename,
        "prompt": prompt,
        "description": analysis_desc
    }

@router.post("/voice-input")
async def voice_input(
    file: UploadFile = File(...),
    current_user: str = Depends(auth.get_current_user)
):
    # Simulated Whisper Speech-To-Text
    logger.info(f"Voice transcription requested for {file.filename}")
    
    transcription = "Analyze the performance statistics of my subscription keys."
    
    return {
        "filename": file.filename,
        "transcription": transcription
    }

@router.post("/voice-output")
async def voice_output(
    text: str = Form(...),
    current_user: str = Depends(auth.get_current_user)
):
    # Simulated Text-To-Speech (TTS)
    logger.info(f"Text to Speech requested for text size: {len(text)}")
    
    # We will return a public mock speech file URL or base64 representation.
    # To keep it extremely production-ready and simple without heavy audio binary files,
    # we return a pre-generated or mock text-to-speech indicator that frontend speaks using Web Speech API (speechSynthesis)
    # which is the most reliable, modern and zero-latency client-side way to do TTS!
    return {
        "should_speak": True,
        "text": text,
        "voice_preference": "premium-female"
    }
