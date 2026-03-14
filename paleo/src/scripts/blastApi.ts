export type BlastRunRequest = {
  queryAccession?: string;
  subjectAccession?: string;
};

export type BlastRunResponse = {
  rid: string;
  queryAccession: string;
  subjectAccession: string;
  reportText: string;
};

export type BlastCompareRequest = {
  querySpecies: string;
  subjectSpecies: string;
};

export type BlastCompareResponse = {
  rid: string;
  querySpecies: string;
  subjectSpecies: string;
  queryAccession: string;
  subjectAccession: string;
  reportText: string;
};

export const runBlast = async (request: BlastRunRequest = {}): Promise<BlastRunResponse> => {
  const response = await fetch('/api/blast/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      queryAccession: request.queryAccession ?? 'NC_007596.2',
      subjectAccession: request.subjectAccession ?? 'NC_000934.1',
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `BLAST request failed with ${response.status}`);
  }

  return (await response.json()) as BlastRunResponse;
};

export const compareSpecies = async (
  request: BlastCompareRequest,
): Promise<BlastCompareResponse> => {
  const response = await fetch('/api/blast/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Compare request failed with ${response.status}`);
  }

  return (await response.json()) as BlastCompareResponse;
};
