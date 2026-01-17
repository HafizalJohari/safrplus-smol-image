# Manual - Starting Backend and Frontend

This guide will help you start both the backend (FastAPI) and frontend (React/Vite) servers for the SAFR+ Smol Image application.

## Prerequisites

- Python 3.13+ installed
- Node.js and npm installed
- Virtual environment activated (for backend)

## Backend Setup & Start

### 1. Navigate to the project root
```bash
cd /Users/hafizaljohari/safrplus-smol-image
```

### 2. Activate the virtual environment
```bash
source venv/bin/activate
```

### 3. Install dependencies (if not already installed)
```bash
cd backend
pip install -r requirements.txt
```

### 4. Start the backend server
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Or from the project root:
```bash
venv/bin/python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend will be available at:** `http://localhost:8000`

**Health check endpoint:** `http://localhost:8000/health`

## Frontend Setup & Start

### 1. Navigate to the frontend directory
```bash
cd /Users/hafizaljohari/safrplus-smol-image/frontend
```

### 2. Install dependencies (if not already installed)
```bash
npm install
```

### 3. Start the frontend development server
```bash
npm run dev
```

**Frontend will be available at:** `http://localhost:3000`

## Running Both Servers

### Option 1: Run in separate terminal windows/tabs

**Terminal 1 - Backend:**
```bash
cd /Users/hafizaljohari/safrplus-smol-image
source venv/bin/activate
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd /Users/hafizaljohari/safrplus-smol-image/frontend
npm run dev
```

### Option 2: Run in background (Unix/Mac)

**Backend (background):**
```bash
cd /Users/hafizaljohari/safrplus-smol-image
source venv/bin/activate
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
```

**Frontend (background):**
```bash
cd /Users/hafizaljohari/safrplus-smol-image/frontend
npm run dev &
```

## Verification

### Check Backend
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status":"ok","service":"SAFR+ Smol Image"}
```

### Check Frontend
Open your browser and navigate to:
```
http://localhost:3000
```

Or check via curl:
```bash
curl -I http://localhost:3000
```

## Stopping the Servers

### If running in foreground:
Press `Ctrl+C` in each terminal window

### If running in background:
Find and kill the processes:
```bash
# Kill backend (port 8000)
lsof -ti:8000 | xargs kill -9

# Kill frontend (port 3000)
lsof -ti:3000 | xargs kill -9
```

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

**Kill processes on port 8000 (backend):**
```bash
lsof -ti:8000 | xargs kill -9
```

**Kill processes on port 3000 (frontend):**
```bash
lsof -ti:3000 | xargs kill -9
```

### Backend Dependencies Missing

If backend fails to start:
```bash
cd backend
pip install -r requirements.txt
```

### Frontend Dependencies Missing

If frontend fails to start:
```bash
cd frontend
npm install
```

### Virtual Environment Issues

If Python virtual environment has issues:
```bash
# Use the full path to Python executable
/Users/hafizaljohari/safrplus-smol-image/venv/bin/python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

Once the backend is running, you can access:

- **Health Check:** `GET http://localhost:8000/health`
- **Compress Images:** `POST http://localhost:8000/compress`
  - Accepts: `files` (multipart/form-data), `quality` (int), `format` (string), `resize_factor` (int)

## Notes

- Both servers support hot-reload during development
- Backend runs on port 8000 by default
- Frontend runs on port 3000 (configured in `vite.config.js`)
- CORS is enabled on the backend to allow frontend connections
