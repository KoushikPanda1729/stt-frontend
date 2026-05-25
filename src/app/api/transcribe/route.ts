import { NextRequest, NextResponse } from "next/server";
import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

// In production set these in Vercel env vars, e.g. GOOGLE_STT_URL=https://your-service.railway.app
// In development they fall back to localhost
const BACKEND_URLS: Record<string, string> = {
  google:         process.env.GOOGLE_STT_URL       || "http://127.0.0.1:6000",
  groq:           process.env.GROQ_URL             || "http://127.0.0.1:5500",
  "meta-mms":     process.env.META_MMS_URL         || "http://127.0.0.1:9000",
  speechmatics:   process.env.SPEECHMATICS_URL     || "http://127.0.0.1:5600",
  modulate:       process.env.MODULATE_URL         || "http://127.0.0.1:8100",
  "whisper-local":process.env.WHISPER_LOCAL_URL    || "http://127.0.0.1:4000",
};

function postMultipart(
  baseUrl: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  language: string
): Promise<{ data: unknown; status: number }> {
  return new Promise((resolve, reject) => {
    const boundary = `----Boundary${Date.now()}`;

    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="audio"; filename="${fileName}"\r\n` +
        `Content-Type: ${mimeType}\r\n\r\n`
      ),
      fileBuffer,
      Buffer.from(
        `\r\n--${boundary}\r\n` +
        `Content-Disposition: form-data; name="language"\r\n\r\n` +
        `${language}\r\n` +
        `--${boundary}--\r\n`
      ),
    ]);

    const parsed = new URL(`${baseUrl}/transcribe`);
    const isHttps = parsed.protocol === "https:";
    const transport = isHttps ? https : http;

    const req = transport.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname,
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": body.length,
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            resolve({ data: JSON.parse(raw), status: res.statusCode ?? 200 });
          } catch {
            reject(new Error(`Non-JSON response from backend: ${raw.slice(0, 200)}`));
          }
        });
      }
    );

    req.setTimeout(180_000, () => {
      req.destroy(new Error("Backend request timed out"));
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const model = formData.get("model") as string;
    const language = formData.get("language") as string;
    const audioFile = formData.get("audio") as File | null;

    console.log("[transcribe] model=%s | language=%s | file=%s", model, language, audioFile?.name);

    if (!model || !language || !audioFile) {
      return NextResponse.json({ error: "Missing model, language, or audio file" }, { status: 400 });
    }

    const baseUrl = BACKEND_URLS[model];
    console.log("[transcribe] baseUrl=%s", baseUrl);

    if (!baseUrl) {
      return NextResponse.json({ error: `Unknown model: "${model}"` }, { status: 400 });
    }

    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { data, status } = await postMultipart(
      baseUrl,
      buffer,
      audioFile.name,
      audioFile.type || "audio/mpeg",
      language
    );

    return NextResponse.json(data, { status });
  } catch (error) {
    const err = error as Error;
    console.error("[transcribe] ERROR:", err.message);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
