"use client";

import { create } from "zustand";
import { Project, Voice, Settings, AudioOutput } from "@/lib/schemas";

interface EngineHealth {
  kokoro: boolean;
  orpheus: boolean;
}

interface AppState {
  projects: Project[];
  activeProjectId: string | null;
  voices: Voice[];
  settings: Settings | null;
  outputs: AudioOutput[];
  editorText: string;
  isGenerating: boolean;
  engineHealth: EngineHealth;
  activeOutputUrl: string | null;
  voiceLibraryOpen: boolean;

  setProjects: (projects: Project[]) => void;
  setActiveProject: (id: string | null) => void;
  updateProject: (project: Project) => void;
  removeProject: (id: string) => void;
  setVoices: (voices: Voice[]) => void;
  setSettings: (settings: Settings) => void;
  setOutputs: (outputs: AudioOutput[]) => void;
  setEditorText: (text: string) => void;
  setIsGenerating: (v: boolean) => void;
  setEngineHealth: (h: EngineHealth) => void;
  setActiveOutputUrl: (url: string | null) => void;
  setVoiceLibraryOpen: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  projects: [],
  activeProjectId: null,
  voices: [],
  settings: null,
  outputs: [],
  editorText: "",
  isGenerating: false,
  engineHealth: { kokoro: false, orpheus: false },
  activeOutputUrl: null,
  voiceLibraryOpen: false,

  setProjects: (projects) => set({ projects }),
  setActiveProject: (id) => set({ activeProjectId: id, outputs: [], activeOutputUrl: null }),
  updateProject: (project) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === project.id ? project : p)),
    })),
  removeProject: (id) =>
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
    })),
  setVoices: (voices) => set({ voices }),
  setSettings: (settings) => set({ settings }),
  setOutputs: (outputs) => set({ outputs }),
  setEditorText: (editorText) => set({ editorText }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setEngineHealth: (engineHealth) => set({ engineHealth }),
  setActiveOutputUrl: (activeOutputUrl) => set({ activeOutputUrl }),
  setVoiceLibraryOpen: (voiceLibraryOpen) => set({ voiceLibraryOpen }),
}));

export function useActiveProject(): Project | null {
  return useAppStore((s) =>
    s.activeProjectId ? s.projects.find((p) => p.id === s.activeProjectId) ?? null : null
  );
}
