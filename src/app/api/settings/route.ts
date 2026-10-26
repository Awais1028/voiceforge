import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/storage/settingsStore";
import { UpdateSettingsSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const input = UpdateSettingsSchema.safeParse(body);
    if (!input.success) {
      return NextResponse.json({ error: input.error.flatten() }, { status: 400 });
    }
    const settings = await updateSettings(input.data);
    return NextResponse.json(settings);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
