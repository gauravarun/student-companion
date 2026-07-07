import { NextRequest, NextResponse } from "next/server";
import { getRelevantProcesses, UserProfile } from "@/lib/knowledge";
import { SYSTEM_PROMPT, buildMessages, HistoryMessage } from "@/lib/prompt";
import { checkRateLimit } from "@/lib/rateLimit";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const MAX_HISTORY = 10;

interface AskRequest {
  profile: UserProfile;
  question: string;
  history?: HistoryMessage[];
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server configuration error: missing API key." },
      { status: 500 }
    );
  }

  const { allowed, retryAfterSeconds } = checkRateLimit(getClientIp(req));
  if (!allowed) {
    const wait = retryAfterSeconds
      ? ` Please wait ${retryAfterSeconds}s and try again.`
      : " Please wait a moment and try again.";
    return NextResponse.json(
      { error: `Too many requests.${wait}` },
      {
        status: 429,
        headers: retryAfterSeconds
          ? { "Retry-After": String(retryAfterSeconds) }
          : undefined,
      }
    );
  }

  let body: AskRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { profile, question } = body;
  if (!profile?.residency_status || profile?.is_student === undefined) {
    return NextResponse.json({ error: "Invalid profile." }, { status: 400 });
  }

  const history: HistoryMessage[] = Array.isArray(body.history)
    ? body.history
        .filter(
          (m): m is HistoryMessage =>
            (m?.role === "user" || m?.role === "assistant") &&
            typeof m?.text === "string"
        )
        .slice(-MAX_HISTORY)
    : [];

  const processes = getRelevantProcesses(profile);
  if (processes.length === 0) {
    return NextResponse.json({
      answer:
        "I don't have verified information for that profile. Please check berlin.de for up-to-date official guidance.\n\nThis is general guidance, not legal or immigration advice.",
      sources: [],
    });
  }

  const messages = buildMessages(profile, processes, question, history);
  const payload = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: messages,
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
  };

  let geminiRes: Response;
  try {
    geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Gemini fetch error:", err);
    return NextResponse.json(
      { error: "Failed to reach the AI service. Please try again." },
      { status: 502 }
    );
  }

  if (geminiRes.status === 429) {
    return NextResponse.json(
      {
        error:
          "The AI service is rate-limited. Please wait a moment and try again.",
      },
      { status: 429 }
    );
  }

  if (!geminiRes.ok) {
    const errText = await geminiRes.text().catch(() => "");
    console.error("Gemini error response:", geminiRes.status, errText);
    return NextResponse.json(
      { error: "AI service error. Please try again later." },
      { status: 502 }
    );
  }

  const data = await geminiRes.json();
  const candidate = data?.candidates?.[0];
  if (candidate?.finishReason && candidate.finishReason !== "STOP") {
    console.warn("[SCB] Gemini finish reason:", candidate.finishReason);
  }
  let answer: string =
    candidate?.content?.parts?.[0]?.text ??
    "No answer was returned. Please try again.";

  // Strip the [SOURCES: ...] marker and return only sources actually used.
  // If the model omits the marker, fall back to all sources rather than none.
  let usedIds: string[] | null = null;
  const markerMatch = answer.match(/\[SOURCES:\s*([^\]]*)\]\s*$/i);
  if (markerMatch) {
    answer = answer.slice(0, markerMatch.index).trimEnd();
    const list = markerMatch[1].trim().toLowerCase();
    usedIds =
      list === "none"
        ? []
        : list.split(",").map((s) => s.trim()).filter(Boolean);
  }

  const usedProcesses =
    usedIds === null
      ? processes
      : processes.filter((p) => usedIds.includes(p.id));
  const allSources = usedProcesses.flatMap((p) => p.official_sources);
  const uniqueSources = allSources.filter(
    (s, i, arr) => arr.findIndex((x) => x.url === s.url) === i
  );

  // Oldest last_verified among used entries: everything shown was
  // verified at least as of this date. ISO dates sort lexicographically.
  const verified = usedProcesses.length
    ? usedProcesses.map((p) => p.last_verified).sort()[0]
    : null;

  return NextResponse.json({ answer, sources: uniqueSources, verified });
}
