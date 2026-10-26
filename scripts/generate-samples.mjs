// Pre-generates a short sample (preview.wav + preview.mp3) for every voice by
// calling the running Kokoro server. Run with the TTS server up on :8880.
import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const VOICES_DIR = path.join(process.cwd(), "data", "voices");
const KOKORO_URL = "http://localhost:8880";
const SAMPLE_TEXT =
  "This is a preview of my voice. I can narrate your scripts clearly and naturally.";

async function generateOne(voiceId) {
  const dir = path.join(VOICES_DIR, voiceId);
  const wavPath = path.join(dir, "preview.wav");
  const mp3Path = path.join(dir, "preview.mp3");

  const res = await fetch(`${KOKORO_URL}/v1/audio/speech`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: SAMPLE_TEXT, voice: voiceId, speed: 1.0 }),
  });

  if (!res.ok) throw new Error(`${voiceId}: HTTP ${res.status}`);

  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(wavPath, buf);

  await execFileAsync("ffmpeg", [
    "-i", wavPath, "-codec:a", "libmp3lame", "-qscale:a", "4", "-y", mp3Path,
  ]);
}

async function main() {
  const entries = await fs.readdir(VOICES_DIR, { withFileTypes: true });
  const voices = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  let done = 0;
  for (const voiceId of voices) {
    try {
      await generateOne(voiceId);
      done++;
      console.log(`[${done}/${voices.length}] ${voiceId} ✓`);
    } catch (err) {
      console.error(`[${voiceId}] FAILED: ${err.message}`);
    }
  }
  console.log(`Done — ${done}/${voices.length} samples generated.`);
}

main();
