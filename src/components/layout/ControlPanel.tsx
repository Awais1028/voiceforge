"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore, useActiveProject } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, Play, Pause, Mic2, Zap, Drama } from "lucide-react";
import { toast } from "sonner";
import { Engine } from "@/lib/schemas";

const ENGINE_DEFAULT_VOICE: Record<Engine, string> = {
  kokoro: "af_heart",
  orpheus: "orpheus-tara",
};

// Paralinguistic tags supported by Orpheus-3b. Insert inline in the script.
const ORPHEUS_TAGS: { tag: string; desc: string }[] = [
  { tag: "<laugh>", desc: "Laughter" },
  { tag: "<chuckle>", desc: "Soft laugh" },
  { tag: "<sigh>", desc: "Sighing" },
  { tag: "<gasp>", desc: "Surprise" },
  { tag: "<groan>", desc: "Frustration" },
  { tag: "<yawn>", desc: "Tiredness" },
  { tag: "<cough>", desc: "Cough" },
  { tag: "<sniffle>", desc: "Sniffle" },
];

type SpeedPatch = { speed: number };

function debounce(fn: (patch: SpeedPatch) => void, ms: number) {
  let t: ReturnType<typeof setTimeout>;
  return (patch: SpeedPatch) => {
    clearTimeout(t);
    t = setTimeout(() => fn(patch), ms);
  };
}

export function ControlPanel() {
  const { voices, updateProject, setVoiceLibraryOpen } = useAppStore();
  const project = useActiveProject();
  const [localSpeed, setLocalSpeed] = useState(project?.speed ?? 1.0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const patchRef = useRef<(p: SpeedPatch) => void>(() => {});

  useEffect(() => {
    setLocalSpeed(project?.speed ?? 1.0);
  }, [project?.speed, project?.id]);

  useEffect(() => {
    patchRef.current = debounce((patch) => {
      if (!project) return;
      fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
        .then((r) => r.json())
        .then((p) => updateProject(p))
        .catch(() => {});
    }, 400);
  }, [project, updateProject]);

  if (!project) {
    return (
      <aside className="w-72 shrink-0 border-l bg-muted/10 p-4">
        <p className="text-xs text-muted-foreground">Select a project to see controls.</p>
      </aside>
    );
  }

  const activeVoice = voices.find((v) => v.id === project.voice);
  const formats = project.outputFormats;
  const engine: Engine = project.engine ?? "kokoro";

  function switchEngine(next: Engine) {
    if (!project || next === engine) return;
    // each engine has its own voices — reset to that engine's default on switch
    fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ engine: next, voice: ENGINE_DEFAULT_VOICE[next] }),
    })
      .then((r) => r.json())
      .then((p) => updateProject(p))
      .catch(() => toast.error("Failed to switch engine"));
  }

  function toggleFormat(fmt: "wav" | "mp3") {
    const next = formats.includes(fmt)
      ? formats.filter((f) => f !== fmt)
      : [...formats, fmt];
    if (next.length === 0) {
      toast.error("Keep at least one output format");
      return;
    }
    fetch(`/api/projects/${project!.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outputFormats: next }),
    })
      .then((r) => r.json())
      .then((p) => updateProject(p));
  }

  function previewVoice() {
    if (!activeVoice?.previewUrl) return;
    if (previewing) {
      audioRef.current?.pause();
      setPreviewing(false);
      return;
    }
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = activeVoice.previewUrl;
    audioRef.current.onended = () => setPreviewing(false);
    audioRef.current.play().catch(() => setPreviewing(false));
    setPreviewing(true);
  }

  return (
    <aside className="w-72 shrink-0 border-l bg-muted/10 flex flex-col h-full overflow-y-auto">
      <div className="p-4 space-y-5">
        <div>
          <Label className="text-xs text-muted-foreground">Engine</Label>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            <button
              onClick={() => switchEngine("kokoro")}
              className={`flex flex-col items-start gap-0.5 p-2.5 rounded-lg border text-left transition-colors ${
                engine === "kokoro" ? "border-primary bg-accent" : "border-border hover:bg-muted"
              }`}
            >
              <span className="flex items-center gap-1 text-sm font-medium">
                <Zap className="h-3.5 w-3.5" /> Kokoro
              </span>
              <span className="text-[10px] text-muted-foreground">Fast · clean</span>
            </button>
            <button
              onClick={() => switchEngine("orpheus")}
              className={`flex flex-col items-start gap-0.5 p-2.5 rounded-lg border text-left transition-colors ${
                engine === "orpheus" ? "border-primary bg-accent" : "border-border hover:bg-muted"
              }`}
            >
              <span className="flex items-center gap-1 text-sm font-medium">
                <Drama className="h-3.5 w-3.5" /> Orpheus
              </span>
              <span className="text-[10px] text-muted-foreground">Emotional · slow</span>
            </button>
          </div>
          {engine === "orpheus" && (
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              Expressive engine — drop the tags below inline in your script. ~4x
              slower than realtime.
            </p>
          )}
        </div>

        <Separator />

        <div>
          <Label className="text-xs text-muted-foreground">Voice</Label>
          <button
            onClick={() => setVoiceLibraryOpen(true)}
            className="mt-1.5 w-full flex items-center gap-3 p-2.5 rounded-lg border bg-background hover:bg-muted transition-colors text-left"
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white shrink-0">
              <Mic2 className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {activeVoice?.name ?? project.voice}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {activeVoice?.accent} {activeVoice?.gender}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>

          {activeVoice?.previewUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1.5 h-7 text-xs gap-1.5 w-full justify-start"
              onClick={previewVoice}
            >
              {previewing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              Preview sample
            </Button>
          )}
        </div>

        <Separator />

        {engine === "orpheus" && (
          <>
            <div>
              <Label className="text-xs text-muted-foreground">Emotion Tags</Label>
              <p className="text-[10px] text-muted-foreground/80 mt-0.5 mb-1.5">
                Click to copy, then paste inline in your script.
              </p>
              <div className="max-h-44 overflow-y-auto rounded-lg border bg-background divide-y">
                {ORPHEUS_TAGS.map((t) => (
                  <button
                    key={t.tag}
                    onClick={() => {
                      navigator.clipboard?.writeText(t.tag);
                      toast.success(`Copied ${t.tag}`);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-left hover:bg-muted transition-colors"
                  >
                    <code className="text-xs text-violet-600 dark:text-violet-400">
                      {t.tag}
                    </code>
                    <span className="text-[11px] text-muted-foreground">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <Separator />
          </>
        )}

        {engine === "kokoro" && (
          <div>
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground">Speed</Label>
              <Badge variant="outline" className="text-xs tabular-nums">
                {localSpeed.toFixed(1)}x
              </Badge>
            </div>
            <Slider
              value={[localSpeed]}
              min={0.5}
              max={2.0}
              step={0.1}
              className="mt-2.5"
              onValueChange={(vals: number | readonly number[]) => {
                const v = Array.isArray(vals) ? (vals as number[])[0] : (vals as number);
                setLocalSpeed(v);
                patchRef.current({ speed: v });
              }}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Slower</span>
              <span>Faster</span>
            </div>
          </div>
        )}

        <Separator />

        <div>
          <Label className="text-xs text-muted-foreground">Output Format</Label>
          <div className="mt-2 space-y-1.5">
            {(["mp3", "wav"] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => toggleFormat(fmt)}
                className={`w-full flex items-center justify-between p-2 rounded-md border text-sm transition-colors ${
                  formats.includes(fmt)
                    ? "border-primary bg-accent"
                    : "border-border hover:bg-muted"
                }`}
              >
                <span className="uppercase font-medium">{fmt}</span>
                <span className="text-xs text-muted-foreground">
                  {fmt === "mp3" ? "Smaller, for editing" : "Lossless"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
