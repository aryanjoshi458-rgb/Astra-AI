import datetime
import io
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.colors import HexColor
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

from app import models, schemas, auth
from app.database import get_db
from app.services.ai_service import AIService

logger = logging.getLogger("astra_ai.chat_router")
router = APIRouter(prefix="/api/chat", tags=["Chat & Conversations"])

@router.get("/sessions", response_model=List[schemas.ChatSessionResponse])
def get_sessions(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(models.ChatSession)\
        .filter(models.ChatSession.user_id == current_user.id)\
        .order_by(models.ChatSession.is_pinned.desc(), models.ChatSession.updated_at.desc())\
        .all()
    return sessions

@router.get("/sessions/{session_id}", response_model=schemas.ChatSessionDetailResponse)
def get_session(
    session_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(models.ChatSession)\
        .filter(models.ChatSession.id == session_id, models.ChatSession.user_id == current_user.id)\
        .first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return session

@router.post("/sessions", response_model=schemas.ChatSessionResponse)
def create_session(
    payload: schemas.ChatSessionCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    new_session = models.ChatSession(
        user_id=current_user.id,
        title=payload.title or "New Chat"
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.put("/sessions/{session_id}/rename", response_model=schemas.ChatSessionResponse)
def rename_session(
    session_id: int,
    payload: schemas.ChatRenameRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(models.ChatSession)\
        .filter(models.ChatSession.id == session_id, models.ChatSession.user_id == current_user.id)\
        .first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    session.title = payload.title
    db.commit()
    db.refresh(session)
    return session

@router.put("/sessions/{session_id}/pin", response_model=schemas.ChatSessionResponse)
def pin_session(
    session_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(models.ChatSession)\
        .filter(models.ChatSession.id == session_id, models.ChatSession.user_id == current_user.id)\
        .first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    session.is_pinned = not session.is_pinned
    db.commit()
    db.refresh(session)
    return session

@router.delete("/sessions")
def clear_all_sessions(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(models.ChatSession).filter(models.ChatSession.user_id == current_user.id).all()
    for session in sessions:
        db.delete(session)
    db.commit()
    return {"message": "All chat sessions deleted successfully"}


@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(models.ChatSession)\
        .filter(models.ChatSession.id == session_id, models.ChatSession.user_id == current_user.id)\
        .first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    db.delete(session)
    db.commit()
    return {"message": "Chat session deleted successfully"}


@router.post("/sessions/{session_id}/stream")
async def stream_message(
    session_id: int,
    payload: schemas.MessageCreate,
    assistant_type: Optional[str] = Query(None),
    file_text_context: Optional[str] = Query(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(models.ChatSession)\
        .filter(models.ChatSession.id == session_id, models.ChatSession.user_id == current_user.id)\
        .first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    # 1. Save User Message
    user_msg = models.Message(
        session_id=session.id,
        sender="user",
        content=payload.content,
        file_url=payload.file_url,
        file_type=payload.file_type,
        model_used=payload.model_used
    )
    db.add(user_msg)
    db.commit()

    # 2. Get past chat messages to provide context
    past_messages = db.query(models.Message)\
        .filter(models.Message.session_id == session.id)\
        .order_by(models.Message.created_at.asc())\
        .all()
        
    history = [{"sender": m.sender, "content": m.content} for m in past_messages[:-1]] # exclude the one we just saved

    # 3. Increment usage limits
    usage = db.query(models.UsageStats).filter(models.UsageStats.user_id == current_user.id).first()
    if not usage:
        usage = models.UsageStats(user_id=current_user.id, tokens_used=0, requests_count=0)
        db.add(usage)
    usage.requests_count += 1
    db.commit()

    # 4. Stream response generator
    async def response_generator():
        accumulated_response = ""
        
        # Stream from AI Service
        async for chunk in AIService.stream_chat(
            prompt=payload.content,
            history=history,
            assistant_type=assistant_type,
            file_content=file_text_context
        ):
            accumulated_response += chunk
            # Yield in Server-Sent Events (SSE) format or raw chunk.
            # Raw text chunk works great with React fetch streams
            yield chunk

        # Generator completed: save Assistant Message to Database
        # Note: We open a new database session because the generator is evaluated asynchronously
        db_gen = next(get_db())
        try:
            assistant_msg = models.Message(
                session_id=session.id,
                sender="assistant",
                content=accumulated_response,
                model_used=payload.model_used or "astra-gpt-4"
            )
            db_gen.add(assistant_msg)
            
            # Simple token estimation (approx 4 chars per token)
            tokens = (len(payload.content) + len(accumulated_response)) // 4
            gen_usage = db_gen.query(models.UsageStats).filter(models.UsageStats.user_id == current_user.id).first()
            if gen_usage:
                gen_usage.tokens_used += tokens
            
            # Auto-rename chat if it is default 'New Chat'
            db_session = db_gen.query(models.ChatSession).filter(models.ChatSession.id == session.id).first()
            if db_session and db_session.title == "New Chat":
                short_title = payload.content[:30] + ("..." if len(payload.content) > 30 else "")
                db_session.title = short_title
                
            db_gen.commit()
        except Exception as e:
            logger.error(f"Error saving stream completion to DB: {e}")
            db_gen.rollback()
        finally:
            db_gen.close()

    return StreamingResponse(response_generator(), media_type="text/event-stream")


@router.get("/sessions/{session_id}/export")
def export_pdf(
    session_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(models.ChatSession)\
        .filter(models.ChatSession.id == session_id, models.ChatSession.user_id == current_user.id)\
        .first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    messages = db.query(models.Message)\
        .filter(models.Message.session_id == session.id)\
        .order_by(models.Message.created_at.asc())\
        .all()

    if not REPORTLAB_AVAILABLE:
        # Fallback to plain text export if reportlab is not installed
        txt_content = f"Astra AI Chat Export\n"
        txt_content += f"Conversation: {session.title}\n"
        txt_content += f"Exported on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        txt_content += "="*50 + "\n\n"
        for msg in messages:
            sender_label = "USER" if msg.sender == "user" else f"ASTRA AI ({msg.model_used or 'Assistant'})"
            txt_content += f"[{sender_label}]:\n{msg.content}\n"
            txt_content += "-"*50 + "\n\n"
        
        headers = {
            'Content-Disposition': f'attachment; filename="Astra-AI-Chat-{session_id}.txt"'
        }
        return StreamingResponse(io.BytesIO(txt_content.encode("utf-8")), media_type="text/plain", headers=headers)

    # Generate PDF in memory using ReportLab
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(pdf_buffer, pagesize=letter, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    
    styles = getSampleStyleSheet()
    
    # Custom Palette
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=HexColor('#0F172A'),
        spaceAfter=15
    )
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontSize=10,
        textColor=HexColor('#64748B'),
        spaceAfter=25
    )
    user_header_style = ParagraphStyle(
        'UserHeader',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=HexColor('#4F46E5'),
        spaceBefore=12,
        spaceAfter=4
    )
    assistant_header_style = ParagraphStyle(
        'AsstHeader',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=HexColor('#0EA5E9'),
        spaceBefore=12,
        spaceAfter=4
    )
    content_style = ParagraphStyle(
        'MsgContent',
        parent=styles['BodyText'],
        fontSize=10,
        textColor=HexColor('#1E293B'),
        spaceAfter=12,
        leading=14
    )

    story = []
    
    # Header Info
    story.append(Paragraph(f"Astra AI Chat Export", title_style))
    story.append(Paragraph(f"Conversation: {session.title}<br/>Exported on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", subtitle_style))
    story.append(Spacer(1, 10))

    # Add messages
    for msg in messages:
        sender_label = "USER" if msg.sender == "user" else f"ASTRA AI ({msg.model_used or 'Assistant'})"
        header_style = user_header_style if msg.sender == "user" else assistant_header_style
        
        story.append(Paragraph(sender_label, header_style))
        # Format text to replace newlines with line breaks for PDF paragraph
        formatted_content = msg.content.replace('\n', '<br/>')
        story.append(Paragraph(formatted_content, content_style))
        story.append(Spacer(1, 5))

    doc.build(story)
    pdf_buffer.seek(0)
    
    headers = {
        'Content-Disposition': f'attachment; filename="Astra-AI-Chat-{session_id}.pdf"'
    }
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)
