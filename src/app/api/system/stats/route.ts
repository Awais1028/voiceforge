import { NextResponse } from "next/server";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

type Snapshot = { idle: number; total: number };

function snapshot(): Snapshot {
  let idle = 0;
  let total = 0;
  for (const cpu of os.cpus()) {
    for (const k of Object.keys(cpu.times) as (keyof typeof cpu.times)[]) {
      total += cpu.times[k];
    }
    idle += cpu.times.idle;
  }
  return { idle, total };
}

// macOS reports almost all RAM as "used" (cache/inactive), so os.freemem is
// misleading. Parse vm_stat to count reclaimable pages for a realistic figure.
async function macAvailableBytes(): Promise<number | null> {
  try {
    const { stdout } = await execFileAsync("vm_stat");
    const pageSizeMatch = stdout.match(/page size of (\d+) bytes/);
    const pageSize = pageSizeMatch ? parseInt(pageSizeMatch[1], 10) : 16384;
    const pagesOf = (label: string) => {
      const m = stdout.match(new RegExp(`${label}:\\s+(\\d+)\\.`));
      return m ? parseInt(m[1], 10) : 0;
    };
    const reclaimable =
      pagesOf("Pages free") +
      pagesOf("Pages inactive") +
      pagesOf("Pages speculative") +
      pagesOf("Pages purgeable");
    return reclaimable * pageSize;
  } catch {
    return null;
  }
}

export async function GET() {
  // sample CPU twice over a short window to compute instantaneous usage
  const a = snapshot();
  await new Promise((r) => setTimeout(r, 150));
  const b = snapshot();

  const idleDelta = b.idle - a.idle;
  const totalDelta = b.total - a.total;
  const cpuPercent =
    totalDelta > 0 ? Math.round((1 - idleDelta / totalDelta) * 100) : 0;

  const totalMem = os.totalmem();
  const available =
    process.platform === "darwin"
      ? (await macAvailableBytes()) ?? os.freemem()
      : os.freemem();
  const usedMem = totalMem - available;

  return NextResponse.json({
    cpuPercent,
    cores: os.cpus().length,
    memUsedGB: +(usedMem / 1e9).toFixed(1),
    memTotalGB: +(totalMem / 1e9).toFixed(1),
    memPercent: Math.round((usedMem / totalMem) * 100),
  });
}
