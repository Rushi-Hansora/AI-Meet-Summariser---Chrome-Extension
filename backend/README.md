# Local AI Backend (FastAPI + Ollama + Qwen3 4B)

Private, offline AI backend for the **AI Meet Summariser Chrome Extension**.

---

## Prerequisites

1. **Python 3.10+**
2. **Ollama**: Download and install from [ollama.com](https://ollama.com/download/windows)
3. **Qwen3 4B Model**:
   ```bash
   ollama pull qwen3:4b
   ```

---

## Setup & Installation

### 1. Create Virtual Environment
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```
*(The backend also automatically reads `.env` from the project root if present.)*

---

## Running the Server

### 1. Verify Ollama is Running
```powershell
ollama list
```

### 2. Start FastAPI Server
```powershell
python main.py
```
Or with Uvicorn directly:
```powershell
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

---

## API Endpoints

- `GET /` — Service status and active model
- `GET /health` — Health check verifying connection to local Ollama instance
- `POST /summarize` — Generate structured meeting summary from transcript text
- `GET /docs` — Interactive Swagger UI documentation (visit in browser at `http://127.0.0.1:8000/docs`)
