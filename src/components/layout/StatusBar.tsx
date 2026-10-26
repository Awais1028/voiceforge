"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { SystemMonitor } from "./SystemMonitor";

export function StatusBar() {
  const { engineHealth, setEngineHealth } = useAppStore();

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/tts/health");
        const data = await res.json();
        setEngineHealth({ kokoro: data.kokoro === true, orpheus: data.orpheus === true });
      } catch {
        setEngineHealth({ kokoro: false, orpheus: false });
      }
    }
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [setEngineHealth]);

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-1.5 border-b bg-muted/30 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              engineHealth.kokoro ? "bg-green-500" : "bg-red-400"
            }`}
          />
          Kokoro {engineHealth.kokoro ? "online" : "offline"}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              engineHealth.orpheus ? "bg-green-500" : "bg-red-400"
            }`}
          />
          Orpheus {engineHealth.orpheus ? "online" : "offline"}
        </span>
      </div>
      <SystemMonitor />
    </div>
  );
}
