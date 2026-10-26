"use client";

import { useAppStore, useActiveProject } from "@/store/useAppStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function VoiceSelector() {
  const { voices, updateProject } = useAppStore();
  const project = useActiveProject();

  if (!project) return null;

  async function handleChange(voiceId: string | null) {
    if (!voiceId) return;
    if (!project) return;
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice: voiceId }),
      });
      if (!res.ok) throw new Error();
      updateProject(await res.json());
    } catch {
      toast.error("Failed to update voice");
    }
  }

  const activeVoice = voices.find((v) => v.id === project.voice);

  return (
    <div className="flex items-center gap-3">
      <Select value={project.voice} onValueChange={handleChange}>
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Select voice" />
        </SelectTrigger>
        <SelectContent>
          {voices.map((voice) => (
            <SelectItem key={voice.id} value={voice.id}>
              <div className="flex items-center gap-2">
                <span>{voice.name}</span>
                <Badge variant="outline" className="text-xs capitalize">
                  {voice.language}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {activeVoice && (
        <span className="text-xs text-muted-foreground hidden sm:block">
          {activeVoice.description}
        </span>
      )}
    </div>
  );
}
