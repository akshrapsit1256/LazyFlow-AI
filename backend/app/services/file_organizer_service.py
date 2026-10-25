import os
import shutil
from typing import List, Dict, Any
from app.schemas import FileCategoryRecommendation, FilePlanItem

# Safe extension mapping for heuristic classification
EXTENSION_CATEGORIES = {
    # Documents
    ".pdf": ("Documents & Reports", "Documents/PDFs"),
    ".docx": ("Documents & Reports", "Documents/Word"),
    ".doc": ("Documents & Reports", "Documents/Word"),
    ".txt": ("Notes & Text", "Documents/Notes"),
    ".md": ("Notes & Text", "Documents/Markdown"),
    ".rtf": ("Documents & Reports", "Documents"),
    # Spreadsheets & Data
    ".xlsx": ("Spreadsheets & Finance", "Data/Excel"),
    ".xls": ("Spreadsheets & Finance", "Data/Excel"),
    ".csv": ("Data & Exports", "Data/CSV"),
    ".json": ("Data & Exports", "Data/JSON"),
    ".parquet": ("Data & Exports", "Data/Parquet"),
    # Code & Development
    ".py": ("Source Code", "Development/Python"),
    ".js": ("Source Code", "Development/JavaScript"),
    ".jsx": ("Source Code", "Development/React"),
    ".ts": ("Source Code", "Development/TypeScript"),
    ".tsx": ("Source Code", "Development/React"),
    ".html": ("Web Assets", "Development/HTML"),
    ".css": ("Web Assets", "Development/Styles"),
    ".sql": ("Database & SQL", "Development/SQL"),
    # Media & Images
    ".png": ("Images & Graphics", "Media/Images"),
    ".jpg": ("Images & Photos", "Media/Images"),
    ".jpeg": ("Images & Photos", "Media/Images"),
    ".gif": ("Images & Animations", "Media/Images"),
    ".svg": ("Vectors & Icons", "Media/Icons"),
    ".mp4": ("Videos & Screen Recordings", "Media/Videos"),
    ".mov": ("Videos & Screen Recordings", "Media/Videos"),
    ".mp3": ("Audio & Recordings", "Media/Audio"),
    ".wav": ("Audio & Recordings", "Media/Audio"),
    # Archives
    ".zip": ("Archives & Bundles", "Archives/Zip"),
    ".tar": ("Archives & Bundles", "Archives/Tar"),
    ".gz": ("Archives & Bundles", "Archives/Gz"),
    ".7z": ("Archives & Bundles", "Archives/7z"),
}

def generate_heuristic_file_plan(files: List[Dict[str, Any]]) -> Dict[str, Any]:
    categories_dict: Dict[str, Dict[str, Any]] = {}
    plan_items: List[FilePlanItem] = []

    for f in files:
        name = f.get("name", "")
        _, ext = os.path.splitext(name)
        ext_lower = ext.lower()

        cat_name, subfolder = EXTENSION_CATEGORIES.get(
            ext_lower,
            ("Miscellaneous", "Other")
        )

        # Keyword heuristics for filenames
        name_lower = name.lower()
        if any(w in name_lower for w in ["invoice", "receipt", "bill", "tax", "statement"]):
            cat_name = "Finance & Invoices"
            subfolder = "Finance/Invoices"
            reason = "Financial keyword in filename"
        elif any(w in name_lower for w in ["resume", "cv", "portfolio"]):
            cat_name = "Career & Resumes"
            subfolder = "Career/Resumes"
            reason = "Career keyword in filename"
        elif any(w in name_lower for w in ["screenshot", "screen shot", "capture"]):
            cat_name = "Screenshots"
            subfolder = "Media/Screenshots"
            reason = "Screenshot naming pattern"
        else:
            reason = f"Classified by file extension '{ext_lower or 'none'}'"

        if cat_name not in categories_dict:
            categories_dict[cat_name] = {
                "category": cat_name,
                "description": f"Files categorized under {cat_name}",
                "suggested_folder": subfolder,
                "file_count": 0
            }
        categories_dict[cat_name]["file_count"] += 1

        plan_items.append(FilePlanItem(
            original_name=name,
            proposed_category=cat_name,
            proposed_subfolder=subfolder,
            destination_name=name,
            reason=reason
        ))

    cat_list = [
        FileCategoryRecommendation(**data)
        for data in categories_dict.values()
    ]

    return {
        "categories": cat_list,
        "plan": plan_items
    }

def execute_safe_file_organization(root_dir: str, operations: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Safely moves files into organized subfolders within the specified root directory.
    STRICT SAFETY RULES:
    1. root_dir must exist and be an absolute path.
    2. Every file path is checked to prevent path traversal (stay inside root_dir).
    3. Target directories are created cleanly.
    4. Never deletes any files.
    """
    if not os.path.isabs(root_dir):
        return {
            "success": False,
            "moved_count": 0,
            "errors": ["Root directory must be an absolute local path."],
            "message": "Operation aborted for safety."
        }

    resolved_root = os.path.realpath(root_dir)
    if not os.path.exists(resolved_root) or not os.path.isdir(resolved_root):
        return {
            "success": False,
            "moved_count": 0,
            "errors": [f"Directory does not exist: {root_dir}"],
            "message": "Directory not found on local disk."
        }

    moved_count = 0
    errors: List[str] = []

    for op in operations:
        orig_rel = op.get("original_relative_path", "").strip()
        target_rel = op.get("target_relative_path", "").strip()

        if not orig_rel or not target_rel:
            continue

        src_full = os.path.realpath(os.path.join(resolved_root, orig_rel))
        dst_full = os.path.realpath(os.path.join(resolved_root, target_rel))

        # Path traversal checks
        if not src_full.startswith(resolved_root):
            errors.append(f"Security violation: Source path '{orig_rel}' attempts traversal outside root.")
            continue
        if not dst_full.startswith(resolved_root):
            errors.append(f"Security violation: Target path '{target_rel}' attempts traversal outside root.")
            continue

        if not os.path.exists(src_full):
            errors.append(f"File not found: '{orig_rel}'")
            continue

        # Prevent moving if destination already exists to avoid data loss
        if os.path.exists(dst_full) and src_full != dst_full:
            base, ext = os.path.splitext(dst_full)
            dst_full = f"{base}_organized{ext}"

        try:
            os.makedirs(os.path.dirname(dst_full), exist_ok=True)
            shutil.move(src_full, dst_full)
            moved_count += 1
        except Exception as e:
            errors.append(f"Failed to move '{orig_rel}' to '{target_rel}': {str(e)}")

    return {
        "success": len(errors) == 0,
        "moved_count": moved_count,
        "errors": errors,
        "message": f"Successfully organized {moved_count} files into structured folders." if moved_count > 0 else "No files were moved."
    }
