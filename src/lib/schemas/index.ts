import { z } from "zod";

export const VoiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  provider: z.string(),
  voiceId: z.string(),
  language: z.string(),
  accent: z.string().optional(),
  gender: z.enum(["male", "female", "neutral"]),
  sampleRate: z.number(),
  tags: z.array(z.string()),
  previewText: z.string(),
  previewUrl: z.string().optional(),
});

export const ProjectStatusSchema = z.enum(["idle", "generating", "done", "error"]);

export const EngineSchema = z.enum(["kokoro", "orpheus"]);

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  engine: EngineSchema.default("kokoro"),
  voice: z.string(),
  speed: z.number().min(0.5).max(2.0),
  outputFormats: z.array(z.enum(["wav", "mp3"])),
  status: ProjectStatusSchema,
  errorMessage: z.string().optional(),
});

export const SettingsSchema = z.object({
  defaultVoice: z.string(),
  defaultSpeed: z.number().min(0.5).max(2.0),
  defaultOutputFormats: z.array(z.enum(["wav", "mp3"])),
  ttsProvider: z.enum(["kokoro", "orpheus", "f5-tts", "xtts"]),
  kokoroUrl: z.string().url(),
  orpheusUrl: z.string().url(),
  ffmpegPath: z.string(),
});

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  voice: z.string().optional(),
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  engine: EngineSchema.optional(),
  voice: z.string().optional(),
  speed: z.number().min(0.5).max(2.0).optional(),
  outputFormats: z.array(z.enum(["wav", "mp3"])).optional(),
  status: ProjectStatusSchema.optional(),
  errorMessage: z.string().optional(),
});

export const UpdateSettingsSchema = SettingsSchema.partial();

export const AudioOutputSchema = z.object({
  filename: z.string(),
  format: z.enum(["wav", "mp3"]),
  sizeBytes: z.number(),
  createdAt: z.string(),
  url: z.string(),
});

export const GenerateRequestSchema = z.object({
  text: z.string().min(1).max(50000),
  voice: z.string().optional(),
  speed: z.number().min(0.5).max(2.0).optional(),
  outputFormats: z.array(z.enum(["wav", "mp3"])).optional(),
});

export type Voice = z.infer<typeof VoiceSchema>;
export type Engine = z.infer<typeof EngineSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type AudioOutput = z.infer<typeof AudioOutputSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>;
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
