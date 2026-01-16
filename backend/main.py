from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image, ImageOps
import pillow_heif
import io
import base64
from typing import List, Optional

# Register HEIC opener
pillow_heif.register_heif_opener()

app = FastAPI(title="SAFR+ Smol Image API")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For local dev, allow all. In prod, lock this down.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def process_image(file_content: bytes, filename: str, quality: int, format: str, resize_factor: int):
    try:
        # Open Image
        img = Image.open(io.BytesIO(file_content))
        original_size = len(file_content)
        
        # 1. Check orientation
        img = ImageOps.exif_transpose(img)
        
        # 2. Resize
        if resize_factor < 100:
            width, height = img.size
            new_width = int(width * (resize_factor / 100))
            new_height = int(height * (resize_factor / 100))
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
        # 3. Compress
        compressed_buffer = io.BytesIO()
        
        # Handle Format
        target_format = format.upper()
        if target_format == 'JPEG' and img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
            
        img.save(compressed_buffer, format=target_format, quality=quality, optimize=True)
        compressed_data = compressed_buffer.getvalue()
        compressed_size = len(compressed_data)
        
        # Calculate Savings
        savings_pct = 0
        if original_size > 0:
            savings_pct = (1 - (compressed_size / original_size)) * 100
            
        # Encode to Base64 for frontend display/download
        # We use a data URI scheme
        mime_type = f"image/{target_format.lower()}"
        b64_str = base64.b64encode(compressed_data).decode('utf-8')
        data_uri = f"data:{mime_type};base64,{b64_str}"
        
        return {
            "name": filename,
            "original_size": original_size,
            "compressed_size": compressed_size,
            "savings_pct": round(savings_pct, 1),
            "data_uri": data_uri,
            "mime_type": mime_type
        }
        
    except Exception as e:
        print(f"Error checking file {filename}: {str(e)}")
        return None

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "SAFR+ Smol Image"}

@app.post("/compress")
async def compress_images(
    files: List[UploadFile] = File(...),
    quality: int = Form(80),
    format: str = Form("WEBP"),
    resize_factor: int = Form(100)
):
    results = []
    
    for file in files:
        content = await file.read()
        res = process_image(content, file.filename, quality, format, resize_factor)
        if res:
            results.append(res)
        else:
            # Handle error gracefully - for now just skip
            pass
            
    return JSONResponse(content={"results": results})
