"use client";

import { useRef, useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { AudioOutput } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer() {
  const { outputs, activeOutputUrl, setActiveOutputUrl, setOutputs } = useAppStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeOutputUrl) return;
    audio.src = activeOutputUrl;
    audio.load();
    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);
  }, [activeOutputUrl]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
  }

  async function deleteOutput(output: AudioOutput) {
    try {
      await fetch(`/api/projects/${getProjectId(output.url)}/outputs/${output.filename}`, {
        method: "DELETE",
      });
      const next = outputs.filter((o) => o.filename !== output.filename);
      setOutputs(next);
      if (activeOutputUrl === output.url) {
        setActiveOutputUrl(next.length > 0 ? next[0].url : null);
      }
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  function getProjectId(url: string): string {
    // url is /api/projects/{id}/outputs/{filename}
    return url.split("/")[3];
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  if (outputs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        No audio generated yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {activeOutputUrl && (
        <>
          <audio
            ref={audioRef}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
            onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
          />

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={togglePlay}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Slider
              value={[currentTime]}
              max={duration || 1}
              step={0.1}
              onValueChange={(vals: number | readonly number[]) => {
                const val = Array.isArray(vals) ? (vals as number[])[0] : (vals as number);
                if (audioRef.current) audioRef.current.currentTime = val;
                setCurrentTime(val);
              }}
              className="flex-1"
            />

            <span className="text-xs text-muted-foreground w-20 text-right tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-1 pr-1">
          {outputs.map((output) => (
            <div
              key={output.filename}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors ${
                activeOutputUrl === output.url ? "bg-accent" : "hover:bg-muted"
              }`}
              onClick={() => setActiveOutputUrl(output.url)}
            >
              <span className="flex-1 font-mono truncate">{output.filename}</span>
              <span className="text-muted-foreground uppercase">{output.format}</span>
              <span className="text-muted-foreground">{formatBytes(output.sizeBytes)}</span>

              <a href={output.url} download={output.filename} onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Download className="h-3 w-3" />
                </Button>
              </a>

              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteOutput(output);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
