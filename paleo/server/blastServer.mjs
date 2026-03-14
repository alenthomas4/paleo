import { createServer } from 'node:http';

const PORT = Number(process.env.PORT ?? 8787);
const BLAST_BASE_URL = 'https://blast.ncbi.nlm.nih.gov/Blast.cgi';

// Mitochondrial genome accessions
const SPECIES_ACCESSIONS = {
  // Woolly Mammoth
  'woolly mammoth':       'OR077933.1',
  'mammuthus primigenius':'OR077933.1',

  // Asian Elephant
  'asian elephant':       'AJ428946.1',
  'elephas maximus':      'AJ428946.1',

  // African Forest Elephant 
  'african forest elephant': 'NC_020759.1',
  'loxodonta cyclotis':      'NC_020759.1',

  // Newfoundland Wolf
  'newfoundland wolf':         'GQ849370.1',
  'canis lupus labradorius':   'GQ849370.1',
  'canis lupus beothucus':     'GQ849370.1',

  // Greenland Wolf
  'greenland wolf':    'MK948871.1',
  'canis lupus orion': 'MK948871.1',

  // Grey Wolf
  'grey wolf':  'HG998573.1',
  'canis lupus':'HG998573.1',

  // Dodo
  'dodo':              'NC_031864.1',
  'raphus cucullatus': 'NC_031864.1',

  // New Zealand Pigeon
  'new zealand pigeon':          'NC_013244.1',
  'hemiphaga novaeseelandiae':   'NC_013244.1',

  // Nicobar Pigeon
  'nicobar pigeon':    'MG590264.1',
  'caloenas nicobarica':'MG590264.1',

  // Labrador Duck
  'labrador duck':                 'DQ831207.1',
  'camptorhynchus labradorius':    'DQ831207.1',

  // Steller\'s Eider
  "steller's eider":   'MW849289.1',
  'polysticta stelleri':'MW849289.1',

  // Mallard
  'mallard':            'OR242800.1',
  'anas platyrhynchos': 'OR242800.1',
};

const resolveAccession = (input) => {
  // ai assisted with this process and regex ( due to time complications)
  // If it already looks like an accession (e.g. NC_007596.2), use it directly
  if (/^[A-Z]{1,2}_?\d+(\.\d+)?$/.test(input.trim())) {
    return input.trim();
  }
  const accession = SPECIES_ACCESSIONS[input.trim().toLowerCase()];
  if (!accession) {
    throw new Error(
      `Unknown species "${input}". Provide an NCBI accession directly, or use one of: ${Object.keys(SPECIES_ACCESSIONS).join(', ')}`,
    );
  }
  return accession;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseRidAndRtoe = (responseText) => {
  const ridMatch = responseText.match(/RID = ([^\n\r]+)/);
  const rtoeMatch = responseText.match(/RTOE = (\d+)/);

  return {
    rid: ridMatch?.[1]?.trim(),
    rtoe: rtoeMatch ? Number(rtoeMatch[1]) : 15,
  };
};

const parseSearchInfo = (responseText) => {
  const statusMatch = responseText.match(/Status=([^\n\r]+)/);
  const hitsMatch = responseText.match(/ThereAreHits=([^\n\r]+)/);

  return {
    status: statusMatch?.[1]?.trim() ?? 'UNKNOWN',
    thereAreHits: hitsMatch?.[1]?.trim() === 'yes',
  };
};

const buildBlastUrl = (params) => {
  const searchParams = new URLSearchParams(params);
  return `${BLAST_BASE_URL}?${searchParams.toString()}`;
};

const submitBlast = async ({ queryAccession }) => {
  const submitUrl = buildBlastUrl({
    CMD: 'Put',
    PROGRAM: 'blastn',
    DATABASE: 'nt',
    QUERY: queryAccession,
    HITLIST_SIZE: '10',
  });

  console.log(`[blast] submitting query=${queryAccession}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  let responseText;
  try {
    const response = await fetch(submitUrl, { signal: controller.signal });
    if (!response.ok) throw new Error(`BLAST submission failed with ${response.status}`);
    responseText = await response.text();
  } finally {
    clearTimeout(timeout);
  }

  console.log('[blast] response snippet:', responseText.slice(0, 300));
  const { rid, rtoe } = parseRidAndRtoe(responseText);
  if (!rid) throw new Error('BLAST submission did not return an RID.');

  console.log(`[blast] RID=${rid} RTOE=${rtoe}s`);
  return { rid, rtoe };
};

const waitForBlastReady = async (rid, initialWaitSeconds) => {
  const initialWaitMs = Math.max(5, initialWaitSeconds) * 1000;
  await sleep(initialWaitMs);

  const maxPollAttempts = 24;

  for (let attempt = 0; attempt < maxPollAttempts; attempt += 1) {
    const infoUrl = buildBlastUrl({
      CMD: 'Get',
      RID: rid,
      FORMAT_OBJECT: 'SearchInfo',
    });

    const response = await fetch(infoUrl);
    if (!response.ok) {
      throw new Error(`BLAST status check failed with ${response.status}`);
    }

    const text = await response.text();
    const { status, thereAreHits } = parseSearchInfo(text);
    console.log(`[blast] poll attempt=${attempt + 1} status=${status}`);

    if (status === 'READY') {
      if (!thereAreHits) {
        throw new Error('BLAST finished but no hits were found.');
      }
      return;
    }

    if (status === 'FAILED') {
      throw new Error('BLAST failed during processing.');
    }

    if (status === 'UNKNOWN') {
      throw new Error('BLAST returned UNKNOWN status for this RID.');
    }

    await sleep(5000);
  }

  throw new Error('BLAST polling timed out before completion.');
};

const fetchBlastResult = async (rid) => {
  const resultUrl = buildBlastUrl({
    CMD: 'Get',
    RID: rid,
    FORMAT_TYPE: 'Text',
    ALIGNMENT_VIEW: 'Pairwise',
  });

  const response = await fetch(resultUrl);
  if (!response.ok) {
    throw new Error(`BLAST result fetch failed with ${response.status}`);
  }

  return response.text();
};

// ── Habitat overlap helpers ────────────────────────────────────────────────

const fetchGbifKey = async (speciesName) => {
  const url = `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(speciesName)}&kingdom=Animalia`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GBIF species match failed with ${res.status}`);
  const data = await res.json();
  return data.usageKey ?? null;
};

const fetchGbifOccurrences = async (gbifKey) => {
  const url = `https://api.gbif.org/v1/occurrence/search?speciesKey=${gbifKey}&limit=300&hasCoordinate=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GBIF occurrence search failed with ${res.status}`);
  const data = await res.json();
  return (data.results ?? [])
    .filter(r => r.decimalLatitude != null && r.decimalLongitude != null)
    .map(r => ({ lat: r.decimalLatitude, lng: r.decimalLongitude }));
};

const fetchNeotomaOccurrences = async (taxonName) => {
  const url = `https://api.neotomadb.org/v2.0/data/occurrences?taxonname=${encodeURIComponent(taxonName)}&limit=500`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Neotoma occurrences failed with ${res.status}`);
  const data = await res.json();

  // Neotoma v2.0 returns data as an array of occurrence objects
  const items = Array.isArray(data.data) ? data.data
    : Array.isArray(data.data?.occurrences) ? data.data.occurrences
    : [];

  const points = [];
  for (const item of items) {
    const occ = item.occurrence ?? item;
    // GeoJSON coordinates: [lng, lat]
    const coords = occ.site?.geography?.coordinates;
    if (Array.isArray(coords) && coords.length >= 2) {
      points.push({ lat: coords[1], lng: coords[0] });
      continue;
    }
    // Direct lat/lng fields
    if (occ.lat != null && occ.lng != null) {
      points.push({ lat: Number(occ.lat), lng: Number(occ.lng) });
    }
  }
  return points;
};

const computeBbox = (points) => {
  if (!points.length) return null;
  return {
    minLat: Math.min(...points.map(p => p.lat)),
    maxLat: Math.max(...points.map(p => p.lat)),
    minLng: Math.min(...points.map(p => p.lng)),
    maxLng: Math.max(...points.map(p => p.lng)),
  };
};

const habitatOverlapScore = (candidatePoints, extinctBbox) => {
  if (!candidatePoints.length || !extinctBbox) return 0;
  const inside = candidatePoints.filter(pt =>
    pt.lat >= extinctBbox.minLat &&
    pt.lat <= extinctBbox.maxLat &&
    pt.lng >= extinctBbox.minLng &&
    pt.lng <= extinctBbox.maxLng
  );
  return Math.round((inside.length / candidatePoints.length) * 100);
};

// ──────────────────────────────────────────────────────────────────────────

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
};

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Request body too large.'));
      }
    });

    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON body.'));
      }
    });

    req.on('error', reject);
  });

const server = createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 400, { error: 'Missing request URL.' });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  // List all known species
  if (req.method === 'GET' && url.pathname === '/api/species') {
    sendJson(res, 200, { species: SPECIES_ACCESSIONS });
    return;
  }

  // Run BLAST by raw accession numbers
  if (req.method === 'POST' && url.pathname === '/api/blast/run') {
    try {
      const body = await readJsonBody(req);
      const queryAccession = body.queryAccession ?? 'NC_007596.2';
      const subjectAccession = body.subjectAccession ?? 'NC_000934.1';

      const { rid, rtoe } = await submitBlast({ queryAccession });
      await waitForBlastReady(rid, rtoe);
      const reportText = await fetchBlastResult(rid);

      sendJson(res, 200, { rid, queryAccession, subjectAccession, reportText });
      return;
    } catch (error) {
      sendJson(res, 500, { error: error instanceof Error ? error.message : 'Unknown BLAST error.' });
      return;
    }
  }

  // Run BLAST by species name or accession
  if (req.method === 'POST' && url.pathname === '/api/blast/compare') {
    try {
      const body = await readJsonBody(req);
      const { querySpecies, subjectSpecies } = body;

      if (!querySpecies || !subjectSpecies) {
        sendJson(res, 400, { error: 'querySpecies and subjectSpecies are required.' });
        return;
      }

      const queryAccession = resolveAccession(querySpecies);
      const subjectAccession = resolveAccession(subjectSpecies);

      const { rid, rtoe } = await submitBlast({ queryAccession });
      await waitForBlastReady(rid, rtoe);
      const reportText = await fetchBlastResult(rid);

      sendJson(res, 200, {
        rid,
        querySpecies,
        subjectSpecies,
        queryAccession,
        subjectAccession,
        reportText,
      });
      return;
    } catch (error) {
      sendJson(res, 500, { error: error instanceof Error ? error.message : 'Unknown error.' });
      return;
    }
  }

  // Compute live habitat overlap via GBIF + Neotoma
  if (req.method === 'POST' && url.pathname === '/api/habitat/overlap') {
    try {
      const body = await readJsonBody(req);
      const { extinctSci, candidateSci } = body;

      if (!extinctSci || !candidateSci) {
        sendJson(res, 400, { error: 'extinctSci and candidateSci are required.' });
        return;
      }

      console.log(`[habitat] looking up GBIF key for: ${candidateSci}`);
      const gbifKey = await fetchGbifKey(candidateSci);
      if (!gbifKey) {
        sendJson(res, 400, { error: `No GBIF match found for "${candidateSci}".` });
        return;
      }
      console.log(`[habitat] GBIF usageKey=${gbifKey}`);

      const [candidatePoints, extinctPoints] = await Promise.all([
        fetchGbifOccurrences(gbifKey),
        fetchNeotomaOccurrences(extinctSci),
      ]);

      console.log(`[habitat] candidate=${candidatePoints.length} pts, extinct=${extinctPoints.length} pts`);

      const extinctBbox = computeBbox(extinctPoints);
      const overlapCount = extinctBbox
        ? candidatePoints.filter(pt =>
            pt.lat >= extinctBbox.minLat && pt.lat <= extinctBbox.maxLat &&
            pt.lng >= extinctBbox.minLng && pt.lng <= extinctBbox.maxLng
          ).length
        : 0;
      const score = habitatOverlapScore(candidatePoints, extinctBbox);
      console.log(`[habitat] overlap=${overlapCount}/${candidatePoints.length} → score=${score}`);

      sendJson(res, 200, {
        score,
        candidateCount: candidatePoints.length,
        extinctCount: extinctPoints.length,
        extinctBbox,
        overlapCount,
      });
      return;
    } catch (error) {
      sendJson(res, 500, { error: error instanceof Error ? error.message : 'Unknown habitat error.' });
      return;
    }
  }

  sendJson(res, 404, { error: 'Not found.' });
});

server.on('error', (error) => {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} is already in use. Stop the existing process or run with a different port: PORT=8788 node server/blastServer.mjs`,
    );
    process.exit(1);
  }

  console.error(error);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`BLAST backend listening on http://localhost:${PORT}`);
});
