# VoiceForge

A local, ElevenLabs-style text-to-speech studio. Write a script, pick a voice, and generate narration on your own machine, with no API key and no per-character cost.

VoiceForge pairs a Next.js web app with two self-hosted TTS engines behind one provider interface:

- **Kokoro** (`kokoro-onnx`, CPU via onnxruntime): fast, clean narration with a library of preset voices.
- **Orpheus 3B** (GGUF via `llama.cpp` with Metal, decoded with SNAC): expressive speech with inline emotion tags such as `<laugh>`, `<sigh>`, `<gasp>` and `<chuckle>`.

## Features

- Projects with a script editor, generation, and an output history (WAV and MP3 via ffmpeg)
- Voice library: each voice is a `data/voices/<id>/voice.json` mapped to an engine and a model voice
- Pluggable provider layer (`src/lib/providers/`): the app talks to every engine through the same `TTSProvider` interface, so adding an engine means adding one provider
- Long-script handling for Orpheus: its context is about 4096 tokens and it is tuned for short utterances, so scripts are split into sentences (keeping emotion tags attached), generated one by one, and concatenated
- Engine health checks and a system monitor in the UI
- `comparison/` scripts that render the same lines through Kokoro, Orpheus and F5-TTS to compare quality and tone

## Architecture

```
Next.js app (React 19, Zustand, zod, shadcn/ui)
   │  /api/projects/[id]/generate  → provider for the selected engine
   ├── Kokoro provider  → FastAPI server :8880  (kokoro-onnx, CPU)
   └── Orpheus provider → FastAPI server :8881  (llama.cpp + SNAC, Metal/MPS)
```

Both servers expose the same small API: `GET /health`, `POST /v1/audio/speech`, `GET /v1/voices`.

## Setup

Requirements: Node.js, Python 3.13 (onnxruntime has no 3.14 wheels yet), ffmpeg.

```bash
npm install
```

### Kokoro server

```bash
cd tts-server
python3.13 -m venv venv
source venv/bin/activate
pip install "kokoro-onnx==0.5.0" soundfile fastapi uvicorn
curl -L -o kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -L -o voices-v1.0.bin  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
```

### Orpheus server (optional, expressive engine)

```bash
cd tts-server
python3.13 -m venv venv-orpheus
source venv-orpheus/bin/activate
pip install llama-cpp-python snac torch numpy soundfile fastapi uvicorn
```

Place an Orpheus 3B `Q4_K_M` GGUF quantization at `tts-server/orpheus-3b-Q4_K_M.gguf`. The SNAC decoder (`hubertsiuzdak/snac_24khz`) downloads on first run.

Model files are not committed (the Orpheus GGUF alone is about 2.2 GB).

## Run

```bash
./launch.sh
```

This starts both TTS servers and the web app, then opens http://localhost:3000. Ctrl+C stops everything.
