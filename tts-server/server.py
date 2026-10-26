"""
VoiceForge local TTS server — DIY Kokoro wrapper.

Exposes the two endpoints the Next.js KokoroProvider calls:
  GET  /health              → { "status": "ok" }
  POST /v1/audio/speech     → WAV bytes  (OpenAI-compatible shape)

Run:  source venv/bin/activate && python server.py
Serves on http://localhost:8880
"""

import io
import os

import soundfile as sf
import uvicorn
from fastapi import FastAPI, Response
from fastapi.responses import JSONResponse
from kokoro_onnx import Kokoro
from pydantic import BaseModel

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(HERE, "kokoro-v1.0.onnx")
VOICES_PATH = os.path.join(HERE, "voices-v1.0.bin")

app = FastAPI(title="VoiceForge TTS")

print("Loading Kokoro model… (first load takes a few seconds)")
kokoro = Kokoro(MODEL_PATH, VOICES_PATH)
print("Model loaded. Ready on http://localhost:8880")


class SpeechRequest(BaseModel):
    model: str = "kokoro"
    input: str
    voice: str = "af_heart"
    speed: float = 1.0
    response_format: str = "wav"
    lang: str = "en-us"


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/v1/audio/speech")
def speech(req: SpeechRequest):
    text = req.input.strip()
    if not text:
        return JSONResponse({"error": "input is empty"}, status_code=400)

    try:
        samples, sample_rate = kokoro.create(
            text,
            voice=req.voice,
            speed=req.speed,
            lang=req.lang,
        )
    except Exception as exc:  # surface model errors to the client
        return JSONResponse({"error": str(exc)}, status_code=500)

    buffer = io.BytesIO()
    sf.write(buffer, samples, sample_rate, format="WAV")
    buffer.seek(0)

    return Response(content=buffer.read(), media_type="audio/wav")


@app.get("/v1/voices")
def voices():
    return {"voices": sorted(kokoro.get_voices())}


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8880, log_level="info")
