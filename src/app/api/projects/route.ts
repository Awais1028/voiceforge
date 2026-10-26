import { NextRequest, NextResponse } from "next/server";
import { listProjects, createProject } from "@/lib/storage/projectStore";
import { getSettings } from "@/lib/storage/settingsStore";
import { CreateProjectSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const projects = await listProjects();
    return NextResponse.json(projects);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = CreateProjectSchema.safeParse(body);
    if (!input.success) {
      return NextResponse.json({ error: input.error.flatten() }, { status: 400 });
    }
    const settings = await getSettings();
    const project = await createProject(input.data, settings.defaultVoice);
    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
