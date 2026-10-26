"use client";

import { useRef, useState, useMemo } from "react";
import { Voice } from "@/lib/schemas";
import { useAppStore, useActiveProject } from "@/store/useAppStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Check, Search } from "lucide-react";
import { toast } from "sonner";

interface VoiceLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoiceLibrary({ open, onOpenChange }: VoiceLibraryProps) {
  const { voices, updateProject } = useAppStore();
  const project = useActiveProject();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "American" | "British" | "female" | "male">("all");

  const engine = project?.engine ?? "kokoro";

  const filtered = useMemo(() => {
    return voices.filter((v) => {
      // only show voices for the project's current engine
      if (v.provider !== engine) return false;
      const matchesQuery =
        !query ||
        v.name.toLowerCase().includes(query.toLowerCase()) ||
        v.description.toLowerCase().includes(query.toLowerCase()) ||
        v.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
      const matchesFilter =
        filter === "all" ||
        v.accent === filter ||
        v.gender === filter;
      return matchesQuery && matchesFilter;
    });
  }, [voices, query, filter, engine]);

  const grouped = useMemo(() => {
    const groups: Record<string, Voice[]> = {};
    for (const v of filtered) {
      const key = `${v.accent ?? "Other"} ${v.gender === "female" ? "Female" : "Male"}`;
      (groups[key] ??= []).push(v);
    }
    return groups;
  }, [filtered]);

  function playSample(voice: Voice) {
    if (!voice.previewUrl) return;

    if (playingId === voice.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    audio.src = voice.previewUrl;
    audio.onended = () => setPlayingId(null);
    audio.play().catch(() => setPlayingId(null));
    setPlayingId(voice.id);
  }

  async function selectVoice(voice: Voice) {
    if (!project) {
      toast.error("Select a project first");
      return;
    }
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice: voice.id }),
      });
      if (!res.ok) throw new Error();
      updateProject(await res.json());
      audioRef.current?.pause();
      setPlayingId(null);
      toast.success(`Voice set to ${voice.name}`);
      onOpenChange(false);
    } catch {
      toast.error("Failed to set voice");
    }
  }

  const filters: Array<typeof filter> = ["all", "American", "British", "female", "male"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-2xl max-h-[85vh] flex flex-col gap-3 overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Voice Library</DialogTitle>
          <DialogDescription>
            {voices.length} voices available. Click play to hear a sample, then select.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search voices…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {filters.map((f) => (
              <Button
                key={f}
                variant={filter === f ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs capitalize"
                onClick={() => setFilter(f)}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-1">
          <div className="space-y-4 pb-2 px-1">
            {Object.entries(grouped).map(([groupName, groupVoices]) => (
              <div key={groupName}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 sticky top-0 bg-popover py-1 z-10">
                  {groupName}
                </p>
                <div className="space-y-1">
                  {groupVoices.map((voice) => {
                    const isActive = project?.voice === voice.id;
                    const isPlaying = playingId === voice.id;
                    return (
                      <div
                        key={voice.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                          isActive ? "border-primary bg-accent" : "border-transparent hover:bg-muted"
                        }`}
                      >
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 shrink-0 rounded-full"
                          onClick={() => playSample(voice)}
                        >
                          {isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{voice.name}</span>
                            {voice.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {voice.description}
                          </p>
                        </div>

                        <Button
                          variant={isActive ? "secondary" : "default"}
                          size="sm"
                          className="h-8 shrink-0"
                          onClick={() => selectVoice(voice)}
                          disabled={isActive}
                        >
                          {isActive ? (
                            <>
                              <Check className="h-3.5 w-3.5 mr-1" /> Selected
                            </>
                          ) : (
                            "Select"
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                No voices match your search.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
