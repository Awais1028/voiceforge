"use client";

import { useState } from "react";
import { Project } from "@/lib/schemas";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";

export function ProjectList() {
  const { projects, activeProjectId, setActiveProject, setProjects, removeProject, updateProject } =
    useAppStore();
  const [creatingName, setCreatingName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadProject(id: string) {
    setActiveProject(id);
    const [sourceRes, outputsRes] = await Promise.all([
      fetch(`/api/projects/${id}/source`),
      fetch(`/api/projects/${id}/outputs`),
    ]);
    if (sourceRes.ok) {
      const { text } = await sourceRes.json();
      useAppStore.getState().setEditorText(text);
    }
    if (outputsRes.ok) {
      useAppStore.getState().setOutputs(await outputsRes.json());
    }
  }

  async function createProject() {
    if (!creatingName.trim()) return;
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: creatingName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create project");
      const project: Project = await res.json();
      setProjects([project, ...projects]);
      await loadProject(project.id);
      setCreatingName("");
      setIsCreating(false);
      toast.success(`Project "${project.name}" created`);
    } catch {
      toast.error("Failed to create project");
    }
  }

  async function renameProject(id: string) {
    if (!editingName.trim()) return;
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      if (!res.ok) throw new Error();
      const updated: Project = await res.json();
      updateProject(updated);
      setEditingId(null);
    } catch {
      toast.error("Failed to rename project");
    }
  }

  async function deleteProject(id: string) {
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      removeProject(id);
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    }
    setDeletingId(null);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-2 pt-1 pb-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-7 text-xs text-muted-foreground"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          New project
        </Button>
      </div>

      {isCreating && (
        <div className="px-2 pb-2 flex gap-1">
          <Input
            autoFocus
            placeholder="Project name"
            value={creatingName}
            onChange={(e) => setCreatingName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") createProject();
              if (e.key === "Escape") setIsCreating(false);
            }}
            className="h-7 text-xs"
          />
          <Button size="icon" className="h-7 w-7 shrink-0" onClick={createProject}>
            <Check className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => setIsCreating(false)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="px-1 pb-2 space-y-0.5">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors ${
                activeProjectId === project.id
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted"
              }`}
              onClick={() => loadProject(project.id)}
            >
              {editingId === project.id ? (
                <div className="flex gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                  <Input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") renameProject(project.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="h-6 text-xs"
                  />
                  <Button
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => renameProject(project.id)}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="flex-1 truncate">{project.name}</span>
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(project.id);
                        setEditingName(project.name);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(project.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

          {projects.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-4 text-center">
              No projects yet. Click + to create one.
            </p>
          )}
        </div>
      </ScrollArea>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project and all generated audio files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingId && deleteProject(deletingId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
