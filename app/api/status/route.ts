import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Which optional keys are configured — the UI uses this to show
 *  honest "needs key" states instead of silent gaps. Never returns
 *  the values themselves. */
export async function GET() {
  return NextResponse.json({
    gemini: Boolean(process.env.GEMINI_API_KEY),
    isda: Boolean(process.env.ISDA_USERNAME && process.env.ISDA_PASSWORD),
    meteomatics: Boolean(
      process.env.METEOMATICS_USERNAME && process.env.METEOMATICS_PASSWORD
    ),
    openMeteoKey: Boolean(process.env.OPEN_METEO_API_KEY),
  });
}
