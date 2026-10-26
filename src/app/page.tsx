"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Project, Voice, Settings } from "@/lib/schemas";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatusBar } from "@/components/layout/StatusBar";
import { MainArea } from "@/components/layout/MainArea";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { VoiceLibrary } from "@/components/voices/VoiceLibrary";

export default function Home() {
  const {
    setProjects,
    setVoices,
    setSettings,
    setActiveProject,
    setEditorText,
    setOutputs,
    voiceLibraryOpen,
    setVoiceLibraryOpen,
  } = useAppStore();
  const [view, setView] = useState<"editor" | "settings">("editor");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      const [projectsRes, voicesRes, settingsRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/voices"),
        fetch("/api/settings"),
      ]);

      const [projects, voices, settings]: [Project[], Voice[], Settings] = await Promise.all([
        projectsRes.json(),
        voicesRes.json(),
        settingsRes.json(),
      ]);

      setProjects(projects);
      setVoices(voices);
      setSettings(settings);

      if (projects.length > 0) {
        const first = projects[0];
        setActiveProject(first.id);

        const [sourceRes, outputsRes] = await Promise.all([
          fetch(`/api/projects/${first.id}/source`),
          fetch(`/api/projects/${first.id}/outputs`),
        ]);

        if (sourceRes.ok) {
          const { text } = await sourceRes.json();
          setEditorText(text);
        }
        if (outputsRes.ok) {
          setOutputs(await outputsRes.json());
        }
      }

      setLoaded(true);
    }

    bootstrap();
  }, [setProjects, setVoices, setSettings, setActiveProject, setEditorText, setOutputs]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground text-sm">
        Loading VoiceForge…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <StatusBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar view={view} onViewChange={setView} />
        {view === "settings" ? <SettingsPanel /> : <MainArea />}
      </div>
      <VoiceLibrary open={voiceLibraryOpen} onOpenChange={setVoiceLibraryOpen} />
    </div>
  );
}
