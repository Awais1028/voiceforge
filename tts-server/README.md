# VoiceForge TTS Server (DIY Kokoro)

A minimal local TTS server wrapping `kokoro-onnx`. Exposes the two endpoints the
Next.js app calls: `GET /health` and `POST /v1/audio/speech`. Runs on CPU via
onnxruntime — works fine on Apple Silicon.

## One-time setup

> Use **Python 3.13**, not 3.14. As of this writing `onnxruntime` has no 3.14
> wheels and pip will fail trying to build from source.

```bash
cd tts-server
python3.13 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install "kokoro-onnx==0.5.0" soundfile fastapi uvicorn
```

Model files (already downloaded; re-fetch if missing):

```bash
curl -L -o kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -L -o voices-v1.0.bin  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
```

## Run

```bash
source venv/bin/activate
python server.py        # serves http://localhost:8880
```

Or from the project root, start everything at once: `./launch.sh`

## Adding voices

`GET http://localhost:8880/v1/voices` lists every voice the model supports
(af_heart, af_bella, am_michael, bf_emma, …). To expose one in the app, create
`data/voices/<id>/voice.json` and set its `voiceId` field to the model voice name.
The app's internal id is translated to that `voiceId` before the model is called.
