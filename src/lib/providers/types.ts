import { Voice } from "@/lib/schemas";

export interface TTSOptions {
  speed: number;
  outputDir: string;
  filename: string;
  formats: Array<"wav" | "mp3">;
}

export interface TTSResult {
  wavPath?: string;
  mp3Path?: string;
  durationSeconds: number;
  generatedAt: string;
}

export interface TTSProvider {
  generate(text: string, voiceId: string, options: TTSOptions): Promise<TTSResult>;
  listVoices(): Promise<Voice[]>;
  getVoice(id: string): Promise<Voice>;
  checkHealth(): Promise<boolean>;
}
