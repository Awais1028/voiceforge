import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { paths } from "@/lib/storage/paths";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const safeId = path.basename(id);
    const dir = path.join(paths.voices, safeId);

    // prefer mp3 (smaller), fall back to wav
    for (const [file, type] of [
      ["preview.mp3", "audio/mpeg"],
      ["preview.wav", "audio/wav"],
    ] as const) {
      const filePath = path.join(dir, file);
      try {
        const buffer = await fs.readFile(filePath);
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": type,
            "Cache-Control": "public, max-age=86400",
          },
        });
      } catch {
        continue;
      }
    }

    return NextResponse.json({ error: "No preview available" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
