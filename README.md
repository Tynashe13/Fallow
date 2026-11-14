# Fallow

**Field profiles drawn live from open data.**
NASA Space Apps Challenge 2026 · *Field Shift: Adapting Farms with NASA Data*

One block of farmland, rendered as an interactive 3D cut block: real terrain on
top, the soil by depth on the cut faces, a long-term average month in the air
above — and **today's actual weather in the sky over the block** (sun where it
really is, clouds, rain, lightning when a storm is passing). Around the block,
every number on the plate names its source, and where sources disagree, the
plate shows the disagreement instead of hiding it.

Two live plates: **Overberg** and **Swartland**, Western Cape — the lead sites
for the question the tool is built around: *next winter, wheat on wheat again,
or a lupin/canola break crop?*

## Run it

```bash
npm install
npm run dev
# open http://localhost:3000
```

That's it — the app runs fully on keyless open data. No login anywhere.

### Optional keys (`.env.local`)

Copy `.env.example` → `.env.local`. Everything is optional:

| Key | Unlocks |
| --- | --- |
| `GEMINI_API_KEY` | The **rotation analysis drawer** — sends the plate's live data to Google Gemini for a wheat-vs-break-crop read with confidence labels. Free key: [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `ISDA_USERNAME` / `ISDA_PASSWORD` | iSDA Africa 30 m soil map — second opinion next to SoilGrids in the topsoil comparison |
| `METEOMATICS_USERNAME` / `METEOMATICS_PASSWORD` | Fourth independent source in the annual-rain cross-check |
| `OPEN_METEO_API_KEY` | Only if you hit Open-Meteo's free rate limit |

## Data sources (all fetched live, server-side cached)

| What | Source | Notes |
| --- | --- | --- |
| Monthly climate (temp, humidity, rain, evaporation, soil wetness) | **NASA POWER** (MERRA-2) | keyless |
| Annual rain cross-check | NASA POWER · Open-Meteo · ERA5 · Meteomatics | spread shown as computed uncertainty |
| Soil by depth (clay, sand, pH × 6 horizons) | **ISRIC SoilGrids 2.0** (250 m) | modelled, not measured — and labelled so |
| Terrain | **AWS Terrain Tiles** (terrarium) | not a survey; height ×5, stated on the plate |
| Field outlines | **OpenStreetMap** via Overpass | community-mapped, not complete |
| Live sky | **Open-Meteo** → **MET Norway** fallback | drives sun/clouds/rain/storm over the block |
| Sun position & arc | computed astronomy | computed, not a measurement |

## Honesty rules (from the team briefing)

- Model values, not measurements — said on every plate.
- Every number names its source inline; missing keys show **“needs key”**, not silence.
- The AI drawer is labelled **AI-generated · not validated**, and is asked to
  name the data block behind every number it uses and to list what the data
  cannot know.
- No NASA logos. Plain-text event name only.

## AI use disclosure

Built with AI assistance (Claude Code) from live API responses; the analysis
drawer calls Google Gemini at the user's request and labels its output as
AI-generated. No AI-generated imagery is presented as data.

*Not affiliated with or endorsed by NASA.*
