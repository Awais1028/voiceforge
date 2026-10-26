import fs from "fs/promises";
import { paths } from "./paths";
import { Voice, VoiceSchema } from "@/lib/schemas";

export async function listVoices(): Promise<Voice[]> {
  try {
    const entries = await fs.readdir(paths.voices, { withFileTypes: true });
    const voices: Voice[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      try {
        const raw = await fs.readFile(paths.voiceJson(entry.name), "utf-8");
        const voice = VoiceSchema.parse(JSON.parse(raw));
        voice.previewUrl = `/api/voices/${voice.id}/preview`;
        voices.push(voice);
      } catch {
        // skip malformed voice folders
      }
    }

    return voices;
  } catch {
    return [];
  }
}

export async function getVoice(id: string): Promise<Voice> {
  try {
    const raw = await fs.readFile(paths.voiceJson(id), "utf-8");
    return VoiceSchema.parse(JSON.parse(raw));
  } catch {
    throw new Error(`Voice not found: ${id}`);
  }
}
