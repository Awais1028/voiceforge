import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import { TTSProvider, TTSOptions, TTSResult } from "../types";
import { Voice } from "@/lib/schemas";
import { listVoices, getVoice } from "@/lib/storage/voiceStore";
import { getSettings } from "@/lib/storage/settingsStore";

const execFileAsync = promisify(execFile);

export class KokoroProvider implements TTSProvider {
  private async getBaseUrl(): Promise<string> {
    const settings = await getSettings();
    return settings.kokoroUrl;
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
    return all.filter((v) => v.provider === "kokoro");
  }

  async getVoice(id: string): Promise<Voice> {
    return getVoice(id);
  }

  async generate(text: string, voiceId: string, options: TTSOptions): Promise<TTSResult> {
    const url = await this.getBaseUrl();
    const isHealthy = await this.checkHealth();
    const generatedAt = new Date().toISOString();

    if (!isHealthy) {
      return this.generateMock(options, generatedAt);
    }

    const wavPath = path.join(options.outputDir, `${options.filename}.wav`);
    const mp3Path = path.join(options.outputDir, `${options.filename}.mp3`);

    // voiceId here is our internal voice id (e.g. "kokoro-default") — resolve it
    // to the model's actual voice name (e.g. "af_heart") before calling Kokoro.
    let modelVoice = voiceId;
    try {
      const voice = await getVoice(voiceId);
      modelVoice = voice.voiceId;
    } catch {
      // fall back to passing voiceId through as-is
    }

    const response = await fetch(`${url}/v1/audio/speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "kokoro",
        input: text,
        voice: modelVoice,
        speed: options.speed,
        response_format: "wav",
      }),
    });

    if (!response.ok) {
      throw new Error(`Kokoro API error: ${response.status} ${response.statusText}`);
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

    // estimate duration from file size (24kHz, 16-bit mono = 48000 bytes/sec)
    const stat = await fs.stat(wavPath);
    result.durationSeconds = Math.round(stat.size / 48000);

    return result;
  }

  private async generateMock(options: TTSOptions, generatedAt: string): Promise<TTSResult> {
    // Returns a result indicating the TTS server is offline — no audio file written
    return {
      durationSeconds: 0,
      generatedAt,
    };
  }
}

let _instance: KokoroProvider | null = null;

export function getKokoroProvider(): KokoroProvider {
  if (!_instance) _instance = new KokoroProvider();
  return _instance;
}
