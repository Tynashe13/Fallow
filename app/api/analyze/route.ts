import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Farm analysis drawer: sends the field's ACTUAL fetched data (climate,
 * soil, rain disagreement, current weather) to Google Gemini and asks
 * for a rotation-focused read. The output is clearly labelled in the
 * UI as AI-generated and NOT validated — per the honesty rules.
 */
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
    return NextResponse.json({ configured: true, model, markdown: text });
  } catch (e) {
    return NextResponse.json(
      { configured: true, error: `Gemini unreachable: ${(e as Error).message}` },
      { status: 200 }
    );
  }
}
