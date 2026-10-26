"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppStore, useActiveProject } from "@/store/useAppStore";
import { Textarea } from "@/components/ui/textarea";

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function TextEditor() {
  const { editorText, setEditorText } = useAppStore();
  const project = useActiveProject();
  const saveRef = useRef<(text: string) => void>(() => {});

  const save = useCallback(
    (text: string) => {
      if (!project) return;
      fetch(`/api/projects/${project.id}/source`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
    },
    [project]
  );

  useEffect(() => {
    saveRef.current = debounce(save, 1000);
  }, [save]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setEditorText(e.target.value);
    saveRef.current(e.target.value);
  }

  const wordCount = editorText.trim() ? editorText.trim().split(/\s+/).length : 0;
  const estimatedMinutes = Math.ceil(wordCount / 150);

  return (
    <div className="flex flex-col flex-1 gap-2 min-h-0">
      <Textarea
        value={editorText}
        onChange={handleChange}
        placeholder={
          project
            ? "Paste your script here..."
            : "Select or create a project to start writing."
        }
        disabled={!project}
        className="flex-1 resize-none text-sm font-mono leading-relaxed min-h-0"
      />
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{wordCount.toLocaleString()} words</span>
        {wordCount > 0 && <span>≈ {estimatedMinutes} min of audio</span>}
      </div>
    </div>
  );
}
