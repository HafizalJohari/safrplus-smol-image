# SAFR+ Smol Image

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

> A premium, local-first image compression tool built for privacy and performance.

**SAFR+ Smol Image** allows you to compress your images (JPEG, PNG, WebP) and convert HEIC files directly on your machine. No data is ever sent to the cloud.

## Features

- **Privacy Focused**: All image processing is done locally using Python's Pillow library.
- **Premium UI**: Modern, glassmorphic interface built with React, Tailwind CSS, and Framer Motion.
- **Real-time Feedback**: Instant preview and compression statistics.
- **HEIC Support**: Native support for iPhone/Apple `.heic` photos.
- **Bulk Actions**: Drag & drop multiple files and download them as a single **ZIP** archive.
- **Fine-grained Control**: Adjust quality, resize factor, and output format.

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS v4, Framer Motion, Lucide Icons.
- **Backend**: FastAPI, Pillow (PIL), Pillow-HEIF.

## Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- **Python 3.9+**
- **Node.js 20+** (Recommended)

### 1. Clone the Repository

```bash
git clone https://github.com/HafizalJohari/safrplus-smol-image.git
cd safrplus-smol-image
```

### 2. Backend Setup

Set up the Python environment and install dependencies.

```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 3. Frontend Setup

Install the Node.js dependencies.

```bash
cd frontend
npm install
```

## Running the Application

You need to run both the backend and frontend servers.

### 1. Start the Backend API

Open a terminal at the project root:

```bash
source venv/bin/activate
uvicorn backend.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

### 2. Start the Frontend UI

Open a **new terminal**, navigate to the frontend folder, and start the dev server:

```bash
cd frontend
npm run dev
```

Visit **`http://localhost:5173`** in your browser to start compressing images!

## Screenshots

*(Add screenshots of your application here)*

## License

This project is open source and available under the MIT License.
