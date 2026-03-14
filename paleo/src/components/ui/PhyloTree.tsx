import type { ExtinctSpecies, Candidate } from '../../types'

interface PhyloTreeProps {
  extinct: ExtinctSpecies
  candA: Candidate
  candB?: Candidate
}

function parseMya(divTime: string): number {
  const match = divTime.match(/[\d.]+/)
  return match ? parseFloat(match[0]) : 10
}

export default function PhyloTree({ extinct, candA, candB }: PhyloTreeProps) {
  const myaA = parseMya(candA.divTime)
  const myaB = candB ? parseMya(candB.divTime) : 0
  const maxMya = Math.max(myaA, myaB) * 1.3 || 1

  const W = 580
  const H = candB ? 200 : 140
  const margin = { left: 20, right: 140 }
  const timelineW = W - margin.left - margin.right
  const myaToX = (mya: number) => margin.left + timelineW * (1 - mya / maxMya)
  const presentX = margin.left + timelineW

  const G = {
    line: 'rgba(255,255,255,0.25)',
    extinct: '#6b7280',
    candA: '#4fb86b',
    candB: '#60a5fa',
    dim: '#4d7557',
  }

  if (!candB) {
    // Simple 2-tip tree: extinct + candA
    const yExtinct = 34
    const yCandA = 96
    const xSplit = myaToX(myaA)
    const stemLeft = Math.min(xSplit - 30, margin.left + 10)
    const yMid = (yExtinct + yCandA) / 2

    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={margin.left + timelineW * f} y1={8} x2={margin.left + timelineW * f} y2={H - 16}
            stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
        ))}
        <line x1={stemLeft} y1={yMid} x2={xSplit} y2={yMid} stroke={G.line} strokeWidth={1.5} />
        <line x1={xSplit} y1={yExtinct} x2={xSplit} y2={yCandA} stroke={G.line} strokeWidth={1.5} />
        <line x1={xSplit} y1={yExtinct} x2={presentX} y2={yExtinct} stroke={G.extinct} strokeWidth={1.5} strokeDasharray="5 3" />
        <line x1={xSplit} y1={yCandA} x2={presentX} y2={yCandA} stroke={G.candA} strokeWidth={1.5} />
        <circle cx={presentX} cy={yExtinct} r={4} fill={G.extinct} />
        <text x={presentX + 8} y={yExtinct + 4} fontSize={11} fill={G.extinct} fontStyle="italic">†{extinct.name}</text>
        <circle cx={presentX} cy={yCandA} r={4} fill={G.candA} />
        <text x={presentX + 8} y={yCandA - 5} fontSize={11} fill={G.candA} fontStyle="italic">{candA.name}</text>
        <text x={presentX + 8} y={yCandA + 8} fontSize={9} fill={G.dim}>{candA.divTime} divergence</text>
        <circle cx={xSplit} cy={yExtinct} r={3} fill={G.line} />
        <circle cx={xSplit} cy={yCandA} r={3} fill={G.line} />
        <text x={margin.left} y={H - 2} fontSize={9} fill={G.dim} letterSpacing="0.08em">OLDER</text>
        <text x={presentX - 36} y={H - 2} fontSize={9} fill={G.dim} letterSpacing="0.08em">PRESENT</text>
      </svg>
    )
  }

  // 3-tip tree: extinct + candA + candB
  const yExtinct = 44
  const yCandA = 112
  const yCandB = 168
  const xSplitAB = myaToX(Math.min(myaA, myaB))
  const xRootSplit = myaToX(Math.max(myaA, myaB))
  const stemLeft = Math.min(xRootSplit - 30, margin.left + 10)
  const yCladeMid = (yCandA + yCandB) / 2

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={margin.left + timelineW * f} y1={10} x2={margin.left + timelineW * f} y2={H - 20}
          stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
      ))}
      <line x1={stemLeft} y1={(yExtinct + yCladeMid) / 2} x2={xRootSplit} y2={(yExtinct + yCladeMid) / 2} stroke={G.line} strokeWidth={1.5} />
      <line x1={xRootSplit} y1={yExtinct} x2={xRootSplit} y2={yCladeMid} stroke={G.line} strokeWidth={1.5} />
      <line x1={xRootSplit} y1={yExtinct} x2={presentX} y2={yExtinct} stroke={G.extinct} strokeWidth={1.5} strokeDasharray="5 3" />
      <line x1={xRootSplit} y1={yCladeMid} x2={xSplitAB} y2={yCladeMid} stroke={G.line} strokeWidth={1.5} />
      <line x1={xSplitAB} y1={yCandA} x2={xSplitAB} y2={yCandB} stroke={G.line} strokeWidth={1.5} />
      <line x1={xSplitAB} y1={yCandA} x2={presentX} y2={yCandA} stroke={G.candA} strokeWidth={1.5} />
      <line x1={xSplitAB} y1={yCandB} x2={presentX} y2={yCandB} stroke={G.candB} strokeWidth={1.5} />
      <circle cx={presentX} cy={yExtinct} r={4} fill={G.extinct} />
      <text x={presentX + 8} y={yExtinct + 4} fontSize={11} fill={G.extinct} fontStyle="italic">†{extinct.name}</text>
      <circle cx={presentX} cy={yCandA} r={4} fill={G.candA} />
      <text x={presentX + 8} y={yCandA - 5} fontSize={11} fill={G.candA} fontStyle="italic">{candA.name}</text>
      <text x={presentX + 8} y={yCandA + 8} fontSize={9} fill={G.dim}>{candA.divTime} divergence</text>
      <circle cx={presentX} cy={yCandB} r={4} fill={G.candB} />
      <text x={presentX + 8} y={yCandB - 5} fontSize={11} fill={G.candB} fontStyle="italic">{candB.name}</text>
      <text x={presentX + 8} y={yCandB + 8} fontSize={9} fill={G.dim}>{candB.divTime} divergence</text>
      <circle cx={xRootSplit} cy={yExtinct} r={3} fill={G.line} />
      <circle cx={xRootSplit} cy={yCladeMid} r={3} fill={G.line} />
      <circle cx={xSplitAB} cy={yCandA} r={3} fill={G.line} />
      <circle cx={xSplitAB} cy={yCandB} r={3} fill={G.line} />
      <text x={margin.left} y={H - 4} fontSize={9} fill={G.dim} letterSpacing="0.08em">OLDER</text>
      <text x={presentX - 36} y={H - 4} fontSize={9} fill={G.dim} letterSpacing="0.08em">PRESENT</text>
    </svg>
  )
}
