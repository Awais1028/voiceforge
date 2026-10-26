import { NextRequest, NextResponse } from "next/server";
import { listProjectOutputs } from "@/lib/storage/projectStore";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const outputs = await listProjectOutputs(id);
    return NextResponse.json(outputs);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
