"use client";

import { useState, useRef, DragEvent } from "react";

const MODELS = {
  google: {
    name: "Google Chirp 2",
    fullName: "Google STT (Chirp 2)",
    description: "Best Zulu + broadest coverage",
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
    description: "Fast cloud API with timestamps",
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
    description: "Open source, 1B param model",
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
    description: "Highest Swahili accuracy",
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
    description: "Best Afrikaans + speaker labels",
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
    description: "Self-hosted, includes translation",
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

type ModelKey = keyof typeof MODELS;

interface TranscriptResult {
  success: boolean;
  text?: string;
  language?: string;
  duration?: number;
  duration_ms?: number;
  segments?: Array<{ start: string; end: string; text: string }>;
  speakers?: Array<{ speaker: string; start_ms: number; language: string; text: string }>;
  job_id?: string;
  error?: string;
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

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function Home() {
  const [model, setModel] = useState<ModelKey>("google");
  const [language, setLanguage] = useState<string>(MODELS.google.languages[0].code);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranscriptResult | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleModelChange = (m: ModelKey) => {
    setModel(m);
    setLanguage(MODELS[m].languages[0].code);
    setResult(null);
  };

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const onSubmit = async () => {
    if (!file || loading) return;
    setLoading(true);
    setResult(null);
    const form = new FormData();
    form.append("audio", file);
    form.append("model", model);
    form.append("language", language);
    try {
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, error: "Network error — is the backend server running?" });
    } finally {
      setLoading(false);
    }
  };

  const copyText = () => {
    if (result?.text) {
      navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentModel = MODELS[model];
  const currentColor = currentModel.color;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
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
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Step 1 — Model */}
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
          {/* Left column — controls */}
          <div className="space-y-4">
            {/* Step 2 — Language */}
            <section>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">2. Choose Language</p>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white appearance-none cursor-pointer"
                >
                  {currentModel.languages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label} — {l.code}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-2">
                  {currentModel.languages.length} languages available for {currentModel.fullName}
                </p>
              </div>
            </section>

            {/* Step 3 — Upload */}
            <section>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">3. Upload Audio</p>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div
                  onDrop={onDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onClick={() => fileRef.current?.click()}
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
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
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
                        Drop audio here or{" "}
                        <span className="text-indigo-600 font-medium">browse</span>
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
                    <audio
                      key={file.name}
                      controls
                      src={URL.createObjectURL(file)}
                      className="w-full h-10 rounded-lg"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Remove file
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Submit */}
            <button
              onClick={onSubmit}
              disabled={!file || loading}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
                !file || loading
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-sm"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Transcribing...
                </span>
              ) : (
                "Transcribe"
              )}
            </button>

            {/* Processing hints */}
            {loading && (
              <div className="text-xs text-gray-400 text-center space-y-0.5">
                {model === "speechmatics" && <p>Speechmatics polls until complete — may take 15–30s</p>}
                {model === "meta-mms" && <p>Meta MMS loads model on first run — may take 60–120s</p>}
                {model === "whisper-local" && <p>Running local Whisper — depends on hardware</p>}
              </div>
            )}
          </div>

          {/* Right column — result */}
          <div className="bg-white rounded-xl border border-gray-200 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Transcript</h2>
              {result?.text && (
                <button
                  onClick={copyText}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  {copied ? "Copied!" : "Copy text"}
                </button>
              )}
            </div>

            <div className="flex-1 p-5 flex flex-col">
              {/* Empty state */}
              {!result && !loading && (
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

              {/* Loading */}
              {loading && (
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

              {/* Result */}
              {result && (
                <div className="flex flex-col gap-4">
                  {result.error ? (
                    <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                      <div className="flex gap-2">
                        <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-red-700">{result.error}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Metadata chips */}
                      <div className="flex flex-wrap gap-2">
                        {result.language && (
                          <span className="text-xs px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                            {result.language}
                          </span>
                        )}
                        {result.duration != null && (
                          <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {formatDuration(result.duration)}
                          </span>
                        )}
                        {result.duration_ms != null && (
                          <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {formatDuration(result.duration_ms / 1000)}
                          </span>
                        )}
                        {result.job_id && (
                          <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full font-mono">
                            {result.job_id}
                          </span>
                        )}
                        {result.segments && (
                          <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full">
                            {result.segments.length} segments
                          </span>
                        )}
                      </div>

                      {/* Main transcript */}
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-sm text-gray-800 leading-relaxed">{result.text || "No speech detected"}</p>
                      </div>

                      {/* Speaker diarization (Modulate) */}
                      {result.speakers && result.speakers.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Speaker Diarization
                          </p>
                          <div className="space-y-2">
                            {result.speakers.map((s, i) => (
                              <div key={i} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold text-blue-700">{s.speaker}</span>
                                  <span className="text-xs text-blue-400">{(s.start_ms / 1000).toFixed(1)}s</span>
                                  {s.language && (
                                    <span className="text-xs text-blue-400 font-mono">{s.language}</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-700 leading-relaxed">{s.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Segments (Groq / Whisper) */}
                      {result.segments && result.segments.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Segments
                          </p>
                          <div className="space-y-1">
                            {result.segments.map((s, i) => (
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

        {/* Footer */}
        <footer className="text-center text-xs text-gray-400 pb-4">
          Google Chirp 2 · Groq Whisper · Meta MMS · Speechmatics · Modulate Velma-2 · Whisper Local
        </footer>
      </div>
    </main>
  );
}
