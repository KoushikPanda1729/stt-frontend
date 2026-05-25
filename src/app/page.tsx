"use client";

import { useState, useRef, DragEvent } from "react";

const MODELS = {
  google: {
    name: "Google Chirp 2",
    fullName: "Google STT (Chirp 2)",
    color: "blue",
    languages: [
      { label: "Swahili (Kenya)", code: "sw-KE" },
      { label: "Swahili (Tanzania)", code: "sw-TZ" },
      { label: "Afrikaans", code: "af-ZA" },
      { label: "Zulu", code: "zu-ZA" },
      { label: "Sotho", code: "st" },
      { label: "Amharic", code: "am-ET" },
      { label: "Yoruba", code: "yo-NG" },
      { label: "Hausa", code: "ha-NG" },
      { label: "Igbo", code: "ig-NG" },
      { label: "Somali", code: "so-SO" },
    ],
  },
  groq: {
    name: "Groq Whisper",
    fullName: "Groq Whisper Large v3 Turbo",
    color: "orange",
    languages: [
      { label: "Swahili", code: "sw" },
      { label: "Afrikaans", code: "af" },
      { label: "Zulu", code: "zu" },
      { label: "Sotho", code: "st" },
      { label: "Amharic", code: "am" },
      { label: "Hausa", code: "ha" },
      { label: "Yoruba", code: "yo" },
      { label: "Igbo", code: "ig" },
      { label: "Somali", code: "so" },
    ],
  },
  "meta-mms": {
    name: "Meta MMS",
    fullName: "Meta MMS (mms-1b-all)",
    color: "purple",
    languages: [
      { label: "Swahili", code: "sw" },
      { label: "Zulu", code: "zu" },
      { label: "Afrikaans", code: "af" },
      { label: "Sotho", code: "st" },
      { label: "Yoruba", code: "yo" },
      { label: "Igbo", code: "ig" },
      { label: "Hausa", code: "ha" },
      { label: "Amharic", code: "am" },
      { label: "Somali", code: "so" },
      { label: "Xhosa", code: "xh" },
    ],
  },
  speechmatics: {
    name: "Speechmatics",
    fullName: "Speechmatics Batch API",
    color: "green",
    languages: [
      { label: "Swahili", code: "sw" },
      { label: "Afrikaans", code: "af" },
      { label: "Zulu", code: "zu" },
      { label: "Sotho", code: "st" },
      { label: "Amharic", code: "am" },
      { label: "Hausa", code: "ha" },
      { label: "Yoruba", code: "yo" },
      { label: "Somali", code: "so" },
    ],
  },
  modulate: {
    name: "Modulate Velma-2",
    fullName: "Modulate Velma-2 STT",
    color: "pink",
    languages: [
      { label: "Swahili", code: "sw" },
      { label: "Zulu", code: "zu" },
      { label: "Afrikaans", code: "af" },
      { label: "Sotho", code: "st" },
      { label: "Amharic", code: "am" },
      { label: "Hausa", code: "ha" },
      { label: "Yoruba", code: "yo" },
      { label: "Somali", code: "so" },
    ],
  },
  "whisper-local": {
    name: "Whisper Local",
    fullName: "Whisper Large v3 Turbo (Local)",
    color: "gray",
    languages: [
      { label: "Swahili", code: "sw" },
      { label: "Afrikaans", code: "af" },
      { label: "Zulu", code: "zu" },
      { label: "Sotho", code: "st" },
      { label: "Amharic", code: "am" },
      { label: "Hausa", code: "ha" },
      { label: "Yoruba", code: "yo" },
      { label: "Somali", code: "so" },
      { label: "Igbo", code: "ig" },
    ],
  },
} as const;

// Common languages with per-model codes for Compare mode
const COMPARE_LANGUAGES = [
  { label: "Swahili",   codes: { google: "sw-KE", groq: "sw", "meta-mms": "sw", speechmatics: "sw", modulate: "sw", "whisper-local": "sw" } },
  { label: "Afrikaans", codes: { google: "af-ZA", groq: "af", "meta-mms": "af", speechmatics: "af", modulate: "af", "whisper-local": "af" } },
  { label: "Zulu",      codes: { google: "zu-ZA", groq: "zu", "meta-mms": "zu", speechmatics: "zu", modulate: "zu", "whisper-local": "zu" } },
  { label: "Sotho",     codes: { google: "st",    groq: "st", "meta-mms": "st", speechmatics: "st", modulate: "st", "whisper-local": "st" } },
  { label: "Amharic",   codes: { google: "am-ET", groq: "am", "meta-mms": "am", speechmatics: "am", modulate: "am", "whisper-local": "am" } },
  { label: "Hausa",     codes: { google: "ha-NG", groq: "ha", "meta-mms": "ha", speechmatics: "ha", modulate: "ha", "whisper-local": "ha" } },
  { label: "Yoruba",    codes: { google: "yo-NG", groq: "yo", "meta-mms": "yo", speechmatics: "yo", modulate: "yo", "whisper-local": "yo" } },
  { label: "Igbo",      codes: { google: "ig-NG", groq: "ig", "meta-mms": "ig", speechmatics: "ig", modulate: "ig", "whisper-local": "ig" } },
  { label: "Somali",    codes: { google: "so-SO", groq: "so", "meta-mms": "so", speechmatics: "so", modulate: "so", "whisper-local": "so" } },
  { label: "Xhosa",     codes: { google: "xh",    groq: "xh", "meta-mms": "xh", speechmatics: "xh", modulate: "xh", "whisper-local": "xh" } },
];

type ModelKey = keyof typeof MODELS;
type Mode = "single" | "compare";

interface TranscriptResult {
  success?: boolean;
  text?: string;
  language?: string;
  duration?: number;
  duration_ms?: number;
  segments?: Array<{ start: string; end: string; text: string }>;
  speakers?: Array<{ speaker: string; start_ms: number; language: string; text: string }>;
  job_id?: string;
  error?: string;
}

interface ModelResult {
  status: "idle" | "loading" | "done" | "error";
  data?: TranscriptResult;
}

const SELECTED_COLORS: Record<string, string> = {
  blue: "border-blue-500 bg-blue-50",
  orange: "border-orange-500 bg-orange-50",
  purple: "border-purple-500 bg-purple-50",
  green: "border-green-500 bg-green-50",
  pink: "border-pink-500 bg-pink-50",
  gray: "border-gray-500 bg-gray-50",
};

const SELECTED_TEXT: Record<string, string> = {
  blue: "text-blue-800",
  orange: "text-orange-800",
  purple: "text-purple-800",
  green: "text-green-800",
  pink: "text-pink-800",
  gray: "text-gray-800",
};

const CARD_ACCENT: Record<string, string> = {
  blue: "border-t-blue-400",
  orange: "border-t-orange-400",
  purple: "border-t-purple-400",
  green: "border-t-green-400",
  pink: "border-t-pink-400",
  gray: "border-t-gray-400",
};

const CARD_BADGE: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700",
  orange: "bg-orange-100 text-orange-700",
  purple: "bg-purple-100 text-purple-700",
  green: "bg-green-100 text-green-700",
  pink: "bg-pink-100 text-pink-700",
  gray: "bg-gray-100 text-gray-600",
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ─── Upload Zone (shared) ────────────────────────────────────────────────────
function UploadZone({
  file,
  dragging,
  onDrop,
  onDragOver,
  onDragLeave,
  onClick,
  fileRef,
  onFileChange,
  onRemove,
}: {
  file: File | null;
  dragging: boolean;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onClick: () => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (f: File) => void;
  onRemove: () => void;
}) {
  return (
    <div>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={onClick}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all select-none ${
          dragging
            ? "border-indigo-400 bg-indigo-50"
            : file
            ? "border-emerald-400 bg-emerald-50"
            : "border-gray-300 hover:border-gray-400 bg-gray-50"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.mpeg,.mp4"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFileChange(e.target.files[0])}
        />
        {file ? (
          <>
            <div className="w-10 h-10 mx-auto mb-3 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-emerald-700 truncate max-w-full px-4">{file.name}</p>
            <p className="text-xs text-emerald-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">
              Drop audio here or <span className="text-indigo-600 font-medium">browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">MP3, WAV, M4A, MPEG, OGG, FLAC</p>
          </>
        )}
      </div>

      {!file && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-xs text-amber-700 leading-relaxed">
            <span className="font-semibold">Audio limit: 60 seconds.</span> Please upload a clip no longer than 1 minute for accurate transcription results across all models.
          </p>
        </div>
      )}

      {file && (
        <div className="mt-3 space-y-2">
          <audio key={file.name} controls src={URL.createObjectURL(file)} className="w-full h-10 rounded-lg" />
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Remove file
          </button>
        </div>
      )}
    </div>
  );
}

function parseError(msg: string): { type: "unsupported" | "generic"; text: string } {
  const lower = msg.toLowerCase();
  if (
    lower.includes("not supported") ||
    lower.includes("unsupported language") ||
    lower.includes("languagepack") ||
    lower.includes("invalid language")
  ) {
    return { type: "unsupported", text: "Language not supported by this model" };
  }
  // Strip raw command output — keep first sentence only
  const firstLine = msg.split("\n")[0].slice(0, 120);
  return { type: "generic", text: firstLine + (msg.length > 120 ? "…" : "") };
}

// ─── Compare result card ─────────────────────────────────────────────────────
function CompareCard({ modelKey, result }: { modelKey: ModelKey; result: ModelResult }) {
  const m = MODELS[modelKey];
  const [copied, setCopied] = useState(false);

  const copyText = () => {
    if (result.data?.text) {
      navigator.clipboard.writeText(result.data.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 border-t-4 ${CARD_ACCENT[m.color]} flex flex-col`}>
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CARD_BADGE[m.color]}`}>
          {m.name}
        </span>
        {result.status === "done" && result.data?.text && (
          <button onClick={copyText} className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
      </div>

      {/* Card body */}
      <div className="flex-1 p-4">
        {result.status === "idle" && (
          <p className="text-xs text-gray-300 text-center mt-4">Waiting...</p>
        )}

        {result.status === "loading" && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <svg className="animate-spin w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs text-gray-400">Transcribing...</span>
          </div>
        )}

        {result.status === "error" && (() => {
          const parsed = parseError(result.data?.error || "Unknown error");
          return parsed.type === "unsupported" ? (
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full border border-gray-200">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Language not supported
              </span>
            </div>
          ) : (
            <div className="flex gap-2 mt-2 p-2.5 bg-red-50 rounded-lg border border-red-100">
              <svg className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-red-600 leading-relaxed">{parsed.text}</p>
            </div>
          );
        })()}

        {result.status === "done" && result.data && (
          <div className="space-y-3">
            {/* Chips */}
            <div className="flex flex-wrap gap-1.5">
              {result.data.language && (
                <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                  {result.data.language}
                </span>
              )}
              {result.data.duration != null && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                  {formatDuration(result.data.duration)}
                </span>
              )}
              {result.data.duration_ms != null && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                  {formatDuration(result.data.duration_ms / 1000)}
                </span>
              )}
              {result.data.segments && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                  {result.data.segments.length} segments
                </span>
              )}
            </div>
            {/* Text — scrollable so all cards stay same height */}
            <div className="max-h-40 overflow-y-auto pr-1">
              <p className="text-sm text-gray-800 leading-relaxed">
                {result.data.text || "No speech detected"}
              </p>
            </div>

            {/* Speaker diarization */}
            {result.data.speakers && result.data.speakers.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Speaker Diarization
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {result.data.speakers.map((s, i) => (
                    <div key={i} className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-semibold text-blue-700">{s.speaker}</span>
                        <span className="text-xs text-blue-400">{(s.start_ms / 1000).toFixed(1)}s</span>
                        {s.language && <span className="text-xs text-blue-400 font-mono">{s.language}</span>}
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Segments */}
            {result.data.segments && result.data.segments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  {result.data.segments.length} Segments
                </p>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {result.data.segments.map((s, i) => (
                    <div key={i} className="flex gap-2 text-xs py-1 border-b border-gray-100 last:border-0">
                      <span className="text-gray-400 font-mono shrink-0 w-10">{s.start}s</span>
                      <span className="text-gray-700">{s.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function Home() {
  const [mode, setMode] = useState<Mode>("single");

  // Single mode state
  const [model, setModel] = useState<ModelKey>("google");
  const [language, setLanguage] = useState<string>(MODELS.google.languages[0].code);
  const [singleResult, setSingleResult] = useState<TranscriptResult | null>(null);
  const [singleLoading, setSingleLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Compare mode state
  const [compareLanguage, setCompareLanguage] = useState(COMPARE_LANGUAGES[0]);
  const [compareResults, setCompareResults] = useState<Record<ModelKey, ModelResult>>({
    google: { status: "idle" },
    groq: { status: "idle" },
    "meta-mms": { status: "idle" },
    speechmatics: { status: "idle" },
    modulate: { status: "idle" },
    "whisper-local": { status: "idle" },
  });

  // Shared
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setSingleResult(null);
    setCompareResults({
      google: { status: "idle" },
      groq: { status: "idle" },
      "meta-mms": { status: "idle" },
      speechmatics: { status: "idle" },
      modulate: { status: "idle" },
      "whisper-local": { status: "idle" },
    });
  };

  const handleModelChange = (m: ModelKey) => {
    setModel(m);
    setLanguage(MODELS[m].languages[0].code);
    setSingleResult(null);
  };

  // ── Single transcribe ──
  const onSingleSubmit = async () => {
    if (!file || singleLoading) return;
    setSingleLoading(true);
    setSingleResult(null);
    const form = new FormData();
    form.append("audio", file);
    form.append("model", model);
    form.append("language", language);
    try {
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = await res.json();
      setSingleResult(data);
    } catch {
      setSingleResult({ error: "Network error — is the backend server running?" });
    } finally {
      setSingleLoading(false);
    }
  };

  // ── Compare: fire all models in parallel, update each card independently ──
  const onCompareSubmit = () => {
    if (!file) return;

    const allModels = Object.keys(MODELS) as ModelKey[];

    // Set all to loading at once
    setCompareResults({
      google: { status: "loading" },
      groq: { status: "loading" },
      "meta-mms": { status: "loading" },
      speechmatics: { status: "loading" },
      modulate: { status: "loading" },
      "whisper-local": { status: "loading" },
    });

    // Fire each model independently so cards update as results arrive
    allModels.forEach(async (m) => {
      const langCode = compareLanguage.codes[m];
      const form = new FormData();
      form.append("audio", file);
      form.append("model", m);
      form.append("language", langCode);

      try {
        const res = await fetch("/api/transcribe", { method: "POST", body: form });
        const data = await res.json();
        setCompareResults((prev) => ({ ...prev, [m]: { status: data.error ? "error" : "done", data } }));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Network error";
        setCompareResults((prev) => ({ ...prev, [m]: { status: "error", data: { error: msg } } }));
      }
    });
  };

  const copyText = () => {
    if (singleResult?.text) {
      navigator.clipboard.writeText(singleResult.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentModel = MODELS[model];
  const currentColor = currentModel.color;
  const isCompareRunning = Object.values(compareResults).some((r) => r.status === "loading");

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900 leading-tight">African Language STT</h1>
              <p className="text-xs text-gray-400">6-model speech transcription evaluation</p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setMode("single")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                mode === "single" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Single Model
            </button>
            <button
              onClick={() => setMode("compare")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                mode === "compare" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Compare All
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── SINGLE MODEL MODE ── */}
        {mode === "single" && (
          <div className="space-y-6">
            <section>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">1. Choose Model</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {(Object.keys(MODELS) as ModelKey[]).map((m) => {
                  const isSelected = model === m;
                  const c = MODELS[m].color;
                  return (
                    <button
                      key={m}
                      onClick={() => handleModelChange(m)}
                      className={`text-left p-3 rounded-xl border-2 transition-all ${
                        isSelected ? SELECTED_COLORS[c] : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <span className={`text-sm font-semibold leading-tight block ${isSelected ? SELECTED_TEXT[c] : "text-gray-800"}`}>
                        {MODELS[m].name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <section>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">2. Choose Language</p>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white appearance-none cursor-pointer"
                    >
                      {currentModel.languages.map((l) => (
                        <option key={l.code} value={l.code}>{l.label} — {l.code}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-2">
                      {currentModel.languages.length} languages available for {currentModel.fullName}
                    </p>
                  </div>
                </section>

                <section>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">3. Upload Audio</p>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <UploadZone
                      file={file}
                      dragging={dragging}
                      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onClick={() => fileRef.current?.click()}
                      fileRef={fileRef}
                      onFileChange={handleFile}
                      onRemove={() => { setFile(null); setSingleResult(null); }}
                    />
                  </div>
                </section>

                <button
                  onClick={onSingleSubmit}
                  disabled={!file || singleLoading}
                  className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
                    !file || singleLoading
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-sm"
                  }`}
                >
                  {singleLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Transcribing...
                    </span>
                  ) : "Transcribe"}
                </button>

                {singleLoading && (
                  <div className="text-xs text-gray-400 text-center">
                    {model === "speechmatics" && <p>Speechmatics polls until complete — may take 15–30s</p>}
                    {model === "meta-mms" && <p>Meta MMS loads model on first run — may take 60–120s</p>}
                    {model === "whisper-local" && <p>Running local Whisper — depends on hardware</p>}
                  </div>
                )}
              </div>

              {/* Single result panel */}
              <div className="bg-white rounded-xl border border-gray-200 flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-700">Transcript</h2>
                  {singleResult?.text && (
                    <button onClick={copyText} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                      {copied ? "Copied!" : "Copy text"}
                    </button>
                  )}
                </div>
                <div className="flex-1 p-5 flex flex-col">
                  {!singleResult && !singleLoading && (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-14 h-14 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                          <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-400">Select a model, language, and audio file</p>
                        <p className="text-xs text-gray-300 mt-1">then click Transcribe</p>
                      </div>
                    </div>
                  )}
                  {singleLoading && (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-14 h-14 mx-auto mb-4 bg-indigo-50 rounded-2xl flex items-center justify-center">
                          <svg className="animate-spin w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-600">{currentModel.fullName}</p>
                        <p className="text-xs text-gray-400 mt-1">Processing audio...</p>
                      </div>
                    </div>
                  )}
                  {singleResult && (
                    <div className="flex flex-col gap-4">
                      {singleResult.error ? (
                        <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                          <div className="flex gap-2">
                            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-red-700">{singleResult.error}</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-wrap gap-2">
                            {singleResult.language && (
                              <span className="text-xs px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">{singleResult.language}</span>
                            )}
                            {singleResult.duration != null && (
                              <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">{formatDuration(singleResult.duration)}</span>
                            )}
                            {singleResult.duration_ms != null && (
                              <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">{formatDuration(singleResult.duration_ms / 1000)}</span>
                            )}
                            {singleResult.job_id && (
                              <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full font-mono">{singleResult.job_id}</span>
                            )}
                            {singleResult.segments && (
                              <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full">{singleResult.segments.length} segments</span>
                            )}
                          </div>
                          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-sm text-gray-800 leading-relaxed">{singleResult.text || "No speech detected"}</p>
                          </div>
                          {singleResult.speakers && singleResult.speakers.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Speaker Diarization</p>
                              <div className="space-y-2">
                                {singleResult.speakers.map((s, i) => (
                                  <div key={i} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-semibold text-blue-700">{s.speaker}</span>
                                      <span className="text-xs text-blue-400">{(s.start_ms / 1000).toFixed(1)}s</span>
                                      {s.language && <span className="text-xs text-blue-400 font-mono">{s.language}</span>}
                                    </div>
                                    <p className="text-xs text-gray-700 leading-relaxed">{s.text}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {singleResult.segments && singleResult.segments.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Segments</p>
                              <div className="space-y-1">
                                {singleResult.segments.map((s, i) => (
                                  <div key={i} className="flex gap-3 text-xs py-1 border-b border-gray-100 last:border-0">
                                    <span className="text-gray-400 font-mono shrink-0 w-12">{s.start}s</span>
                                    <span className="text-gray-700">{s.text}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── COMPARE ALL MODE ── */}
        {mode === "compare" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Language picker */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">1. Choose Language</p>
                <select
                  value={compareLanguage.label}
                  onChange={(e) => {
                    const found = COMPARE_LANGUAGES.find((l) => l.label === e.target.value);
                    if (found) setCompareLanguage(found);
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none cursor-pointer"
                >
                  {COMPARE_LANGUAGES.map((l) => (
                    <option key={l.label} value={l.label}>{l.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-2">Same audio sent to all 6 models</p>
              </div>

              {/* Upload */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 lg:col-span-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">2. Upload Audio</p>
                <UploadZone
                  file={file}
                  dragging={dragging}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onClick={() => fileRef.current?.click()}
                  fileRef={fileRef}
                  onFileChange={handleFile}
                  onRemove={() => { setFile(null); setCompareResults({ google: { status: "idle" }, groq: { status: "idle" }, "meta-mms": { status: "idle" }, speechmatics: { status: "idle" }, modulate: { status: "idle" }, "whisper-local": { status: "idle" } }); }}
                />
              </div>
            </div>

            {/* Compare button */}
            <button
              onClick={onCompareSubmit}
              disabled={!file || isCompareRunning}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
                !file || isCompareRunning
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-sm"
              }`}
            >
              {isCompareRunning ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Running all models in parallel...
                </span>
              ) : "Compare All 6 Models"}
            </button>

            {/* Results grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {(Object.keys(MODELS) as ModelKey[]).map((m) => (
                <CompareCard key={m} modelKey={m} result={compareResults[m]} />
              ))}
            </div>
          </div>
        )}

        <footer className="text-center text-xs text-gray-400 pb-4 pt-8">
          Google Chirp 2 · Groq Whisper · Meta MMS · Speechmatics · Modulate Velma-2 · Whisper Local
        </footer>
      </div>
    </main>
  );
}
