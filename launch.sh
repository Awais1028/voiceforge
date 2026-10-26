#!/bin/bash
# VoiceForge launcher — starts the TTS server and the web app together,
# then opens the browser. Ctrl+C stops both.
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "Starting Kokoro TTS server (fast engine)…"
(cd "$ROOT/tts-server" && source venv/bin/activate && python server.py) &
KOKORO_PID=$!

echo "Starting Orpheus TTS server (emotional engine)…"
(cd "$ROOT/tts-server" && source venv-orpheus/bin/activate && python orpheus_server.py) &
ORPHEUS_PID=$!

echo "Starting VoiceForge web app…"
npm run dev &
WEB_PID=$!

cleanup() {
  echo "\nShutting down…"
  kill $KOKORO_PID $ORPHEUS_PID $WEB_PID 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

# wait for the web app, then open the browser
sleep 4
open http://localhost:3000 2>/dev/null || open http://localhost:3001 2>/dev/null || true

wait
