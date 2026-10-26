import { NextResponse } from "next/server";
import { getProviderForEngine } from "@/lib/providers";

export async function GET() {
  try {
    const [kokoro, orpheus] = await Promise.all([
      getProviderForEngine("kokoro").checkHealth(),
      getProviderForEngine("orpheus").checkHealth(),
    ]);
    return NextResponse.json({
      kokoro,
      orpheus,
      healthy: kokoro || orpheus,
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { kokoro: false, orpheus: false, healthy: false, error: String(err) },
      { status: 200 }
    );
  }
}
