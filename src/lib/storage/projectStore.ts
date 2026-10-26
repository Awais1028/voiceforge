import fs from "fs/promises";
import path from "path";
import { paths } from "./paths";
import {
  Project,
  ProjectSchema,
  CreateProjectInput,
  UpdateProjectInput,
  AudioOutput,
  AudioOutputSchema,
} from "@/lib/schemas";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function ensureOutputsDir(id: string): Promise<void> {
  await fs.mkdir(paths.projectOutputs(id), { recursive: true });
}

export async function listProjects(): Promise<Project[]> {
  try {
    const entries = await fs.readdir(paths.projects, { withFileTypes: true });
    const projects: Project[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      try {
        const raw = await fs.readFile(paths.projectJson(entry.name), "utf-8");
        const parsed = ProjectSchema.parse(JSON.parse(raw));
        projects.push(parsed);
      } catch {
        // skip malformed project folders
      }
    }

    return projects.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch {
    return [];
  }
}

export async function getProject(id: string): Promise<Project> {
  try {
    const raw = await fs.readFile(paths.projectJson(id), "utf-8");
    return ProjectSchema.parse(JSON.parse(raw));
  } catch {
    throw new Error(`Project not found: ${id}`);
  }
}

export async function createProject(
  input: CreateProjectInput,
  defaultVoice: string
): Promise<Project> {
  const baseSlug = slugify(input.name);
  let id = baseSlug;
  let counter = 1;

  while (true) {
    try {
      await fs.access(paths.project(id));
      id = `${baseSlug}-${counter++}`;
    } catch {
      break;
    }
  }

  const now = new Date().toISOString();
  const project: Project = {
    id,
    name: input.name,
    createdAt: now,
    updatedAt: now,
    engine: "kokoro",
    voice: input.voice ?? defaultVoice,
    speed: 1.0,
    outputFormats: ["wav", "mp3"],
    status: "idle",
  };

  await fs.mkdir(paths.project(id), { recursive: true });
  await ensureOutputsDir(id);
  await fs.writeFile(paths.projectJson(id), JSON.stringify(project, null, 2));
  await fs.writeFile(paths.projectSource(id), "");

  return project;
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput
): Promise<Project> {
  const existing = await getProject(id);
  const updated: Project = {
    ...existing,
    ...input,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(paths.projectJson(id), JSON.stringify(updated, null, 2));
  return updated;
}

export async function deleteProject(id: string): Promise<void> {
  try {
    await fs.rm(paths.project(id), { recursive: true, force: true });
  } catch {
    throw new Error(`Failed to delete project: ${id}`);
  }
}

export async function getProjectSource(id: string): Promise<string> {
  try {
    return await fs.readFile(paths.projectSource(id), "utf-8");
  } catch {
    return "";
  }
}

export async function saveProjectSource(id: string, text: string): Promise<void> {
  await getProject(id); // verify exists
  await fs.writeFile(paths.projectSource(id), text, "utf-8");
  await updateProject(id, { updatedAt: new Date().toISOString() } as UpdateProjectInput);
}

export async function listProjectOutputs(id: string): Promise<AudioOutput[]> {
  await ensureOutputsDir(id);
  try {
    const files = await fs.readdir(paths.projectOutputs(id));
    const outputs: AudioOutput[] = [];

    for (const filename of files) {
      const ext = path.extname(filename).toLowerCase().slice(1);
      if (ext !== "wav" && ext !== "mp3") continue;

      const filePath = path.join(paths.projectOutputs(id), filename);
      const stat = await fs.stat(filePath);

      outputs.push(
        AudioOutputSchema.parse({
          filename,
          format: ext as "wav" | "mp3",
          sizeBytes: stat.size,
          createdAt: stat.birthtime.toISOString(),
          url: `/api/projects/${id}/outputs/${filename}`,
        })
      );
    }

    return outputs.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

export async function deleteProjectOutput(id: string, filename: string): Promise<void> {
  const filePath = path.join(paths.projectOutputs(id), filename);
  await fs.unlink(filePath);
}
