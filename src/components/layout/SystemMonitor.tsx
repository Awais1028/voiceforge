"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Cpu, MemoryStick, Timer } from "lucide-react";

interface Stats {
  cpuPercent: number;
  cores: number;
  memUsedGB: number;
  memTotalGB: number;
  memPercent: number;
}

const HISTORY = 24;

export function SystemMonitor() {
  const isGenerating = useAppStore((s) => s.isGenerating);
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<number[]>([]);

  const [elapsedMs, setElapsedMs] = useState(0);
  const [lastMs, setLastMs] = useState<number | null>(null);
  const startRef = useRef<number | null>(null);

  // poll system stats — faster while generating so the graph feels live
  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const res = await fetch("/api/system/stats");
        const data: Stats = await res.json();
        if (!active) return;
        setStats(data);
        setHistory((h) => [...h, data.cpuPercent].slice(-HISTORY));
      } catch {
        /* ignore transient errors */
      }
    }
    poll();
    const interval = setInterval(poll, isGenerating ? 1000 : 2500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isGenerating]);

  // generation timer
  useEffect(() => {
    if (isGenerating) {
      startRef.current = Date.now();
      setElapsedMs(0);
      const t = setInterval(() => {
        if (startRef.current) setElapsedMs(Date.now() - startRef.current);
      }, 100);
      return () => clearInterval(t);
    }
    if (startRef.current) {
      setLastMs(Date.now() - startRef.current);
      startRef.current = null;
    }
  }, [isGenerating]);

  const fmt = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

  return (
    <div className="flex items-center gap-4">
      {/* generation timer */}
      {isGenerating ? (
        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 tabular-nums font-medium">
          <Timer className="h-3 w-3 animate-pulse" />
          {fmt(elapsedMs)}
        </span>
      ) : (
        lastMs !== null && (
          <span className="flex items-center gap-1.5 tabular-nums" title="Last generation time">
            <Timer className="h-3 w-3" />
            {fmt(lastMs)}
          </span>
        )
      )}

      {/* CPU with sparkline */}
      {stats && (
        <span className="flex items-center gap-1.5 tabular-nums" title={`${stats.cores} cores`}>
          <Cpu className="h-3 w-3" />
          <Sparkline data={history} />
          <span className={stats.cpuPercent > 80 ? "text-amber-600 dark:text-amber-400" : ""}>
            {stats.cpuPercent}%
          </span>
        </span>
      )}

      {/* RAM */}
      {stats && (
        <span
          className="flex items-center gap-1.5 tabular-nums"
          title={`${stats.memUsedGB} / ${stats.memTotalGB} GB`}
        >
          <MemoryStick className="h-3 w-3" />
          {stats.memUsedGB}/{stats.memTotalGB}GB
        </span>
      )}
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const w = 48;
  const h = 12;
  if (data.length < 2) return <span className="inline-block" style={{ width: w }} />;
  const max = 100;
  const step = w / (HISTORY - 1);
  const points = data
    .map((v, i) => `${i * step},${h - (v / max) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="text-violet-500"
        strokeLinejoin="round"
      />
    </svg>
  );
}
