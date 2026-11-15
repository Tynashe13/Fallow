import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Farm analysis drawer: sends the field's ACTUAL fetched data (climate,
 * soil, rain disagreement, current weather) to Google Gemini and asks
 * for a rotation-focused read. The output is clearly labelled in the
 * UI as AI-generated and NOT validated — per the honesty rules.
 */
/* ── per-IP rate limit (in-memory, per server instance) ─────────── */
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 3600_000;
const MAX_TRACKED_IPS = 1000;
const hits = new Map<string, number[]>();

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** true if this call is allowed; records it when allowed */
function takeRateSlot(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.delete(ip);
  hits.set(ip, recent);
  while (hits.size > MAX_TRACKED_IPS) {
    const oldest = hits.keys().next().value;
    if (oldest === undefined) break;
    hits.delete(oldest);
  }
  return true;
}

/* ── number check: every number in the reply must come from the input ── */
const MAX_UNVERIFIED = 3;
const NUMBER_CHECK_FAIL = "AI analysis unavailable: output failed the number check";
const NUM_RE = /\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g;

function inputNumberSet(text: string): Set<string> {
  const set = new Set<string>();
  for (const tok of text.match(NUM_RE) ?? []) {
    const v = Number(tok.replace(/,/g, ""));
    if (!Number.isFinite(v)) continue;
    // accept the model rounding an input value to 0-3 decimals
    for (let d = 0; d <= 3; d++) set.add(v.toFixed(d));
  }
  return set;
}

function checkNumbers(markdown: string, allowed: Set<string>) {
  const failed: string[] = [];
  let checked = 0;
  for (const tok of markdown.match(NUM_RE) ?? []) {
    checked++;
    const clean = tok.replace(/,/g, "");
    const v = Number(clean);
    const decimals = clean.includes(".") ? clean.split(".")[1].length : 0;
    const whole = decimals === 0 && Number.isInteger(v);
    if (whole && v >= 0 && v <= 10) continue; // list numbering, small counts
    if (whole && v >= 1900 && v <= 2100) continue; // years
    if (decimals <= 3 && allowed.has(v.toFixed(decimals))) continue;
    failed.push(tok);
  }
  return { checked, failed };
}

export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json(
      {
        configured: false,
        error:
          "GEMINI_API_KEY is not set. Copy .env.example to .env.local and add a key from https://aistudio.google.com/apikey",
      },
      { status: 200 }
    );
  }

  if (!takeRateSlot(clientIp(req))) {
    return NextResponse.json(
      { configured: true, error: "Rate limit reached: 10 analyses per hour. Try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body?.location) {
    return NextResponse.json({ error: "missing field data" }, { status: 400 });
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  const prompt = `You are an agronomy analyst inside "Fallow", a NASA Space Apps tool.
A grower in ${body.location.name} (lat ${body.location.lat}, lon ${body.location.lon}) faces ONE decision:
"Next winter, do I plant wheat on wheat again, or put in a lupin or canola break crop?"

Below is the live data the app fetched for this exact field block. Use ONLY this data plus
well-established agronomy principles. Never invent numbers. When you use a number, name
which block of the data it came from (e.g. "NASA POWER June rain"). Where the data cannot
answer something, say plainly "the data here cannot tell us this".

DATA (JSON):
${JSON.stringify(body, null, 1).slice(0, 14000)}

Write concise GitHub-flavoured markdown with EXACTLY these five sections:

## The decision
2-3 sentences framing wheat-on-wheat vs break crop for THIS field, grounded in the data.

## What the data says
A short bullet list: the 4-6 numbers that matter most for the decision, each with its source
named inline and what it implies.

## Rotation comparison
A small markdown table: rows = "Wheat on wheat", "Canola break", "Lupin break";
columns = "Disease & weed pressure", "Water fit (from rain/soil data)", "Soil fit (from texture/pH)", "Confidence".
Confidence must be High/Medium/Low based on how directly the fetched data supports the cell.

## Risk & uncertainty
Bullets. Include: where the rain sources disagree (use the spread number if present) and what
that disagreement means for trusting a planting decision; soil map vs field reality (modelled
250 m data); any season risk visible in the monthly curves.

## What this analysis cannot know
3-4 honest bullets (prices, yields, the grower's actual paddock history, pests this season, etc.)

Keep it under 450 words. No preamble before the first heading.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.35, maxOutputTokens: 1400 },
        }),
        cache: "no-store",
      }
    );
    const json = await res.json();
    if (!res.ok) {
      const msg = json?.error?.message ?? `Gemini ${res.status}`;
      return NextResponse.json({ configured: true, error: msg }, { status: 200 });
    }
    const text: string | undefined =
      json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("");
    if (!text) {
      return NextResponse.json(
        { configured: true, error: "Gemini returned no text (safety block?)" },
        { status: 200 }
      );
    }
    // numbers are checked against the prompt (which carries the payload
    // the model actually saw, after the 14k-char slice)
    const check = checkNumbers(text, inputNumberSet(prompt));
    if (check.failed.length > MAX_UNVERIFIED) {
      return NextResponse.json(
        { configured: true, model, error: NUMBER_CHECK_FAIL, numberCheck: check },
        { status: 200 }
      );
    }
    const markdown = check.failed.length
      ? `${text}\n\n---\n\n_Number check: ${check.failed.join(", ")} not found in the fetched data — treat as unverified._`
      : text;
    return NextResponse.json({ configured: true, model, markdown, numberCheck: check });
  } catch (e) {
    return NextResponse.json(
      { configured: true, error: `Gemini unreachable: ${(e as Error).message}` },
      { status: 200 }
    );
  }
}
