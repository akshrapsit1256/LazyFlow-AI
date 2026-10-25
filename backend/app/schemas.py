from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

# --- Health & Ollama Status ---
class ModelItem(BaseModel):
    name: str
    size: Optional[int] = None
    modified_at: Optional[str] = None
    family: Optional[str] = None
    parameter_size: Optional[str] = None
    quantization_level: Optional[str] = None

class OllamaStatusResponse(BaseModel):
    connected: bool
    version: Optional[str] = None
    base_url: str
    configured_model: str
    models_available: List[ModelItem] = []
    error: Optional[str] = None
    setup_instructions: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    project: str
    version: str
    ollama: OllamaStatusResponse

# --- Tasks ---
class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    priority: str = Field(default="medium")  # high, medium, low
    due_date: Optional[str] = None
    is_completed: bool = False

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    is_completed: Optional[bool] = None

class TaskResponse(TaskBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TaskGenerateRequest(BaseModel):
    notes: str = Field(..., min_length=3, description="Unstructured notes to extract tasks from")
    save_immediately: bool = False

class GeneratedTaskItem(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    due_date: Optional[str] = None

class TaskGenerateResponse(BaseModel):
    tasks: List[GeneratedTaskItem]
    model_used: str
    note_extracted: str

# --- Summarizer ---
class SummarizeRequest(BaseModel):
    text: str = Field(..., min_length=10, description="Text to summarize")
    length_option: str = Field(default="standard")  # concise, standard, detailed
    format_option: str = Field(default="bullet")    # bullet, paragraph

class SummarizeResponse(BaseModel):
    summary: str
    length_option: str
    format_option: str
    model_used: str
    word_count_original: int
    word_count_summary: int

class SummarySaveRequest(BaseModel):
    title: Optional[str] = "Untitled Summary"
    original_text: str
    summary_text: str
    length_option: str = "standard"
    format_option: str = "bullet"
    model_used: str

class SummaryResponse(BaseModel):
    id: int
    title: Optional[str]
    original_text: str
    summary_text: str
    length_option: str
    format_option: str
    model_used: str
    word_count_original: int
    word_count_summary: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Email Assistant ---
class EmailGenerateRequest(BaseModel):
    prompt_or_original: str = Field(..., min_length=5, description="Email situation or original message")
    tone: str = Field(default="professional")  # professional, friendly, concise, formal
    recipient: Optional[str] = None
    subject: Optional[str] = None

class EmailGenerateResponse(BaseModel):
    draft_content: str
    subject_suggested: Optional[str] = None
    tone: str
    model_used: str

class EmailDraftSaveRequest(BaseModel):
    prompt_or_original: str
    draft_content: str
    tone: str = "professional"
    recipient: Optional[str] = None
    subject: Optional[str] = None
    model_used: str

class EmailDraftResponse(BaseModel):
    id: int
    prompt_or_original: str
    draft_content: str
    tone: str
    recipient: Optional[str]
    subject: Optional[str]
    model_used: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- File Organizer ---
class FileMetadataInput(BaseModel):
    name: str
    size: Optional[int] = None
    extension: Optional[str] = None
    type: Optional[str] = None
    relative_path: Optional[str] = None

class FileOrganizeRequest(BaseModel):
    files: List[FileMetadataInput] = Field(..., min_length=1)
    custom_rules: Optional[str] = None

class FilePlanItem(BaseModel):
    original_name: str
    proposed_category: str
    proposed_subfolder: str
    destination_name: str
    reason: str

class FileCategoryRecommendation(BaseModel):
    category: str
    description: str
    suggested_folder: str
    file_count: int

class FileOrganizeResponse(BaseModel):
    categories: List[FileCategoryRecommendation]
    plan: List[FilePlanItem]
    model_used: str
    total_files: int
    safety_notice: str

class SafeFileExecutionItem(BaseModel):
    original_relative_path: str
    target_relative_path: str

class FileExecuteRequest(BaseModel):
    root_directory: str = Field(..., description="Absolute path on local machine to organize with user approval")
    operations: List[SafeFileExecutionItem]

class FileExecuteResponse(BaseModel):
    success: bool
    moved_count: int
    errors: List[str]
    message: str

# --- Daily Briefing ---
class DailyBriefingGenerateRequest(BaseModel):
    additional_notes: Optional[str] = None

class DailyBriefingResponse(BaseModel):
    id: Optional[int] = None
    title: str = "Daily Briefing"
    briefing_content: str
    priorities_content: Optional[str] = None
    recommended_actions: Optional[str] = None
    stats_snapshot: Dict[str, Any]
    model_used: str
    created_at: Optional[datetime] = None

class DailyBriefingSaveRequest(BaseModel):
    title: str = "Daily Briefing"
    briefing_content: str
    priorities_content: Optional[str] = None
    recommended_actions: Optional[str] = None
    stats_snapshot: Dict[str, Any]
    model_used: str

# --- Settings ---
class SettingUpdate(BaseModel):
    key: str
    value: str

class SettingResponse(BaseModel):
    key: str
    value: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Dashboard Stats ---
class DashboardStatsResponse(BaseModel):
    total_tasks: int
    pending_tasks: int
    completed_tasks: int
    overdue_tasks: int
    saved_summaries_count: int
    saved_emails_count: int
    saved_briefings_count: int
    estimated_time_saved_minutes: int
    local_ai_status: OllamaStatusResponse
    recent_activity: List[Dict[str, Any]]
