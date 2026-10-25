from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AppSetting
from app.schemas import (
    FileOrganizeRequest,
    FileOrganizeResponse,
    FileExecuteRequest,
    FileExecuteResponse
)
from app.services.ai_service import ai_service
from app.services.file_organizer_service import execute_safe_file_organization
from app.config import settings

router = APIRouter(prefix="/files", tags=["File Organizer"])

def get_current_model(db: Session) -> str:
    setting = db.query(AppSetting).filter(AppSetting.key == "selected_model").first()
    return setting.value if setting else settings.DEFAULT_MODEL

@router.post("/organize", response_model=FileOrganizeResponse)
async def plan_file_organization(
    payload: FileOrganizeRequest,
    db: Session = Depends(get_db)
):
    """
    Analyzes metadata for provided filenames and generates a proposed categorization
    and organization plan using local AI without reading file contents.
    """
    model_to_use = get_current_model(db)
    files_data = [f.model_dump() for f in payload.files]
    try:
        result = await ai_service.organize_files(
            files=files_data,
            custom_rules=payload.custom_rules,
            model=model_to_use
        )
        return FileOrganizeResponse(**result)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.post("/execute", response_model=FileExecuteResponse)
def execute_organization(payload: FileExecuteRequest):
    """
    Safely applies proposed file organization to a user-specified local folder.
    Strictly prevents directory traversal and never deletes files.
    Requires explicit user trigger and confirmation.
    """
    ops = [op.model_dump() for op in payload.operations]
    result = execute_safe_file_organization(
        root_dir=payload.root_directory,
        operations=ops
    )
    return FileExecuteResponse(**result)
