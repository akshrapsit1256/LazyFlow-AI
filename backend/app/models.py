from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from app.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(50), default="medium")  # high, medium, low
    due_date = Column(String(100), nullable=True)     # e.g., "2026-10-30" or "Friday"
    is_completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=True)
    original_text = Column(Text, nullable=False)
    summary_text = Column(Text, nullable=False)
    length_option = Column(String(50), default="standard")  # concise, standard, detailed
    format_option = Column(String(50), default="bullet")    # bullet, paragraph
    model_used = Column(String(100), nullable=False)
    word_count_original = Column(Integer, default=0)
    word_count_summary = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class EmailDraft(Base):
    __tablename__ = "email_drafts"

    id = Column(Integer, primary_key=True, index=True)
    prompt_or_original = Column(Text, nullable=False)
    tone = Column(String(50), default="professional")  # professional, friendly, concise, formal
    recipient = Column(String(255), nullable=True)
    subject = Column(String(255), nullable=True)
    draft_content = Column(Text, nullable=False)
    model_used = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class DailyBriefing(Base):
    __tablename__ = "daily_briefings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), default="Daily Briefing")
    briefing_content = Column(Text, nullable=False)
    priorities_content = Column(Text, nullable=True)
    recommended_actions = Column(Text, nullable=True)  # JSON string or bullet points
    stats_snapshot = Column(Text, nullable=True)        # JSON string of task counts
    model_used = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class AppSetting(Base):
    __tablename__ = "app_settings"

    key = Column(String(100), primary_key=True, index=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
