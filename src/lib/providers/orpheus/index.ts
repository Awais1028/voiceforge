import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import { TTSProvider, TTSOptions, TTSResult } from "../types";
import { Voice } from "@/lib/schemas";
import { listVoices, getVoice } from "@/lib/storage/voiceStore";
import { getSettings } from "@/lib/storage/settingsStore";

const execFileAsync = promisify(execFile);

export class OrpheusProvider implements TTSProvider {
  private async getBaseUrl(): Promise<string> {
    const settings = await getSettings();
    return settings.orpheusUrl;
  }

  private async getFfmpegPath(): Promise<string> {
    const settings = await getSettings();
    return settings.ffmpegPath;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const url = await this.getBaseUrl();
      const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  async listVoices(): Promise<Voice[]> {
    const all = await listVoices();
    return all.filter((v) => v.provider === "orpheus");
  }

  async getVoice(id: string): Promise<Voice> {
    return getVoice(id);
  }

  async generate(text: string, voiceId: string, options: TTSOptions): Promise<TTSResult> {
    const url = await this.getBaseUrl();
    const isHealthy = await this.checkHealth();
    const generatedAt = new Date().toISOString();

    if (!isHealthy) {
      return { durationSeconds: 0, generatedAt };
    }

    const wavPath = path.join(options.outputDir, `${options.filename}.wav`);
    const mp3Path = path.join(options.outputDir, `${options.filename}.mp3`);

    let modelVoice = voiceId;
    try {
      const voice = await getVoice(voiceId);
      modelVoice = voice.voiceId;
    } catch {
      // fall back to passing voiceId through as-is
    }

    // Orpheus is ~4x slower than realtime and chunks long text — allow a long timeout.
    const response = await fetch(`${url}/v1/audio/speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: text, voice: modelVoice, response_format: "wav" }),
      signal: AbortSignal.timeout(30 * 60 * 1000),
    });

    if (!response.ok) {
      throw new Error(`Orpheus API error: ${response.status} ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.mkdir(options.outputDir, { recursive: true });
    await fs.writeFile(wavPath, buffer);

    const result: TTSResult = { wavPath, durationSeconds: 0, generatedAt };

    if (options.formats.includes("mp3")) {
      try {
        const ffmpeg = await this.getFfmpegPath();
        await execFileAsync(ffmpeg, [
          "-i", wavPath,
          "-codec:a", "libmp3lame",
          "-qscale:a", "2",
          "-y",
          mp3Path,
        ]);
        result.mp3Path = mp3Path;
      } catch {
        // MP3 conversion failed — WAV is still available
      }
    }

    const stat = await fs.stat(wavPath);
    result.durationSeconds = Math.round(stat.size / 48000);

    return result;
  }
}

let _instance: OrpheusProvider | null = null;

export function getOrpheusProvider(): OrpheusProvider {
  if (!_instance) _instance = new OrpheusProvider();
  return _instance;
}
