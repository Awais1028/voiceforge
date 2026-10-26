import { NextRequest, NextResponse } from "next/server";
import { getProject, updateProject, getProjectSource, listProjectOutputs } from "@/lib/storage/projectStore";
import { getProviderForEngine } from "@/lib/providers";
import { paths } from "@/lib/storage/paths";
import { GenerateRequestSchema } from "@/lib/schemas";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const project = await getProject(id);

    if (project.status === "generating") {
      return NextResponse.json({ error: "Generation already in progress" }, { status: 409 });
    }

    const body = await req.json().catch(() => ({}));
    const input = GenerateRequestSchema.safeParse({
      text: body.text ?? (await getProjectSource(id)),
      voice: body.voice ?? project.voice,
      speed: body.speed ?? project.speed,
      outputFormats: body.outputFormats ?? project.outputFormats,
    });

    if (!input.success) {
      return NextResponse.json({ error: input.error.flatten() }, { status: 400 });
    }

    if (!input.data.text.trim()) {
      return NextResponse.json({ error: "Text is empty" }, { status: 400 });
    }

    await updateProject(id, { status: "generating" });

    const provider = getProviderForEngine(project.engine);
    const timestamp = Date.now();
    const filename = `output-${timestamp}`;

    try {
      const result = await provider.generate(input.data.text, input.data.voice!, {
        speed: input.data.speed!,
        outputDir: paths.projectOutputs(id),
        filename,
        formats: input.data.outputFormats as Array<"wav" | "mp3">,
      });

      if (!result.wavPath && !result.mp3Path) {
        const engineName = project.engine === "orpheus" ? "Orpheus" : "Kokoro";
        await updateProject(id, {
          status: "error",
          errorMessage: `${engineName} server is offline. Start it and try again.`,
        });
        return NextResponse.json(
          { error: `${engineName} server offline`, outputs: [] },
          { status: 503 }
        );
      }

      await updateProject(id, { status: "done", errorMessage: undefined });
      const outputs = await listProjectOutputs(id);

      return NextResponse.json({ result, outputs });
    } catch (genErr) {
      await updateProject(id, { status: "error", errorMessage: String(genErr) });
      return NextResponse.json({ error: String(genErr) }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
