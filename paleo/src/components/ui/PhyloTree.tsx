import { useMemo } from 'react'
import type { ExtinctSpecies, Candidate } from '../../types'
import { useOpenTree } from '../../hooks/useOpenTree'

// ── Tiny Newick parser ────────────────────────────────────────────────────────
interface TNode { name: string; len: number; children: TNode[] }

function parseNewick(s: string): TNode {
  s = s.trim().replace(/;$/, '')
  let p = 0
  const readName = () => {
    let n = ''
    while (p < s.length && !',:()'.includes(s[p])) n += s[p++]
    return n.trim()
  }
  const readLen = () => {
    if (s[p] !== ':') return 0
    p++
    let l = ''
    while (p < s.length && !',:()'.includes(s[p])) l += s[p++]
    return parseFloat(l) || 0
  }
  function node(): TNode {
    const n: TNode = { name: '', len: 0, children: [] }
    if (s[p] === '(') {
      p++
      n.children.push(node())
      while (s[p] === ',') { p++; n.children.push(node()) }
      p++ // ')'
    }
    n.name = readName()
    n.len = readLen()
    return n
  }
  return node()
}

// In a 3-tip rooted tree, the outgroup is the direct-child tip of the root.
function outgroupTipName(root: TNode): string | null {
  for (const child of root.children) {
    if (child.children.length === 0) return child.name
  }
  return null
}

// Fuzzy match: does OTT tip label correspond to a scientific name?
// OTT labels look like "Elephas_maximus"; sciName is "Elephas maximus".
function matchSci(tipLabel: string, sciName: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '')
  const tip = norm(tipLabel)
  // Compare genus+species (first two words)
  const gs = norm(sciName.split(/\s+/).slice(0, 2).join(''))
  const n = Math.min(10, gs.length, tip.length)
  return tip.slice(0, n) === gs.slice(0, n)
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseMya(t: string): number {
  const m = t.match(/[\d.]+/)
  return m ? parseFloat(m[0]) : 10
}

// ── Component ─────────────────────────────────────────────────────────────────
interface PhyloTreeProps {
  extinct: ExtinctSpecies
  candA: Candidate
  candB?: Candidate
}

// 3-tip topology enum
type Topo =
  | 'AB_sister'  // (extinct, (A, B))  — extinct is outgroup
  | 'EA_sister'  // (B, (extinct, A))  — A and extinct are sisters; B is outgroup
  | 'EB_sister'  // (A, (extinct, B))  — B and extinct are sisters; A is outgroup

export default function PhyloTree({ extinct, candA, candB }: PhyloTreeProps) {
  // ── API fetch ──────────────────────────────────────────────────────────────
  const names = useMemo(
    () => [extinct.sci, candA.sci, ...(candB ? [candB.sci] : [])],
    [extinct.sci, candA.sci, candB],
  )
  const { newick, loading, error } = useOpenTree(names)

  // ── Topology detection (3-tip only) ────────────────────────────────────────
  const topo: Topo = useMemo(() => {
    if (!newick || !candB) return 'AB_sister'
    try {
      const root = parseNewick(newick)
      const og = outgroupTipName(root)
      if (!og) return 'AB_sister'
      if (matchSci(og, extinct.sci)) return 'AB_sister'
      if (matchSci(og, candA.sci))   return 'EB_sister'
      if (matchSci(og, candB.sci))   return 'EA_sister'
    } catch { /* ignore malformed newick */ }
    return 'AB_sister'
  }, [newick, extinct.sci, candA.sci, candB])

  // ── Layout constants ───────────────────────────────────────────────────────
  const myaA = parseMya(candA.divTime)
  const myaB = candB ? parseMya(candB.divTime) : 0
  const maxMya = Math.max(myaA, myaB) * 1.3 || 1

  const W = 580
  const margin = { left: 20, right: 140 }
  const timelineW = W - margin.left - margin.right
  const tipX = margin.left + timelineW
  const toX = (mya: number) => margin.left + timelineW * (1 - mya / maxMya)

  const G = {
    grid:    'rgba(255,255,255,0.04)',
    stem:    'rgba(255,255,255,0.25)',
    extinct: '#6b7280',
    A:       '#4fb86b',
    B:       '#60a5fa',
    dim:     '#4d7557',
  }

  // Shared axis labels
  const axisLabels = (H: number) => (
    <>
      <text x={margin.left} y={H - 4} fontSize={9} fill={G.dim} letterSpacing="0.08em">OLDER</text>
      <text x={tipX - 36}  y={H - 4} fontSize={9} fill={G.dim} letterSpacing="0.08em">PRESENT</text>
    </>
  )

  // OTL attribution badge
  const badge = (y: number) => {
    if (loading) return (
      <text x={margin.left} y={y} fontSize={8} fill="rgba(255,255,255,0.25)" letterSpacing="0.05em">
        fetching topology…
      </text>
    )
    if (!error) return (
      <g>
        <rect x={margin.left} y={y - 10} width={96} height={13} rx={3} fill="rgba(255,255,255,0.06)" />
        <text x={margin.left + 4} y={y} fontSize={8} fill="rgba(99,211,130,0.65)" letterSpacing="0.05em">
          ✓ Open Tree of Life
        </text>
      </g>
    )
    return null
  }

  // Grid lines
  const gridLines = (H: number) => (
    <>{[0.25, 0.5, 0.75, 1].map(f => (
      <line key={f}
        x1={margin.left + timelineW * f} y1={10}
        x2={margin.left + timelineW * f} y2={H - 20}
        stroke={G.grid} strokeWidth={1}
      />
    ))}</>
  )

  // ── 2-tip render ───────────────────────────────────────────────────────────
  if (!candB) {
    const H = 140
    const yE = 34, yA = 96
    const xSplit = toX(myaA)
    const stemL = Math.min(xSplit - 30, margin.left + 10)
    const yMid = (yE + yA) / 2

    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
        {gridLines(H)}

        {/* stem → root split → two branches */}
        <line x1={stemL}  y1={yMid} x2={xSplit} y2={yMid} stroke={G.stem}    strokeWidth={1.5} />
        <line x1={xSplit} y1={yE}   x2={xSplit} y2={yA}   stroke={G.stem}    strokeWidth={1.5} />
        <line x1={xSplit} y1={yE}   x2={tipX}   y2={yE}   stroke={G.extinct} strokeWidth={1.5} strokeDasharray="5 3" />
        <line x1={xSplit} y1={yA}   x2={tipX}   y2={yA}   stroke={G.A}       strokeWidth={1.5} />

        {/* nodes */}
        <circle cx={xSplit} cy={yE} r={3} fill={G.stem} />
        <circle cx={xSplit} cy={yA} r={3} fill={G.stem} />
        <circle cx={tipX}   cy={yE} r={4} fill={G.extinct} />
        <circle cx={tipX}   cy={yA} r={4} fill={G.A} />

        {/* labels */}
        <text x={tipX + 8} y={yE + 4} fontSize={11} fill={G.extinct} fontStyle="italic">†{extinct.name}</text>
        <text x={tipX + 8} y={yA - 5} fontSize={11} fill={G.A}       fontStyle="italic">{candA.name}</text>
        <text x={tipX + 8} y={yA + 8} fontSize={9}  fill={G.dim}>{candA.divTime} divergence</text>

        {axisLabels(H)}
        {badge(20)}
      </svg>
    )
  }

  // ── 3-tip render ───────────────────────────────────────────────────────────
  const H = 200
  // Fixed vertical positions for our three taxa
  const yE = 44, yA = 112, yB = 168

  // Shared tip circles + labels for 3-tip trees
  const tipLabels = () => (
    <>
      <circle cx={tipX} cy={yE} r={4} fill={G.extinct} />
      <text x={tipX + 8} y={yE + 4} fontSize={11} fill={G.extinct} fontStyle="italic">†{extinct.name}</text>

      <circle cx={tipX} cy={yA} r={4} fill={G.A} />
      <text x={tipX + 8} y={yA - 5} fontSize={11} fill={G.A} fontStyle="italic">{candA.name}</text>
      <text x={tipX + 8} y={yA + 8} fontSize={9}  fill={G.dim}>{candA.divTime} divergence</text>

      <circle cx={tipX} cy={yB} r={4} fill={G.B} />
      <text x={tipX + 8} y={yB - 5} fontSize={11} fill={G.B} fontStyle="italic">{candB.name}</text>
      <text x={tipX + 8} y={yB + 8} fontSize={9}  fill={G.dim}>{candB.divTime} divergence</text>

      {axisLabels(H)}
      {badge(20)}
    </>
  )

  // ── Topology: (extinct, (A, B))  — extinct is outgroup ────────────────────
  if (topo === 'AB_sister') {
    const xRoot  = toX(Math.max(myaA, myaB))   // deeper split: extinct diverges
    const xAB    = toX(Math.min(myaA, myaB))   // shallower: A and B diverge
    const stemL  = Math.min(xRoot - 30, margin.left + 10)
    const yABmid = (yA + yB) / 2

    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
        {gridLines(H)}

        {/* stem to root */}
        <line x1={stemL}  y1={(yE + yABmid) / 2} x2={xRoot}  y2={(yE + yABmid) / 2} stroke={G.stem} strokeWidth={1.5} />
        {/* root vertical: extinct to AB-clade midpoint */}
        <line x1={xRoot}  y1={yE}     x2={xRoot}  y2={yABmid} stroke={G.stem}    strokeWidth={1.5} />
        {/* extinct branch (dashed = extinct) */}
        <line x1={xRoot}  y1={yE}     x2={tipX}   y2={yE}     stroke={G.extinct} strokeWidth={1.5} strokeDasharray="5 3" />
        {/* horizontal to inner node */}
        <line x1={xRoot}  y1={yABmid} x2={xAB}    y2={yABmid} stroke={G.stem}    strokeWidth={1.5} />
        {/* inner vertical: A to B */}
        <line x1={xAB}    y1={yA}     x2={xAB}    y2={yB}     stroke={G.stem}    strokeWidth={1.5} />
        {/* A and B branches */}
        <line x1={xAB}    y1={yA}     x2={tipX}   y2={yA}     stroke={G.A}       strokeWidth={1.5} />
        <line x1={xAB}    y1={yB}     x2={tipX}   y2={yB}     stroke={G.B}       strokeWidth={1.5} />

        {/* internal nodes */}
        <circle cx={xRoot} cy={yE}     r={3} fill={G.stem} />
        <circle cx={xRoot} cy={yABmid} r={3} fill={G.stem} />
        <circle cx={xAB}   cy={yA}     r={3} fill={G.stem} />
        <circle cx={xAB}   cy={yB}     r={3} fill={G.stem} />

        {tipLabels()}
      </svg>
    )
  }

  // ── Topology: (B, (extinct, A))  — A and extinct are sisters; B is outgroup ─
  if (topo === 'EA_sister') {
    const xRoot  = toX(Math.max(myaA, myaB))   // root split (B diverges here)
    const xEA    = toX(myaA)                   // extinct + A split
    const stemL  = Math.min(xRoot - 30, margin.left + 10)
    const yEAmid = (yE + yA) / 2

    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
        {gridLines(H)}

        {/* stem to root */}
        <line x1={stemL}  y1={(yB + yEAmid) / 2} x2={xRoot}  y2={(yB + yEAmid) / 2} stroke={G.stem} strokeWidth={1.5} />
        {/* root vertical: B (outgroup at bottom) to EA-clade midpoint */}
        <line x1={xRoot}  y1={yB}     x2={xRoot}  y2={yEAmid} stroke={G.stem} strokeWidth={1.5} />
        {/* B branch (outgroup, living) */}
        <line x1={xRoot}  y1={yB}     x2={tipX}   y2={yB}     stroke={G.B}    strokeWidth={1.5} />
        {/* horizontal to extinct+A inner node */}
        <line x1={xRoot}  y1={yEAmid} x2={xEA}    y2={yEAmid} stroke={G.stem} strokeWidth={1.5} />
        {/* inner vertical: extinct to A */}
        <line x1={xEA}    y1={yE}     x2={xEA}    y2={yA}     stroke={G.stem} strokeWidth={1.5} />
        {/* extinct and A branches */}
        <line x1={xEA}    y1={yE}     x2={tipX}   y2={yE}     stroke={G.extinct} strokeWidth={1.5} strokeDasharray="5 3" />
        <line x1={xEA}    y1={yA}     x2={tipX}   y2={yA}     stroke={G.A}       strokeWidth={1.5} />

        {/* internal nodes */}
        <circle cx={xRoot} cy={yB}     r={3} fill={G.stem} />
        <circle cx={xRoot} cy={yEAmid} r={3} fill={G.stem} />
        <circle cx={xEA}   cy={yE}     r={3} fill={G.stem} />
        <circle cx={xEA}   cy={yA}     r={3} fill={G.stem} />

        {tipLabels()}
      </svg>
    )
  }

  // ── Topology: (A, (extinct, B))  — B and extinct are sisters; A is outgroup ─
  // EB_sister
  const xRoot  = toX(Math.max(myaA, myaB))   // root split (A diverges here)
  const xEB    = toX(myaB)                   // extinct + B split
  const stemL  = Math.min(xRoot - 30, margin.left + 10)
  const yEBmid = (yE + yB) / 2

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      {gridLines(H)}

      {/* stem to root */}
      <line x1={stemL}  y1={(yA + yEBmid) / 2} x2={xRoot}  y2={(yA + yEBmid) / 2} stroke={G.stem} strokeWidth={1.5} />
      {/* root vertical: A (outgroup middle) to EB-clade midpoint */}
      <line x1={xRoot}  y1={yA}     x2={xRoot}  y2={yEBmid} stroke={G.stem} strokeWidth={1.5} />
      {/* A branch (outgroup, living) */}
      <line x1={xRoot}  y1={yA}     x2={tipX}   y2={yA}     stroke={G.A}    strokeWidth={1.5} />
      {/* horizontal to extinct+B inner node */}
      <line x1={xRoot}  y1={yEBmid} x2={xEB}    y2={yEBmid} stroke={G.stem} strokeWidth={1.5} />
      {/* inner vertical: extinct to B */}
      <line x1={xEB}    y1={yE}     x2={xEB}    y2={yB}     stroke={G.stem} strokeWidth={1.5} />
      {/* extinct and B branches */}
      <line x1={xEB}    y1={yE}     x2={tipX}   y2={yE}     stroke={G.extinct} strokeWidth={1.5} strokeDasharray="5 3" />
      <line x1={xEB}    y1={yB}     x2={tipX}   y2={yB}     stroke={G.B}       strokeWidth={1.5} />

      {/* internal nodes */}
      <circle cx={xRoot} cy={yA}     r={3} fill={G.stem} />
      <circle cx={xRoot} cy={yEBmid} r={3} fill={G.stem} />
      <circle cx={xEB}   cy={yE}     r={3} fill={G.stem} />
      <circle cx={xEB}   cy={yB}     r={3} fill={G.stem} />

      {tipLabels()}
    </svg>
  )
}
