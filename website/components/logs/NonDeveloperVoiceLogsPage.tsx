"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface AudioMetadataResponse {
  userId?: string;
  audioMetadata?: Record<string, unknown>;
  count?: number;
  error?: string;
}

interface VoiceNoteItem {
  messageId: string;
  transcription: string;
  modified: string | null;
  modifiedMs: number | null;
  durationSeconds: number | null;
}

function formatDateTimeLabel(isoString: string | null): string {
  if (!isoString) return "Unknown";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
}

function formatDurationLabel(seconds: number | null): string {
  if (seconds == null || Number.isNaN(seconds)) return "Unknown";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainderSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainderSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainderMinutes = minutes % 60;
  return `${hours}h ${remainderMinutes}m`;
}

export default function NonDeveloperVoiceLogsPage({ phone }: { phone: string }) {
  const [audioMetadata, setAudioMetadata] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAudioMetadata = useCallback(async () => {
    if (!phone) {
      setAudioMetadata({});
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/audio-metadata?phone=${encodeURIComponent(phone)}`);
      const data = (await response.json()) as AudioMetadataResponse;
      if (!response.ok || data.error) {
        setAudioMetadata({});
        setError(data.error || "Failed to load voice notes");
        return;
      }
      setAudioMetadata(data.audioMetadata ?? {});
    } catch {
      setAudioMetadata({});
      setError("Failed to load voice notes");
    } finally {
      setLoading(false);
    }
  }, [phone]);

  useEffect(() => {
    void fetchAudioMetadata();
  }, [fetchAudioMetadata]);

  const voiceNotes = useMemo((): VoiceNoteItem[] => {
    return Object.entries(audioMetadata)
      .map(([messageId, value]) => {
        const record = (value && typeof value === "object") ? (value as Record<string, unknown>) : {};
        const transcription = typeof record.transcription === "string" ? record.transcription : "";
        const modified = typeof record.modified === "string" ? record.modified : null;
        const durationSeconds =
          typeof record.duration_seconds === "number" && Number.isFinite(record.duration_seconds)
            ? Math.max(0, Math.round(record.duration_seconds))
            : null;
        const modifiedMs = modified ? new Date(modified).getTime() : null;

        return {
          messageId,
          transcription,
          modified,
          modifiedMs: Number.isFinite(modifiedMs ?? NaN) ? modifiedMs : null,
          durationSeconds,
        };
      })
      .sort((a, b) => {
        const left = a.modifiedMs ?? 0;
        const right = b.modifiedMs ?? 0;
        if (right !== left) return right - left;
        return a.messageId.localeCompare(b.messageId);
      });
  }, [audioMetadata]);

  return (
    <main className="min-h-screen pt-20 pb-12 px-4 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <section className="space-y-2">
          <h1 className="text-2xl font-semibold text-white">Voice Notes</h1>
          <p className="text-sm text-slate-400">All your recorded voice note transcripts in one place.</p>
        </section>

        <section className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-300">
              {voiceNotes.length} voice note{voiceNotes.length === 1 ? "" : "s"}
            </p>
            <button
              type="button"
              onClick={() => void fetchAudioMetadata()}
              disabled={loading}
              className="cursor-pointer rounded-lg border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700/80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {!phone ? (
            <div className="rounded-lg border border-slate-800/50 bg-slate-950/50 px-4 py-3 text-sm text-slate-400">
              Connect WhatsApp to start collecting voice notes.
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : loading ? (
            <div className="rounded-lg border border-slate-800/50 bg-slate-950/50 px-4 py-3 text-sm text-slate-400">
              Loading voice notes...
            </div>
          ) : voiceNotes.length === 0 ? (
            <div className="rounded-lg border border-slate-800/50 bg-slate-950/50 px-4 py-3 text-sm text-slate-400">
              No voice notes found yet.
            </div>
          ) : (
            <div className="space-y-3">
              {voiceNotes.map((note) => (
                <article key={note.messageId} className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-md border border-slate-700/70 bg-slate-900/70 px-2 py-1 text-slate-200">
                      {formatDateTimeLabel(note.modified)}
                    </span>
                    <span className="rounded-md border border-slate-700/70 bg-slate-900/70 px-2 py-1 text-slate-200">
                      Duration: {formatDurationLabel(note.durationSeconds)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-100">
                    {note.transcription.trim() || "No transcript available for this voice note yet."}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
