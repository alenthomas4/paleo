import { useState, useEffect } from 'react'

const OTL_BASE = 'https://api.opentreeoflife.org/v3'

export interface OpenTreeState {
  newick: string | null
  loading: boolean
  error: string | null
}

export function useOpenTree(sciNames: string[]): OpenTreeState {
  const [state, setState] = useState<OpenTreeState>({
    newick: null,
    loading: true,
    error: null,
  })

  const key = sciNames.join('|')

  useEffect(() => {
    if (!sciNames.length) return
    setState({ newick: null, loading: true, error: null })
    let cancelled = false

    ;(async () => {
      try {
        // Step 1: resolve scientific names → OTT IDs
        const r1 = await fetch(`${OTL_BASE}/tnrs/match_names`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            names: sciNames,
            include_suppressed: true,
            do_approximate_matching: true,
          }),
        })
        if (!r1.ok) throw new Error(`TNRS request failed: ${r1.status}`)
        const d1 = await r1.json()

        const ottIds: number[] = d1.results
          .map((r: any) => r.matches?.[0]?.taxon?.ott_id)
          .filter((id: any): id is number => typeof id === 'number')

        if (ottIds.length < 2) {
          throw new Error(`Only ${ottIds.length} OTT ID(s) resolved; need at least 2`)
        }

        // Step 2: get induced subtree from synthetic tree
        const r2 = await fetch(`${OTL_BASE}/tree_of_life/induced_subtree`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ott_ids: ottIds, label_format: 'name' }),
        })
        const d2 = await r2.json()
        if (!r2.ok) throw new Error(d2.message || `Subtree request failed: ${r2.status}`)

        if (!cancelled) setState({ newick: d2.newick, loading: false, error: null })
      } catch (e: any) {
        if (!cancelled) setState({ newick: null, loading: false, error: e.message })
      }
    })()

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return state
}
