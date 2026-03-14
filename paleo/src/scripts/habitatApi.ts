export interface HabitatOverlapResponse {
  score: number
  candidateCount: number
  extinctCount: number
  extinctBbox: { minLat: number; maxLat: number; minLng: number; maxLng: number } | null
  overlapCount: number
}

export async function fetchHabitatOverlap(
  extinctSci: string,
  candidateSci: string,
): Promise<HabitatOverlapResponse> {
  const res = await fetch('/api/habitat/overlap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ extinctSci, candidateSci }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error ?? `Habitat overlap request failed with ${res.status}`);
  }

  return res.json() as Promise<HabitatOverlapResponse>;
}
