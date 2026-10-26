import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { paths } from "@/lib/storage/paths";
import { deleteProjectOutput } from "@/lib/storage/projectStore";

type Params = { params: Promise<{ id: string; filename: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id, filename } = await params;
    const safeName = path.basename(filename);
    const filePath = path.join(paths.projectOutputs(id), safeName);

    const buffer = await fs.readFile(filePath);
    const ext = path.extname(safeName).toLowerCase();
    const contentType = ext === ".mp3" ? "audio/mpeg" : "audio/wav";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${safeName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id, filename } = await params;
    const safeName = path.basename(filename);
    await deleteProjectOutput(id, safeName);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
