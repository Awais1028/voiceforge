import fs from "fs/promises";
import { paths } from "./paths";
import { Settings, SettingsSchema, UpdateSettingsInput } from "@/lib/schemas";

const DEFAULTS: Settings = {
  defaultVoice: "af_heart",
  defaultSpeed: 1.0,
  defaultOutputFormats: ["wav", "mp3"],
  ttsProvider: "kokoro",
  kokoroUrl: "http://localhost:8880",
  orpheusUrl: "http://localhost:8881",
  ffmpegPath: "ffmpeg",
};

export async function getSettings(): Promise<Settings> {
  try {
    const raw = await fs.readFile(paths.settingsJson, "utf-8");
    return SettingsSchema.parse(JSON.parse(raw));
  } catch {
    return DEFAULTS;
  }
}

export async function updateSettings(input: UpdateSettingsInput): Promise<Settings> {
  const existing = await getSettings();
  const updated = SettingsSchema.parse({ ...existing, ...input });
  await fs.writeFile(paths.settingsJson, JSON.stringify(updated, null, 2));
  return updated;
}
