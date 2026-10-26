import { TTSProvider } from "./types";
import { getKokoroProvider } from "./kokoro";
import { getOrpheusProvider } from "./orpheus";
import { getSettings } from "@/lib/storage/settingsStore";
import { Engine } from "@/lib/schemas";

export function getProviderForEngine(engine: Engine): TTSProvider {
  switch (engine) {
    case "orpheus":
      return getOrpheusProvider();
    case "kokoro":
    default:
      return getKokoroProvider();
  }
}

export async function getTTSProvider(): Promise<TTSProvider> {
  const settings = await getSettings();
  if (settings.ttsProvider === "orpheus") return getOrpheusProvider();
  return getKokoroProvider();
}

export type { TTSProvider, TTSOptions, TTSResult } from "./types";
