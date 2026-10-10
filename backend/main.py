import os
import requests
from typing import Optional
from pathlib import Path
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# --- Load Environment Variables ---
# Look for .env in backend directory, then fallback to root workspace .env
backend_env = Path(__file__).resolve().parent / ".env"
root_env = Path(__file__).resolve().parent.parent / ".env"

if backend_env.exists():
    load_dotenv(dotenv_path=backend_env)
elif root_env.exists():
    load_dotenv(dotenv_path=root_env)
else:
    load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/chat")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:1.7b")
ALLOWED_ORIGINS_RAW = os.getenv("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_RAW.split(",") if origin.strip()] or ["*"]
INFERENCE_TIMEOUT = int(os.getenv("INFERENCE_TIMEOUT_SECONDS", "300"))

# --- Initialize FastAPI Application ---
app = FastAPI(
    title="AI Meet Summariser - Local AI Backend",
    version="1.0.0",
    description="Local FastAPI bridge to Ollama (Qwen3 1.7B) for offline meeting summarization."
)

# --- CORS Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Request / Response Schemas ---
class TranscriptRequest(BaseModel):
    transcript: str = Field(..., min_length=1, description="Raw closed caption transcript text from Google Meet")
    prompt: Optional[str] = Field(None, description="Optional custom prompt. If omitted, default structured meeting prompt is used.")
    model: Optional[str] = Field(None, description="Optional Ollama model name (e.g. qwen3:1.7b). Defaults to backend configured model.")

class SummarizeResponse(BaseModel):
    model: str
    result: str
    status: str = "success"

# --- Endpoints ---
@app.get("/", tags=["Health"])
def root():
    """Root info endpoint verifying service state."""
    return {
        "status": "online",
        "service": "AI Meet Summariser Local AI",
        "model": OLLAMA_MODEL,
        "ollama_endpoint": OLLAMA_URL
    }

@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint to test connection to local Ollama instance."""
    try:
        base_ollama = OLLAMA_URL.rsplit("/api/", 1)[0]
        check_url = f"{base_ollama}/api/tags"
        resp = requests.get(check_url, timeout=5)
        if resp.status_code == 200:
            models_data = resp.json().get("models", [])
            available_models = [m.get("name") for m in models_data if "name" in m]
            return {
                "status": "healthy",
                "ollama_status": "reachable",
                "model": OLLAMA_MODEL,
                "available_models": available_models
            }
        return {"status": "degraded", "ollama_status": f"HTTP {resp.status_code}"}
    except requests.exceptions.RequestException as e:
        return {
            "status": "unhealthy",
            "ollama_status": "unreachable",
            "detail": f"Could not connect to Ollama at {OLLAMA_URL}. Ensure Ollama is running."
        }

@app.post("/summarize", response_model=SummarizeResponse, tags=["Summarization"])
def summarize(request: TranscriptRequest):
    """
    Summarize a meeting transcript using the local Ollama LLM.
    Returns structured Summary, Key Points, Q&A, and Action Items.
    """
    if not request.transcript.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript cannot be empty."
        )

    if request.prompt and request.prompt.strip():
        final_prompt = request.prompt
    else:
        final_prompt = f"""You are an AI meeting assistant. Analyze the meeting transcript below.
Return the result using exactly these sections:

SUMMARY:
Write a concise summary of the meeting.

KEY_POINTS:
- Point 1
- Point 2

QA:
Q: Question
A: Answer

ACTION_ITEMS:
- Task | Owner | Deadline

Do not invent information not present in the transcript.

Meeting Transcript:
{request.transcript}"""

    target_model = (request.model.strip() if request.model and request.model.strip() else None) or OLLAMA_MODEL

    payload = {
        "model": target_model,
        "messages": [
            {
                "role": "system",
                "content": "You are a professional meeting summarization assistant. Be concise, precise, and factual."
            },
            {"role": "user", "content": final_prompt}
        ],
        "options": {
            "num_ctx": 2048,
            "num_predict": 512
        },
        "stream": False,
        "think": False  # Disable extended chain-of-thought to maximize response speed
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=INFERENCE_TIMEOUT)
        response.raise_for_status()
        data = response.json()
        
        result_text = data.get("message", {}).get("content", "")
        if not result_text:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Ollama returned an empty response."
            )
            
        return SummarizeResponse(
            model=target_model,
            result=result_text,
            status="success"
        )
    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Cannot connect to Ollama at {OLLAMA_URL}. Ensure Ollama is running via 'ollama serve' or desktop app."
        )
    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"Inference timed out after {INFERENCE_TIMEOUT} seconds. Consider using a smaller model or shorter transcript."
        )
    except requests.exceptions.HTTPError as err:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Ollama returned HTTP error: {err.response.status_code} - {err.response.text}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("BACKEND_HOST", "127.0.0.1")
    port = int(os.getenv("BACKEND_PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
