// Generates data/voices/<id>/voice.json for the English Kokoro voices,
// with human-friendly names, accent, gender, and descriptive tags.
import fs from "fs/promises";
import path from "path";

const VOICES_DIR = path.join(process.cwd(), "data", "voices");

// Hand-written character notes so the library reads like a real voice catalog.
const CATALOG = [
  // American Female
  ["af_heart", "Heart", "American", "female", "Warm, friendly, expressive — great all-round narrator.", ["warm", "narration", "youtube"]],
  ["af_bella", "Bella", "American", "female", "Bright and energetic. Good for upbeat content.", ["bright", "energetic"]],
  ["af_nova", "Nova", "American", "female", "Smooth and modern. Clean podcast feel.", ["smooth", "podcast"]],
  ["af_sarah", "Sarah", "American", "female", "Calm and clear. Reliable for explainers.", ["calm", "clear", "explainer"]],
  ["af_sky", "Sky", "American", "female", "Light, airy, youthful tone.", ["light", "youthful"]],
  ["af_alloy", "Alloy", "American", "female", "Neutral and balanced. Professional default.", ["neutral", "professional"]],
  ["af_aoede", "Aoede", "American", "female", "Melodic and soft. Storytelling.", ["soft", "storytelling"]],
  ["af_jessica", "Jessica", "American", "female", "Confident and crisp.", ["confident", "crisp"]],
  ["af_kore", "Kore", "American", "female", "Measured and articulate.", ["measured", "articulate"]],
  ["af_nicole", "Nicole", "American", "female", "Intimate, close-mic ASMR-style delivery.", ["intimate", "asmr"]],
  ["af_river", "River", "American", "female", "Relaxed and natural.", ["relaxed", "natural"]],
  // American Male
  ["am_michael", "Michael", "American", "male", "Deep, steady, trustworthy — classic narrator.", ["deep", "narration", "youtube"]],
  ["am_adam", "Adam", "American", "male", "Strong and grounded. Documentary feel.", ["strong", "documentary"]],
  ["am_onyx", "Onyx", "American", "male", "Rich low register. Dramatic.", ["deep", "dramatic"]],
  ["am_liam", "Liam", "American", "male", "Friendly and conversational.", ["friendly", "casual"]],
  ["am_echo", "Echo", "American", "male", "Smooth and even-paced.", ["smooth", "even"]],
  ["am_eric", "Eric", "American", "male", "Clear and professional.", ["clear", "professional"]],
  ["am_fenrir", "Fenrir", "American", "male", "Bold and commanding.", ["bold", "commanding"]],
  ["am_puck", "Puck", "American", "male", "Playful and lively.", ["playful", "lively"]],
  ["am_santa", "Santa", "American", "male", "Warm, jolly, characterful.", ["character", "warm"]],
  // British Female
  ["bf_emma", "Emma", "British", "female", "Refined British RP. Elegant narration.", ["british", "elegant", "narration"]],
  ["bf_alice", "Alice", "British", "female", "Polished and articulate.", ["british", "polished"]],
  ["bf_isabella", "Isabella", "British", "female", "Soft, graceful British tone.", ["british", "soft"]],
  ["bf_lily", "Lily", "British", "female", "Light and youthful British accent.", ["british", "youthful"]],
  // British Male
  ["bm_george", "George", "British", "male", "Distinguished British narrator. Audiobooks.", ["british", "audiobook"]],
  ["bm_daniel", "Daniel", "British", "male", "Calm, measured British delivery.", ["british", "calm"]],
  ["bm_lewis", "Lewis", "British", "male", "Deep, authoritative British tone.", ["british", "deep"]],
  ["bm_fable", "Fable", "British", "male", "Characterful storytelling British voice.", ["british", "storytelling"]],
];

const PREVIEW_TEXT =
  "This is a preview of my voice. I can narrate your scripts clearly and naturally.";

async function main() {
  // wipe any existing voices so we start from a clean catalog
  await fs.rm(VOICES_DIR, { recursive: true, force: true });
  await fs.mkdir(VOICES_DIR, { recursive: true });

  for (const [voiceId, name, accent, gender, description, tags] of CATALOG) {
    const dir = path.join(VOICES_DIR, voiceId);
    await fs.mkdir(dir, { recursive: true });

    const voice = {
      id: voiceId,
      name,
      description,
      provider: "kokoro",
      voiceId,
      language: "en",
      accent,
      gender,
      sampleRate: 24000,
      tags,
      previewText: PREVIEW_TEXT,
    };

    await fs.writeFile(path.join(dir, "voice.json"), JSON.stringify(voice, null, 2));
  }

  console.log(`Wrote ${CATALOG.length} voices to ${VOICES_DIR}`);
}

main();
