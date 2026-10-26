import path from "path";

const DATA_ROOT = path.join(process.cwd(), "data");

export const paths = {
  data: DATA_ROOT,
  projects: path.join(DATA_ROOT, "projects"),
  voices: path.join(DATA_ROOT, "voices"),
  settings: path.join(DATA_ROOT, "settings"),
  project: (id: string) => path.join(DATA_ROOT, "projects", id),
  projectJson: (id: string) => path.join(DATA_ROOT, "projects", id, "project.json"),
  projectSource: (id: string) => path.join(DATA_ROOT, "projects", id, "source.txt"),
  projectOutputs: (id: string) => path.join(DATA_ROOT, "projects", id, "outputs"),
  voiceJson: (id: string) => path.join(DATA_ROOT, "voices", id, "voice.json"),
  settingsJson: path.join(DATA_ROOT, "settings", "settings.json"),
};
