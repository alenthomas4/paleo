# Paleo — De-extinction Candidate Explorer

An interactive tool for exploring and scoring de-extinction candidates, built with React, TypeScript, Vite, and a Node.js BLAST backend.

---

## Setup & Running

### Prerequisites

- Node.js 18+
- npm

### Install dependencies

```bash
npm install
```

### Run (frontend only)

```bash
npm run dev
```

Starts the Vite dev server at `http://localhost:5173`.

### Run (frontend + API server)

```bash
npm run dev:full
```

This starts both the Vite frontend and the BLAST/habitat API backend concurrently.

Alternatively, run them in separate terminals:

```bash
# Terminal 1 — API server (port 8787 by default)
npm run dev:api

# Terminal 2 — Frontend
npm run dev
```

To use a different port for the API:

```bash
PORT=8788 node server/blastServer.mjs
```

### Build for production

```bash
npm run build
```

Output goes to `dist/`. Serve with:

```bash
npm run preview
```

---

## API Server (`server/blastServer.mjs`)

A lightweight Node.js HTTP server (no framework) that proxies requests to NCBI BLAST and GBIF.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/species` | List all known species and their NCBI accessions |
| `POST` | `/api/blast/run` | Run BLAST with raw accession numbers |
| `POST` | `/api/blast/compare` | Run BLAST by species name |
| `POST` | `/api/habitat/overlap` | Compute habitat overlap via GBIF + Neotoma |

#### `POST /api/blast/compare`

```json
{
  "querySpecies": "woolly mammoth",
  "subjectSpecies": "asian elephant"
}
```

Accepts common names or scientific names (see species list below). Returns the full BLAST report text.

#### `POST /api/habitat/overlap`

```json
{
  "extinctSci": "Mammuthus primigenius",
  "candidateSci": "Elephas maximus"
}
```

Returns overlap score (0–100), point counts, and the bounding box of the extinct species' fossil record.

---

## How Scores Are Calculated

Each extinction/revival candidate pairing is evaluated across four metrics. Together they indicate how feasible a de-extinction attempt would be — genetically and ecologically.

### 1. Genomic Similarity Score

**What it measures:** The percentage of identical base pairs when the two species' mitochondrial genomes are aligned.

**How it's computed:**
1. Both genomes are submitted to NCBI BLAST (`megablast`, `blastn` program, `nt` database).
2. The BLAST job is polled until complete (initial wait from the `RTOE` field, then 5-second poll intervals, up to 24 attempts).
3. The identity percentage is extracted from the pairwise alignment report.

**Accessions used** (full list in `server/blastServer.mjs`):

| Species | Accession |
|---------|-----------|
| Woolly Mammoth | OR077933.1 |
| Asian Elephant | AJ428946.1 |
| African Forest Elephant | NC_020759.1 |
| Newfoundland Wolf | GQ849370.1 |
| Greenland Wolf | MK948871.1 |
| Grey Wolf | HG998573.1 |
| Dodo | NC_031864.1 |
| Nicobar Pigeon | MG590264.1 |
| New Zealand Pigeon | NC_013244.1 |
| Labrador Duck | DQ831207.1 |
| Steller's Eider | MW849289.1 |
| Mallard | OR242800.1 |

**Interpretation:** Higher is better. 99% means roughly 1 in every 100 base pairs differs. 60% indicates a deep split (~12 Mya) requiring extensive genomic editing.

---

### 2. Habitat Overlap Score (0–100)

**What it measures:** The geographic overlap between where the candidate species lives today and where the extinct species historically ranged.

**How it's computed:**
1. The candidate species' current occurrence points are fetched from **GBIF** (`/v1/occurrence/search`, up to 300 georeferenced records).
2. The extinct species' fossil occurrence points are fetched from the **Neotoma Paleoecology Database** (`/v2.0/data/occurrences`, up to 500 records).
3. A bounding box is computed from the extinct species' fossil points (`minLat`, `maxLat`, `minLng`, `maxLng`).
4. The score is: `(candidate points inside the bounding box / total candidate points) × 100`, rounded to the nearest integer.

**Interpretation:** A score of 88 means 88% of the candidate's current occurrence records fall within the bounding box of the extinct species' known fossil range. Geographic co-occurrence does not imply ecological match — habitat type matters too.

---

### 3. Climate Match Score (0–100)

**What it measures:** The overlap between the temperature and precipitation conditions of each species' natural range.

**How it's computed:**
1. Climate envelopes (mean annual temperature range and annual precipitation range) are defined for each species using **WorldClim v2.1** gridded data and published paleoclimate reconstructions (e.g., Kahlke 2014 for woolly mammoth).
2. The overlap percentage is computed independently for temperature and precipitation.
3. The two overlap values are averaged to produce the final score.
4. In some pairings, the raw formula result is adjusted based on empirical evidence (e.g., documented grey wolf presence in Labrador climates that are identical to Newfoundland).

**Interpretation:** A score of 5 indicates the climate envelopes do not meaningfully overlap. A score of 88 indicates the two species experience nearly the same thermal and precipitation conditions in their respective ranges.

---

### 4. Trophic Presence Score (0–100)

**What it measures:** How intact the food web and ecosystem conditions are in the extinct species' historic range for supporting a reintroduction.

**How it's computed:** Four sub-factors are averaged, then adjusted based on expert context:

| Sub-factor | Description |
|------------|-------------|
| **Plant / prey availability** | Abundance of food resources the extinct species depended on |
| **Predator pressure** | Presence of top predators indicating a functioning ecosystem |
| **Native vegetation cover** | Percentage of native habitat remaining |
| **Competitor occupancy (inverted)** | Lower score if competing species already saturate the niche |

The raw average is then adjusted up or down based on active conservation efforts, known ecological analogues, or fundamental mismatches (e.g., a dabbling duck chassis trying to fill a deep-diving sea duck niche).

**Interpretation:** A score of 68 means the ecosystem retains reasonable structure for reintroduction but faces challenges. A score of 40 or below indicates the ecological path requires rebuilding most of the functional niche from scratch.

---

## Species Pairings

| Extinct Species | Candidate | Genomic % | Key Challenge |
|----------------|-----------|-----------|---------------|
| Woolly Mammoth | Asian Elephant | 99% | Cold-adaptation gene suite; Arctic habitat prep |
| Woolly Mammoth | African Forest Elephant | 96% | Forest obligate ecology; body mass mismatch |
| Newfoundland Wolf | Greenland Wolf | 99% | Prey base differs (musk ox vs caribou/moose) |
| Newfoundland Wolf | Grey Wolf | 99% | Coyote mesopredator occupancy in target range |
| Dodo | Nicobar Pigeon | 82% | Mauritius habitat severely degraded; body size 17× difference |
| Dodo | NZ Pigeon | 73% | Temperate vs tropical climate gap |
| Labrador Duck | Steller's Eider | 76% | Pacific distribution; Atlantic translocation needed |
| Labrador Duck | Mallard | 60% | Deepest genomic split; mallard occupies its own niche |

---

## Data Sources

- **NCBI BLAST** — `blast.ncbi.nlm.nih.gov`
- **GBIF** — `gbif.org` (candidate species occurrence records)
- **Neotoma Paleoecology Database** — `neotomadb.org` (extinct species fossil records)
- **WorldClim v2.1** — `worldclim.org` (climate envelope data)
- **IUCN Red List** — species ecological profiles
- **Kahlke 2014** — *Quaternary International* (mammoth paleoclimate)

---

## Project Structure

```
paleo/
├── src/
│   ├── components/
│   │   ├── layout/       # Navbar
│   │   └── ui/           # PhyloTree and other UI components
│   ├── data/
│   │   ├── candidates.json   # Per-species scoring data and metadata
│   │   └── modalText.json    # Detailed methodology text shown in modals
│   ├── hooks/            # Custom React hooks
│   ├── pages/
│   │   └── Explorer.tsx  # Main explorer page
│   ├── types.ts
│   ├── App.tsx
│   └── main.tsx
├── server/
│   └── blastServer.mjs   # BLAST + GBIF API proxy server
├── public/
└── vite.config.ts
```