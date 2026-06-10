import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from backend.services.crisis_detector import detect_crisis
from backend.services.memory_service import memory_manager
from backend.services.openai_service import generate_chat_response

# Load environment variables from .env if present
load_dotenv()

app = FastAPI(
    title="Mental Health First Response Chatbot API",
    description="A FastAPI backend for crisis detection, knowledge-base querying, and empathetic AI chat.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, restrict this to the frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KNOWLEDGE_BASE_PATH = os.path.join(BASE_DIR, "..", "knowledge_base", "mental_health_data.json")
SYSTEM_PROMPT_PATH = os.path.join(BASE_DIR, "..", "prompts", "system_prompt.txt")

# Load Knowledge Base on startup
mental_health_data = {}
try:
    with open(KNOWLEDGE_BASE_PATH, "r", encoding="utf-8") as f:
        mental_health_data = json.load(f)
    print("Successfully loaded mental_health_data.json")
except Exception as e:
    print(f"Error loading mental_health_data.json: {e}")

# Load System Prompt Template on startup
system_prompt_template = ""
try:
    with open(SYSTEM_PROMPT_PATH, "r", encoding="utf-8") as f:
        system_prompt_template = f.read()
    print("Successfully loaded system_prompt.txt")
except Exception as e:
    print(f"Error loading system_prompt.txt: {e}")


# Pydantic Schemas
class ChatRequest(BaseModel):
    message: str = Field(..., example="I feel extremely stressed about my exams.")
    session_id: str = Field(..., example="session_12345")

class ChatResponse(BaseModel):
    reply: str
    is_crisis: bool
    helplines: list[str] = []
    category: str = ""

class ClearSessionRequest(BaseModel):
    session_id: str


@app.get("/health")
def health_check():
    """
    Simple health check endpoint.
    """
    return {"status": "healthy"}


@app.get("/knowledge")
def get_knowledge_base():
    """
    Exposes the 10 mental health concern categories and their information.
    """
    return mental_health_data


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest):
    """
    Main chat completion endpoint. Runs local crisis detection, updates session memory,
    and returns either an emergency response or an OpenAI chat completion.
    """
    user_message = payload.message.strip()
    session_id = payload.session_id.strip()

    if not user_message:
        return ChatResponse(
            reply="It looks like your message was empty. I am here to listen if you want to share what's on your mind.",
            is_crisis=False
        )

    # 1. Run local crisis keyword detection
    crisis_result = detect_crisis(user_message)
    if crisis_result["is_crisis"]:
        # Immediately clear memory for the session to prevent LLM context confusion with crisis details
        memory_manager.clear_history(session_id)
        return ChatResponse(
            reply=crisis_result["message"],
            is_crisis=True,
            helplines=crisis_result["helplines"],
            category=crisis_result["category"]
        )

    # 2. Retrieve conversation memory
    session_history = memory_manager.get_history(session_id)

    # 3. Add user's message to memory
    memory_manager.add_message(session_id, "user", user_message)

    # 4. Formulate the dynamic system prompt with the knowledge base injected
    kb_str = json.dumps(mental_health_data, indent=2)
    system_prompt = system_prompt_template.replace("{knowledge_base_json}", kb_str)

    # 5. Call OpenAI Completion (or smart fallback)
    try:
        assistant_reply = generate_chat_response(session_history, system_prompt)
    except Exception as e:
        # Final safeguard in case of backend crashes
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {str(e)}")

    # 6. Add assistant response to memory
    memory_manager.add_message(session_id, "assistant", assistant_reply)

    return ChatResponse(
        reply=assistant_reply,
        is_crisis=False,
        helplines=[],
        category=""
    )


@app.post("/clear")
def clear_session_endpoint(payload: ClearSessionRequest):
    """
    Endpoint to clear memory history for a session.
    """
    memory_manager.clear_history(payload.session_id)
    return {"status": "success", "message": f"Session {payload.session_id} memory cleared."}
