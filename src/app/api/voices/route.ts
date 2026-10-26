import { NextResponse } from "next/server";
import { listVoices } from "@/lib/storage/voiceStore";

export async function GET() {
  try {
    const voices = await listVoices();
    return NextResponse.json(voices);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
