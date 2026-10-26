"use client";

import { Settings, AudioLines, Mic2, FolderOpen } from "lucide-react";
import { ProjectList } from "@/components/projects/ProjectList";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  view: "editor" | "settings";
  onViewChange: (view: "editor" | "settings") => void;
}

export function Sidebar({ view, onViewChange }: SidebarProps) {
  const { voices, setVoiceLibraryOpen } = useAppStore();

  return (
    <aside className="flex flex-col w-60 shrink-0 border-r bg-muted/20 h-full">
      <div className="px-4 py-3.5 border-b flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white">
          <AudioLines className="h-4 w-4" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-tight leading-none">VoiceForge</h1>
          <p className="text-[10px] text-muted-foreground">Local AI Voice Studio</p>
        </div>
      </div>

      {/* Primary nav */}
      <div className="p-2 space-y-0.5">
        <Button
          variant={view === "editor" ? "secondary" : "ghost"}
          size="sm"
          className="w-full justify-start gap-2 h-8"
          onClick={() => onViewChange("editor")}
        >
          <AudioLines className="h-4 w-4" />
          Text to Speech
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-8"
          onClick={() => setVoiceLibraryOpen(true)}
        >
          <Mic2 className="h-4 w-4" />
          Voices
          <span className="ml-auto text-[10px] text-muted-foreground">{voices.length}</span>
        </Button>
      </div>

      <Separator />

      <div className="flex items-center gap-1.5 px-3 pt-3 pb-1">
        <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Projects
        </span>
      </div>
      <div className="flex-1 overflow-hidden">
        <ProjectList />
      </div>

      <Separator />
      <div className="p-2">
        <Button
          variant={view === "settings" ? "secondary" : "ghost"}
          size="sm"
          className="w-full justify-start gap-2 h-8"
          onClick={() => onViewChange(view === "settings" ? "editor" : "settings")}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>
    </aside>
  );
}
