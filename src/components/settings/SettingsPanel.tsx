"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Settings } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export function SettingsPanel() {
  const { settings, setSettings } = useAppStore();
  const [form, setForm] = useState<Partial<Settings>>(settings ?? {});
  const [saving, setSaving] = useState(false);

  if (!settings) return null;

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setSettings(await res.json());
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-xl space-y-6">
      <h2 className="text-lg font-semibold">Settings</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">TTS Engine</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Provider</Label>
            <Select
              value={form.ttsProvider ?? settings.ttsProvider}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, ttsProvider: v as Settings["ttsProvider"] }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kokoro">Kokoro TTS</SelectItem>
                <SelectItem value="f5-tts">F5-TTS</SelectItem>
                <SelectItem value="xtts">XTTS v2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Kokoro Server URL</Label>
            <Input
              value={form.kokoroUrl ?? settings.kokoroUrl}
              onChange={(e) => setForm((f) => ({ ...f, kokoroUrl: e.target.value }))}
              placeholder="http://localhost:8880"
            />
          </div>

          <div className="space-y-1.5">
            <Label>FFmpeg Path</Label>
            <Input
              value={form.ffmpegPath ?? settings.ffmpegPath}
              onChange={(e) => setForm((f) => ({ ...f, ffmpegPath: e.target.value }))}
              placeholder="ffmpeg"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Default Speed</Label>
              <span className="text-sm text-muted-foreground">
                {form.defaultSpeed ?? settings.defaultSpeed}x
              </span>
            </div>
            <Slider
              value={[form.defaultSpeed ?? settings.defaultSpeed]}
              min={0.5}
              max={2.0}
              step={0.1}
              onValueChange={(vals: number | readonly number[]) =>
                setForm((f) => ({
                  ...f,
                  defaultSpeed: Array.isArray(vals) ? (vals as number[])[0] : (vals as number),
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save Settings"}
      </Button>
    </div>
  );
}
