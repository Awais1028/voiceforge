"use client";

import { useState } from "react";
import { useActiveProject, useAppStore } from "@/store/useAppStore";
import { TextEditor } from "@/components/editor/TextEditor";
import { GenerateButton } from "@/components/editor/GenerateButton";
import { ControlPanel } from "@/components/layout/ControlPanel";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";

export function MainArea() {
  const project = useActiveProject();
  const { editorText, outputs } = useAppStore();
  const [audioExpanded, setAudioExpanded] = useState(false);

  const charCount = editorText.length;
  const hasOutputs = outputs.length > 0;

  return (
    <div className="flex flex-1 min-w-0 h-full">
      {/* Center column */}
      <main className="flex flex-col flex-1 min-w-0 h-full">
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-medium text-sm truncate">
              {project ? project.name : "No project selected"}
            </h2>
            {project && (
              <Badge variant="outline" className="text-[10px] capitalize">
                {project.status}
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {charCount.toLocaleString()} characters
          </span>
        </div>

        {/* Editor — collapses when audio dock is expanded */}
        <div
          className={`flex flex-col px-5 pt-4 pb-3 ${
            audioExpanded && hasOutputs ? "h-32 shrink-0" : "flex-1 min-h-0"
          }`}
        >
          <TextEditor />
        </div>

        {/* Generate bar */}
        <div className="px-5 py-3 border-t flex items-center gap-4 shrink-0">
          <span className="text-xs text-muted-foreground flex-1 truncate">
            Unlimited generations · runs locally · $0 per character
          </span>
          <div className="w-56">
            <GenerateButton />
          </div>
        </div>

        {/* Audio player dock — expandable */}
        {hasOutputs && (
          <div
            className={`border-t bg-muted/20 flex flex-col ${
              audioExpanded ? "flex-1 min-h-0" : "h-48 shrink-0"
            }`}
          >
            <div className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Generated Audio
                <span className="ml-2 text-muted-foreground/70 normal-case font-normal">
                  {outputs.length} file{outputs.length === 1 ? "" : "s"}
                </span>
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 text-xs"
                onClick={() => setAudioExpanded((v) => !v)}
              >
                {audioExpanded ? (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" /> Collapse
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" /> Expand
                  </>
                )}
              </Button>
            </div>
            <div className="flex-1 min-h-0 px-5 pb-3">
              <AudioPlayer />
            </div>
          </div>
        )}
      </main>

      {/* Right control panel */}
      <ControlPanel />
    </div>
  );
}
