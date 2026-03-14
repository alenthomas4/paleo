import type { Candidate } from '../../types'

interface EcoPlotProps {
  candA: Candidate
  candB: Candidate
  colorA?: string
  colorB?: string
}

export default function EcoPlot({
  candA,
  candB,
  colorA = '#4fb86b',
  colorB = '#60a5fa',
}: EcoPlotProps) {
  const cx = 110
  const cy = 110
  const r = 78

  const axes = [
    { label: 'Habitat', angle: -90 },
    { label: 'Climate', angle: 0 },
    { label: 'Trophic', angle: 90 },
    { label: 'Genomic', angle: 180 },
  ]

  function vals(c: Candidate) {
    return [
      c.ecoFactors.habitatOverlap,
      c.ecoFactors.climateMatch,
      c.ecoFactors.trophicPresence,
      c.score,
    ]
  }

  function toXY(value: number, angle: number) {
    const rad = (angle * Math.PI) / 180
    const frac = value / 100
    return {
      x: cx + frac * r * Math.cos(rad),
      y: cy + frac * r * Math.sin(rad),
    }
  }

  function polygon(candidate: Candidate) {
    return vals(candidate)
      .map((v, i) => toXY(v, axes[i].angle))
      .map((p) => `${p.x},${p.y}`)
      .join(' ')
  }

  // Grid rings
  const rings = [25, 50, 75, 100]

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      {/* Radar */}
      <svg viewBox="0 0 220 220" width={220} height={220} style={{ flexShrink: 0 }}>
        {/* Grid rings */}
        {rings.map((pct) =>
          axes.map((ax, i) => {
            const next = axes[(i + 1) % axes.length]
            const p1 = toXY(pct, ax.angle)
            const p2 = toXY(pct, next.angle)
            return (
              <line
                key={`${pct}-${i}`}
                x1={p1.x} y1={p1.y}
                x2={p2.x} y2={p2.y}
                stroke="rgba(255,255,255,0.07)"
                strokeWidth={1}
              />
            )
          })
        )}

        {/* Axis spokes */}
        {axes.map((ax) => {
          const tip = toXY(100, ax.angle)
          return (
            <line
              key={ax.label}
              x1={cx} y1={cy}
              x2={tip.x} y2={tip.y}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={1}
            />
          )
        })}

        {/* Candidate B polygon (behind) */}
        <polygon
          points={polygon(candB)}
          fill={`${colorB}20`}
          stroke={colorB}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* Candidate A polygon (front) */}
        <polygon
          points={polygon(candA)}
          fill={`${colorA}20`}
          stroke={colorA}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* Axis labels */}
        {axes.map((ax) => {
          const pos = toXY(115, ax.angle)
          return (
            <text
              key={ax.label}
              x={pos.x}
              y={pos.y + 4}
              textAnchor="middle"
              fontSize={9}
              fill="rgba(138,173,144,0.7)"
              letterSpacing="0.08em"
            >
              {ax.label.toUpperCase()}
            </text>
          )
        })}

        {/* Dot markers */}
        {vals(candA).map((v, i) => {
          const p = toXY(v, axes[i].angle)
          return <circle key={i} cx={p.x} cy={p.y} r={3} fill={colorA} />
        })}
        {vals(candB).map((v, i) => {
          const p = toXY(v, axes[i].angle)
          return <circle key={i} cx={p.x} cy={p.y} r={3} fill={colorB} />
        })}
      </svg>

      {/* Legend + bar breakdown */}
      <div style={{ flex: 1, paddingTop: 8 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
          {[{ label: candA.name, color: colorA }, { label: candB.name, color: colorB }].map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
              <span style={{ fontSize: 11, color: 'rgba(138,173,144,0.8)', fontStyle: 'italic' }}>{label}</span>
            </div>
          ))}
        </div>

        {axes.map((ax, i) => {
          const vA = vals(candA)[i]
          const vB = vals(candB)[i]
          return (
            <div key={ax.label} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: '#4d7557', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {ax.label}
                </span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                  {vA} / {vB}
                </span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden', marginBottom: 3 }}>
                <div style={{ height: '100%', width: `${vA}%`, background: colorA, borderRadius: 100 }} />
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${vB}%`, background: colorB, borderRadius: 100 }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
