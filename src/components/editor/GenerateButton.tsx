"use client";

import { useAppStore, useActiveProject } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mic, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function GenerateButton() {
  const { editorText, isGenerating, setIsGenerating, setOutputs, updateProject, engineHealth } =
    useAppStore();
  const project = useActiveProject();

  async function generate() {
    if (!project || isGenerating) return;

    const engine = project.engine ?? "kokoro";
    if (!engineHealth[engine]) {
      const name = engine === "orpheus" ? "Orpheus" : "Kokoro";
      toast.error(`${name} server is offline. Start it first.`);
      return;
    }

    if (!editorText.trim()) {
      toast.error("Write something first.");
      return;
    }

    if (engine === "orpheus") {
      toast.info("Orpheus is expressive but slow (~4x slower than realtime). Hang tight.");
    }

    setIsGenerating(true);

    try {
      const res = await fetch(`/api/projects/${project.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editorText }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Generation failed");
        return;
      }

      setOutputs(data.outputs ?? []);
      updateProject({ ...project, status: "done" });

      if (data.outputs?.length > 0) {
        useAppStore.getState().setActiveOutputUrl(data.outputs[0].url);
        toast.success("Speech generated successfully");
      }
    } catch {
      toast.error("Generation failed — check your connection to the TTS server");
    } finally {
      setIsGenerating(false);
    }
  }

  const disabled = !project || isGenerating || !editorText.trim();

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={generate}
        disabled={disabled}
        size="lg"
        className="w-full gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            Generate Speech
          </>
        )}
      </Button>
      {isGenerating && (
        <Progress value={null} className="h-1 animate-pulse" />
      )}
    </div>
  );
}
