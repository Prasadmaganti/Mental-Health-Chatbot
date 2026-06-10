# 🌸 Lumina: Emotional First Response Chatbot

Lumina is a warm, comforting, and deeply friendly emotional support companion designed to act as a first-response assistant for mental health concerns. Lumina listens empathetically, validates feelings like a close friend, and guides users through evidence-based coping exercises and practical suggestions.

> [!IMPORTANT]
> **Safety Disclaimer**: Lumina is an AI support assistant. It is **NOT** a licensed therapist, clinical service, or emergency resource. It cannot diagnose medical conditions, prescribe treatments, or substitute professional medical advice. If a user is experiencing a life-threatening crisis, Lumina active keyword-interception redirects them immediately to emergency resources.

---

## 🌟 Key Features

- **Empathetic Interactions**: Friendly conversational style with comfort emojis and validation.
- **Suggestions & Coping Exercises**: Delivers tailored suggestions and exercises (like Box Breathing or 5-4-3-2-1 Grounding) across 10 mental health concern categories (Stress, Loneliness, Academic Pressure, Sleep, Self-Esteem, etc.).
- **Active Crisis Detection**: Scans inputs for signs of suicide, self-harm, abuse, or violence and intercepts them with a safety block containing direct crisis helplines.
- **Double-Layered Defense**: Crisis keyword detection runs both locally in the browser and in the FastAPI backend for redundant safety.
- **Seamless Local Fallback**: Automatically and silently transitions to local emulation mode when LLM API keys are rate-limited, expired, or unavailable.
- **Premium UI/UX**: Clean layout featuring dark/light mode toggle, chat history persistence (`localStorage`), new session creation, and responsive helplines sidebar.

---

## 🛠️ Technology Stack

### Backend
- **Core Framework**: FastAPI (Python)
- **ASGI Server**: Uvicorn
- **AI Integration**: OpenAI SDK / REST calls supporting OpenAI (GPT-4o-mini), Google Gemini, and Grok (xAI) API keys with failover rotation.
- **Testing**: Pytest

### Frontend
- **Framework**: Next.js 14 (React & TypeScript)
- **Styling**: Tailwind CSS & Lucide Icons
- **State & Storage**: React Hook state with `localStorage` persistence.

---

## 🚀 Getting Started

Follow these steps to set up and run the backend and frontend locally.

### Prerequisites
- Python 3.10+ installed
- Node.js 18+ and npm installed
- `uv` Python package manager (recommended) or `pip`

---

### 1. Backend Setup

Navigate to the `backend/` folder:
```bash
cd backend
```

Create a virtual environment and install dependencies:
```bash
# Using uv (fastest)
uv venv
uv pip install -r requirements.txt

# Or using standard pip
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

#### Environment Variables Configuration
Create a `.env` file inside the `backend/` directory:
```env
# Place one or more API Keys separated by commas for failover rotation:
OPENAI_API_KEYS=your_openai_key_here,your_gemini_key_here
```
*(If no keys are provided, the backend seamlessly runs in Local Emulation Mode using the localized knowledge base data).*

#### Run the Backend Server
Start the FastAPI app on port 8000:
```bash
# Using uv
uv run uvicorn main:app --host 127.0.0.1 --port 8000

# Or standard python
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```
- Health Check URL: [http://localhost:8000/health](http://localhost:8000/health)
- Interactive API docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 2. Frontend Setup

Navigate to the `frontend/` folder:
```bash
cd ../frontend
```

Install the dependencies:
```bash
npm install
```

#### Run the Frontend Dev Server
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to interact with Lumina.

---

## 🧪 Running Automated Tests

We maintain a set of backend unit tests covering endpoint routing, mock fallback triggers, crisis keyword interceptions, and memory state.

To run the backend test suite:
1. Ensure you are at the project root directory.
2. Run pytest with the python path set to the current directory:
```powershell
# In PowerShell (Windows)
$env:PYTHONPATH="."
uv run --python backend/.venv pytest

# In Bash (macOS/Linux)
PYTHONPATH=. pytest
```

---

## 📂 Project Directory Structure

```
├── backend/
│   ├── main.py                     # FastAPI routes and server config
│   ├── services/
│   │   ├── crisis_detector.py      # Regex patterns for crisis monitoring
│   │   ├── memory_service.py       # Conversational memory state
│   │   └── openai_service.py       # API routing and fallback generator
│   └── tests/
│       └── test_endpoints.py       # Pytest backend test suite
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css         # UI themes & styles
│   │   │   ├── layout.tsx          # Next.js app wrapper
│   │   │   └── page.tsx            # Main Chat interface and local fallback logic
│   │   └── data/
│   │       └── mental_health_data.json # Local client validation and strategies copy
├── knowledge_base/
│   └── mental_health_data.json     # Backend fallback validation copy
└── prompts/
    └── system_prompt.txt           # Lumina system instruction template
```