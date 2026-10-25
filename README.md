# LazyFlow AI — Your Local AI Productivity Assistant

> **"Less busywork. More breathing room."**  
> *Built for the Hacktoberfest 2026 Open-Source AI Challenge — Week 3: "Slow and Steady"*

---

## 🌟 Executive Summary

**LazyFlow AI** is a modern, privacy-first local productivity dashboard designed to automate repetitive digital busywork without relying on centralized, paid cloud LLM APIs. By pairing **FastAPI**, **SQLite**, and **React** with local open-weight inference via **Ollama** and **Gemma 2**, LazyFlow AI keeps all personal notes, emails, research documents, and project data on your physical machine.

---

## 🎯 Problem Statement

Every day, knowledge workers, students, and software engineers spend hours on mental context switching and digital micro-tasks:
1. Sifting through dense technical documentation and articles to extract key takeaways.
2. Manually breaking down messy meeting notes or brainstorm logs into structured tasks.
3. Drafting polite, professional correspondence for repetitive scheduling or client updates.
4. Triaging cluttered download folders and desktop directories.
5. Reconstructing daily priorities from disparate task lists each morning.

Commercial solutions typically require uploading confidential notes and proprietary data to hosted cloud AI providers, incurring **recurring token subscription fees**, exposing sensitive data to third parties, and failing when offline.

**LazyFlow AI solves this with local open-weight AI: zero cloud API subscriptions, zero remote telemetry, and zero network dependency after setup.**

---

## ✨ Key Features & Productivity Workflows

| Tool | Capability | Local AI Role |
| :--- | :--- | :--- |
| **Overview Dashboard** | Real-time productivity metrics, quick-capture bar, active priority tasks, and recent activity feed. | Live connectivity status and telemetry. |
| **Smart Summarizer** | Distill long articles, transcripts, or notes with custom length (Concise, Standard, Detailed) and format (Bullets vs. Paragraph). | Executive synthesis without cloud upload. |
| **Task Generator** | Turn chaotic, unstructured notes into structured tasks with titles, descriptions, priorities, and deadlines (never hallucinates absent dates). | Structured JSON extraction and normalization. |
| **Email Assistant** | Draft refined replies and announcements across 4 distinct tones (Professional, Friendly, Concise, Formal). Strictly previews drafts; never accesses mailboxes. | Situation and tone-tailored generation. |
| **File Organizer** | Safely analyze directory filenames and extensions to recommend intuitive folder hierarchies. Includes full preview and safe script export. | Semantic category clustering and move planning. |
| **Daily Briefing** | Synthesize live SQLite tasks and user energy levels into a strategic morning executive summary with top 3 priorities and next actions. | Real-data workflow analysis and coaching. |
| **Settings & Engine** | Live Ollama health check, dynamic model switching, hardware recommendations, and setup terminal guides. | Runtime configuration management. |

---

## 🏗️ Architecture Overview

LazyFlow AI is engineered as a decoupled full-stack architecture running entirely on `localhost`:

```
┌────────────────────────────────────────────────────────┐
│                   React 19 + Vite UI                   │
│   (Tailwind CSS, Lucide Icons, Responsive Dashboard)   │
│                 http://localhost:5173                  │
└───────────────────────────▲────────────────────────────┘
                            │ HTTP / JSON REST
┌───────────────────────────▼────────────────────────────┐
│                  FastAPI Backend Server                │
│    (Pydantic Schemas, CORS Middleware, Lifespan Init)   │
│                 http://127.0.0.1:8000                  │
├───────────────────────────┬────────────────────────────┤
│     SQLite Persistence    │     Local Ollama Client    │
│       (lazyflow.db)       │   (http://127.0.0.1:11434) │
└───────────────────────────┴─────────────▲──────────────┘
                                          │ Local HTTP
                            ┌─────────────▼──────────────┐
                            │      Ollama Daemon         │
                            │  Gemma 2 (2B / 9B) Weights │
                            │     Local Hardware/CPU     │
                            └────────────────────────────┘
```

---

## 💻 Technology Stack

### Frontend
- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v3 with customized typography & neutral palette
- **Icons**: Lucide React
- **Architecture**: Modular Services (`/api/client.js`), Context Providers (`AIStatusContext`, `ToastContext`), Reusable Modals & Notification Banners.

### Backend
- **Runtime**: Python 3.13 / 3.11+
- **Framework**: FastAPI (Async ASGI)
- **Validation**: Pydantic v2 (ConfigDict, strict schema validation)
- **ORM & Storage**: SQLAlchemy with SQLite (`lazyflow.db`)
- **HTTP Client**: HTTPX (Async HTTP communication with Ollama)
- **Testing**: Pytest & Pytest-Asyncio with in-memory SQLite and mocked AI client fixtures.

### AI Engine
- **Inference Server**: Ollama (Windows native / CLI)
- **Default Model**: **Gemma 2 (2B)** (`gemma2:2b` — 1.6 GB 4-bit quantized)
- **Compatible Models**: `gemma2:9b`, `llama3.2`, `mistral`, `qwen2.5`
- **Communication Protocol**: Local HTTP REST (`/api/generate`, `/api/tags`)

---

## 🚀 Prerequisites

Before running LazyFlow AI, ensure the following are installed on your Windows machine:

1. **Python 3.11+** (Python 3.13 verified)
2. **Node.js 18+** (Node v22.19 verified with npm)
3. **Ollama for Windows**: Download from [ollama.com/download/windows](https://ollama.com/download/windows)

---

## 📦 Installation & Setup Guide

### 1. Ollama Setup & Model Download

Open a terminal (PowerShell or Command Prompt) and verify Ollama is installed:

```powershell
ollama --version
```

Start the Ollama local background daemon (if not already running in Windows system tray):

```powershell
ollama serve
```

Download the recommended open-weight model (**Gemma 2 2B**):

```powershell
ollama pull gemma2:2b
```

Verify that the model downloaded successfully:

```powershell
ollama list
```

*(Note: Model weights require an initial download over the internet. Once downloaded to disk, all subsequent inference runs completely offline.)*

---

### 2. Backend Setup

Open a PowerShell terminal and navigate to the project directory:

```powershell
cd C:\Users\Akshra\.gemini\antigravity\scratch\lazyflow-ai
```

Create and activate a dedicated Python virtual environment:

```powershell
python -m venv backend\.venv
.\backend\.venv\Scripts\Activate.ps1
```

Install backend dependencies:

```powershell
.\backend\.venv\Scripts\pip install -r backend\requirements.txt
```

Launch the FastAPI backend server:

```powershell
$env:PYTHONPATH="backend"
.\backend\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend is now live at:
- **API Base**: `http://127.0.0.1:8000`
- **Interactive OpenAPI Docs**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/api/health`

---

### 3. Frontend Setup

Open a second terminal window:

```powershell
cd C:\Users\Akshra\.gemini\antigravity\scratch\lazyflow-ai\frontend
```

Install frontend packages:

```powershell
npm install
```

Start the Vite development server:

```powershell
npm run dev
```

Open your browser and navigate to:
👉 **`http://localhost:5173`**

---

## 🧪 Automated Testing

LazyFlow AI includes an automated test suite verifying health checks, schema validation, task extraction rules (e.g. deadline non-invention), error handling when Ollama is offline, and SQLite database persistence.

To execute the test suite:

```powershell
cd C:\Users\Akshra\.gemini\antigravity\scratch\lazyflow-ai
$env:PYTHONPATH="backend"
.\backend\.venv\Scripts\pytest backend\tests -v
```

All tests mock the external AI client, allowing the entire suite to execute deterministically in **less than 1 second** without requiring active model loading.

---

## 📡 API Endpoint Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Complete system health, version, and live Ollama connectivity check. |
| `GET` | `/api/ollama/status` | Ollama service status and list of installed models. |
| `GET` | `/api/dashboard/stats` | Dynamic statistics from SQLite (task counts, time saved, activity). |
| `GET` | `/api/tasks` | Retrieve tasks with optional `?status=all\|pending\|completed` filter. |
| `POST` | `/api/tasks` | Create a new task in SQLite. |
| `PATCH` | `/api/tasks/{id}` | Update task details or toggle completion status. |
| `DELETE` | `/api/tasks/{id}` | Delete a task. |
| `POST` | `/api/tasks/generate` | Extract structured tasks from raw user notes using local AI. |
| `POST` | `/api/tasks/bulk` | Save multiple generated tasks in a single transaction. |
| `POST` | `/api/summaries/generate` | Summarize long text using local AI with custom length and format. |
| `POST` | `/api/summaries` | Save a summary to SQLite history. |
| `GET` | `/api/summaries` | List all saved summaries. |
| `DELETE` | `/api/summaries/{id}` | Delete a saved summary. |
| `POST` | `/api/emails/generate` | Generate email drafts across 4 tones (Professional, Friendly, Concise, Formal). |
| `POST` | `/api/emails` | Save an email draft to SQLite history. |
| `GET` | `/api/emails` | List all saved email drafts. |
| `DELETE` | `/api/emails/{id}` | Delete a saved email draft. |
| `POST` | `/api/files/organize` | Analyze filenames and metadata to generate organization recommendations. |
| `POST` | `/api/files/execute` | Safely apply moves to a local directory with path traversal protection. |
| `POST` | `/api/briefings/generate` | Generate an executive daily briefing synthesized from live SQLite task data. |
| `POST` | `/api/briefings` | Save a daily briefing to history. |
| `GET` | `/api/briefings` | List saved past briefings. |
| `GET` | `/api/settings` | Retrieve active configurations (e.g. selected model). |
| `POST` | `/api/settings` | Update configuration key/value in SQLite. |

---

## 🛡️ Safety & Privacy Design Principles

1. **Zero Cloud AI Egress**: Prompts and generated content are transmitted exclusively across `localhost` (`127.0.0.1`). No third-party API keys or remote tokens exist in the codebase.
2. **File Safety Controls**: The File Organizer never uploads file contents (only filenames and extensions are analyzed). It never silently moves or deletes files. All moves require explicit user review and path validation preventing directory traversal.
3. **No Mailbox Intrusion**: The Email Assistant does not connect to user email accounts or send emails automatically. It serves strictly as a safe drafting environment.
4. **Honest AI Output**: The Task Generator is strictly prompted and validated to avoid inventing deadlines that were not explicitly stated in the user's input notes.

---

## 💡 Open Innovation: Why Open-Weight AI Matters

The Hacktoberfest 2026 Open-Source AI Challenge celebrates the power of decentralized intelligence. LazyFlow AI highlights the real-world advantages of open weights:

- **Data Privacy & Compliance**: Personal thoughts, internal company reports, and private code snippets stay within your hardware perimeter.
- **Economic Freedom**: Operating AI without ongoing per-token invoices or subscription caps democratizes access for students and independent builders.
- **Offline Resilience**: Once downloaded, local inference operates reliably without cellular or Wi-Fi connectivity.
- **Model Flexibility**: Users can swap between models (`gemma2:2b`, `llama3.2`, `mistral`) or deploy custom fine-tuned weights based on their specific hardware capabilities.

### Hardware Guidance
- **Gemma 2 (2B)**: Runs smoothly on standard CPU or integrated graphics with 8GB RAM.
- **Gemma 2 (9B)**: Recommended for machines with 16GB RAM or a dedicated 8GB+ VRAM GPU.

---

## 📄 License & Attribution

- **Backend & Frontend Code**: Open-source under the MIT License.
- **Gemma 2 Model**: Distributed by Google under the [Gemma Open Model Terms of Use](https://ai.google.dev/gemma/terms).
- **Ollama**: Open-source local inference runtime under the MIT License.

---
## 👩‍💻 Author

**Akshra**

* GitHub: [@akshrapsit1256](https://github.com/akshrapsit1256)
* Project: [LazyFlow AI](https://github.com/akshrapsit1256/LazyFlow-AI)

Built with ❤️ using React, FastAPI, SQLite, and Ollama.

*LazyFlow AI — Hacktoberfest 2026 Open-Source AI Challenge.*
