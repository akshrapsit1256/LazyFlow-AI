import json
import re
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.config import settings
from app.services.ollama_client import ollama_client
from app.schemas import (
    GeneratedTaskItem,
    FilePlanItem,
    FileCategoryRecommendation
)

logger = logging.getLogger(__name__)

def extract_json_from_text(text: str) -> Any:
    """
    Extracts and parses JSON object or array from a text response that might contain
    markdown code blocks, preamble, or conversational commentary.
    """
    cleaned = text.strip()
    # Check if wrapped in markdown code fence
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
    if fence_match:
        cleaned = fence_match.group(1).strip()
    
    # Try direct parse
    try:
        return json.loads(cleaned)
    except Exception:
        pass

    # Try to find array brackets [ ... ]
    arr_match = re.search(r"(\[[\s\S]*\])", cleaned)
    if arr_match:
        try:
            return json.loads(arr_match.group(1))
        except Exception:
            pass

    # Try to find object braces { ... }
    obj_match = re.search(r"(\{[\s\S]*\})", cleaned)
    if obj_match:
        try:
            return json.loads(obj_match.group(1))
        except Exception:
            pass

    raise ValueError(f"Could not parse valid JSON from AI response: {cleaned[:200]}...")


class AIService:
    def __init__(self, client=ollama_client):
        self.client = client

    async def summarize_text(
        self,
        text: str,
        length_option: str = "standard",
        format_option: str = "bullet",
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """Summarizes text using the local open-weight model."""
        length_instructions = {
            "concise": "Provide a very brief, punchy summary of 2 to 3 sentences or 3 bullet points maximum.",
            "standard": "Provide a well-rounded summary highlighting key points, context, and takeaways in 1 to 2 paragraphs or 4 to 6 bullet points.",
            "detailed": "Provide a thorough summary covering all primary themes, supporting evidence, implications, and takeaways."
        }.get(length_option, "Provide a clear and accurate summary.")

        format_instructions = (
            "Format the summary as a structured bulleted list with clear bullet points (* or -)."
            if format_option == "bullet"
            else "Format the summary as smooth, cohesive paragraphs without bullet points."
        )

        system_prompt = (
            "You are an expert text analyst and summarizer. Your goal is to synthesize the given text faithfully, "
            "preserving factual accuracy and key concepts without adding outside speculation or fluff. "
            "Respond ONLY with the summary itself."
        )

        prompt = f"""Summarize the following text according to these instructions:
- Length: {length_instructions}
- Format: {format_instructions}

TEXT TO SUMMARIZE:
\"\"\"
{text}
\"\"\"

SUMMARY:"""

        raw_summary = await self.client.generate(
            prompt=prompt,
            system=system_prompt,
            model=model,
            temperature=0.3
        )

        clean_summary = raw_summary.strip()
        word_count_orig = len(text.split())
        word_count_sum = len(clean_summary.split())

        return {
            "summary": clean_summary,
            "length_option": length_option,
            "format_option": format_option,
            "model_used": model or settings.DEFAULT_MODEL,
            "word_count_original": word_count_orig,
            "word_count_summary": word_count_sum,
        }

    async def generate_tasks_from_notes(
        self,
        notes: str,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Extracts structured actionable tasks from unstructured user notes.
        CRITICAL: Never invents deadlines unless explicitly mentioned in notes.
        """
        system_prompt = (
            "You are an expert task organization assistant. You convert chaotic, unstructured notes into "
            "actionable, clear, structured tasks. Output ONLY a valid JSON object with a 'tasks' array."
        )

        prompt = f"""You are an expert productivity assistant. Analyze the user's notes and extract ALL distinct actionable tasks.

CRITICAL RULES:
1. Extract every distinct task mentioned.
2. For "due_date", ONLY include the date/day if explicitly stated in the text (e.g. "tomorrow", "Friday"). If no deadline is mentioned for a task, you MUST set "due_date" to null. NEVER invent deadlines.
3. Priority must be "high", "medium", or "low".

USER NOTES:
{notes}

Respond strictly with a JSON object in this format:
{{
  "tasks": [
    {{
      "title": "Clear task title",
      "description": "Details or null",
      "priority": "high",
      "due_date": "tomorrow"
    }}
  ]
}}"""

        raw_response = await self.client.generate(
            prompt=prompt,
            system=system_prompt,
            model=model,
            temperature=0.2,
            format_type="json"
        )

        # Parse and validate tasks
        try:
            parsed = extract_json_from_text(raw_response)
            if isinstance(parsed, dict) and "tasks" in parsed and isinstance(parsed["tasks"], list):
                task_list = parsed["tasks"]
            elif isinstance(parsed, list):
                task_list = parsed
            else:
                task_list = [parsed]
        except Exception as err:
            logger.warning(f"Failed to parse JSON directly from model, attempting line-by-line fallback: {err}")
            task_list = []
            for line in raw_response.splitlines():
                line = line.strip().lstrip("-*123456789. ")
                if len(line) > 3:
                    task_list.append({
                        "title": line,
                        "description": None,
                        "priority": "medium",
                        "due_date": None
                    })

        validated_tasks: List[GeneratedTaskItem] = []
        for t in task_list:
            if not isinstance(t, dict):
                continue
            title = str(t.get("title", "")).strip()
            if not title:
                continue
            priority = str(t.get("priority", "medium")).lower()
            if priority not in ["high", "medium", "low"]:
                priority = "medium"
            desc = t.get("description")
            if desc is not None:
                desc = str(desc).strip()
                if not desc:
                    desc = None
            due_date = t.get("due_date")
            if due_date is not None:
                due_date = str(due_date).strip()
                if not due_date or due_date.lower() in ["none", "null", "n/a"]:
                    due_date = None

            validated_tasks.append(
                GeneratedTaskItem(
                    title=title,
                    description=desc,
                    priority=priority,
                    due_date=due_date
                )
            )

        return {
            "tasks": validated_tasks,
            "model_used": model or settings.DEFAULT_MODEL,
            "note_extracted": notes
        }

    async def draft_email(
        self,
        prompt_or_original: str,
        tone: str = "professional",
        recipient: Optional[str] = None,
        subject: Optional[str] = None,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """Drafts an email based on user context and tone."""
        system_prompt = (
            "You are an executive email communication specialist. You write articulate, well-structured, "
            "and context-appropriate emails. Do not include markdown code fences around the email. "
            "Output the subject line on the first line formatted as 'Subject: <subject>', followed by a blank line, "
            "followed by the email body with proper greeting and sign-off placeholders."
        )

        recipient_context = f"Recipient: {recipient}" if recipient else "Recipient: [Name or Colleague]"
        subject_context = f"Given Subject / Topic: {subject}" if subject else "Suggest an appropriate subject line."

        prompt = f"""Draft an email with the following parameters:
- Tone: {tone.capitalize()}
- {recipient_context}
- {subject_context}

CONTEXT / SITUATION / ORIGINAL MESSAGE:
\"\"\"
{prompt_or_original}
\"\"\"

Output format:
Subject: <Suggested Subject>

<Email Body with Greeting and Sign-off>"""

        raw_response = await self.client.generate(
            prompt=prompt,
            system=system_prompt,
            model=model,
            temperature=0.4
        )

        lines = raw_response.strip().splitlines()
        extracted_subject = subject or "Quick Follow-Up"
        body_lines = []
        is_subject_found = False

        for i, line in enumerate(lines):
            if line.lower().startswith("subject:") and not is_subject_found:
                extracted_subject = line[len("subject:"):].strip()
                is_subject_found = True
            else:
                body_lines.append(line)

        draft_content = "\n".join(body_lines).strip()
        if not draft_content:
            draft_content = raw_response.strip()

        return {
            "draft_content": draft_content,
            "subject_suggested": extracted_subject,
            "tone": tone,
            "model_used": model or settings.DEFAULT_MODEL
        }

    async def organize_files(
        self,
        files: List[Dict[str, Any]],
        custom_rules: Optional[str] = None,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyzes a list of filenames and metadata, suggests clean categorization,
        and provides an explicit destination plan with explanations.
        """
        system_prompt = (
            "You are a meticulous file systems organization architect. You analyze file names, extensions, "
            "and naming patterns to propose a clean, intuitive, and safe folder structure. Output ONLY valid JSON."
        )

        file_list_text = "\n".join([
            f"- {f.get('name')} (ext: {f.get('extension', '')}, size: {f.get('size', 'unknown')} bytes)"
            for f in files[:100]  # limit to 100 for prompt size
        ])

        rules_text = f"Additional user preferences: {custom_rules}" if custom_rules else ""

        prompt = f"""Analyze this list of files and propose a structured folder organization plan.

FILES:
{file_list_text}

{rules_text}

TASK:
1. Identify 3 to 6 logical categories/folders (e.g. '01_Documents/Invoices', '02_Development/Source', '03_Media/Images', '04_Data_Exports').
2. For each file, decide its exact proposed subfolder and explain briefly why it belongs there.
3. Respond ONLY with a JSON object in this exact format:
{{
  "categories": [
    {{
      "category": "Invoices & Finance",
      "description": "Financial statements, billing receipts, tax docs",
      "suggested_folder": "Finance",
      "file_count": 3
    }}
  ],
  "plan": [
    {{
      "original_name": "filename.pdf",
      "proposed_category": "Invoices & Finance",
      "proposed_subfolder": "Finance/Invoices",
      "destination_name": "filename.pdf",
      "reason": "PDF invoice matching payment patterns"
    }}
  ]
}}"""

        raw_response = await self.client.generate(
            prompt=prompt,
            system=system_prompt,
            model=model,
            temperature=0.2,
            format_type="json"
        )

        categories: List[FileCategoryRecommendation] = []
        plan: List[FilePlanItem] = []

        try:
            parsed = extract_json_from_text(raw_response)
            if isinstance(parsed, dict):
                raw_cats = parsed.get("categories", [])
                for c in raw_cats:
                    if isinstance(c, dict):
                        categories.append(FileCategoryRecommendation(
                            category=c.get("category", "General"),
                            description=c.get("description", "Assorted files"),
                            suggested_folder=c.get("suggested_folder", "General"),
                            file_count=int(c.get("file_count", 0))
                        ))

                raw_plan = parsed.get("plan", [])
                for p in raw_plan:
                    if isinstance(p, dict):
                        plan.append(FilePlanItem(
                            original_name=p.get("original_name", ""),
                            proposed_category=p.get("proposed_category", "General"),
                            proposed_subfolder=p.get("proposed_subfolder", "General"),
                            destination_name=p.get("destination_name", p.get("original_name", "")),
                            reason=p.get("reason", "Extension and naming matching")
                        ))
        except Exception as err:
            logger.warning(f"File plan parsing error: {err}. Falling back to rule-based fallback.")
            # Deterministic rule-based fallback if model output failed to parse
            from app.services.file_organizer_service import generate_heuristic_file_plan
            heuristic = generate_heuristic_file_plan(files)
            categories = heuristic["categories"]
            plan = heuristic["plan"]

        # Ensure all original files have a plan entry
        existing_filenames = {p.original_name for p in plan}
        for f in files:
            name = f.get("name", "")
            if name and name not in existing_filenames:
                plan.append(FilePlanItem(
                    original_name=name,
                    proposed_category="Unsorted",
                    proposed_subfolder="Unsorted",
                    destination_name=name,
                    reason="Default placement"
                ))

        return {
            "categories": categories,
            "plan": plan,
            "model_used": model or settings.DEFAULT_MODEL,
            "total_files": len(files),
            "safety_notice": "Preview only. LazyFlow AI will never move, rename, or delete files without explicit approval."
        }

    async def generate_daily_briefing(
        self,
        tasks_data: Dict[str, Any],
        additional_notes: Optional[str] = None,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Creates an executive daily productivity briefing from actual user tasks and statistics.
        """
        total = tasks_data.get("total", 0)
        pending = tasks_data.get("pending", 0)
        completed = tasks_data.get("completed", 0)
        overdue_tasks = tasks_data.get("overdue_tasks", [])
        pending_list = tasks_data.get("pending_tasks_list", [])

        system_prompt = (
            "You are a top-tier executive productivity coach. You synthesize actual task lists and real project "
            "metrics into an energizing, actionable, and structured daily briefing. "
            "Never claim to access external calendars or emails. Rely strictly on the task data provided."
        )

        task_descriptions = "\n".join([
            f"- [{t.get('priority', 'medium').upper()}] {t.get('title')} (Due: {t.get('due_date') or 'No date'})"
            for t in pending_list[:15]
        ]) or "No pending tasks recorded."

        overdue_descriptions = "\n".join([
            f"- {t.get('title')} (Overdue since: {t.get('due_date')})"
            for t in overdue_tasks
        ]) or "None! All caught up on overdue items."

        notes_context = f"User Notes for Today: {additional_notes}" if additional_notes else ""

        prompt = f"""Generate a focused Daily Productivity Briefing based on real application task data:

REAL TASK DATA:
- Total Tasks in System: {total}
- Completed: {completed}
- Active / Pending: {pending}
- Overdue Tasks ({len(overdue_tasks)}):
{overdue_descriptions}

ACTIVE TASKS:
{task_descriptions}

{notes_context}

INSTRUCTIONS:
1. Provide a concise, high-level summary of today's focus (2-3 sentences).
2. Clearly list Top 3 Priorities for immediate momentum.
3. Provide Recommended Strategic Next Actions (bullet points).
4. Include a brief closing sentence to kickstart the day.

Format with clean markdown headings (### Executive Summary, ### Top Priorities, ### Recommended Next Actions)."""

        briefing_text = await self.client.generate(
            prompt=prompt,
            system=system_prompt,
            model=model,
            temperature=0.3
        )

        return {
            "briefing_content": briefing_text.strip(),
            "priorities_content": f"Pending: {pending} | Overdue: {len(overdue_tasks)} | Completed: {completed}",
            "recommended_actions": "Review top priorities and tackle high-impact items first.",
            "stats_snapshot": {
                "total": total,
                "pending": pending,
                "completed": completed,
                "overdue_count": len(overdue_tasks),
                "generated_at": datetime.now().isoformat()
            },
            "model_used": model or settings.DEFAULT_MODEL
        }

ai_service = AIService()
