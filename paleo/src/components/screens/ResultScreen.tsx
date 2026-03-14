import { useState } from 'react'
import type { ExtinctSpecies, Candidate } from '../../types'
import VerdictBadge, { computeVerdict } from '../ui/VerdictBadge'
import PhyloTree from '../ui/PhyloTree'
import StatModal, { type StatId } from '../ui/StatModal'

const G = {
  bg: '#0f1f15',
  card: '#162b1e',
  border: 'rgba(255,255,255,0.07)',
  white: '#FFFFFF',
  sage: '#8aad90',
  sageDim: '#4d7557',
  accent: '#4fb86b',
  red: '#e06060',
} as const

interface ResultScreenProps {
  extinct: ExtinctSpecies
  matched: Candidate
  onReset: () => void
}

function ScoreRing({ score, color, size = 100 }: { score: number; color: string; size?: number }) {
  const r = size / 2 - 8
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
      />
      <text x={size / 2} y={size / 2 - 4} textAnchor="middle" dominantBaseline="middle" fill={G.white} fontSize={20} fontWeight={800}>
        {score}
      </text>
      <text x={size / 2} y={size / 2 + 14} textAnchor="middle" dominantBaseline="middle" fill={G.sageDim} fontSize={10}>
        % match
      </text>
    </svg>
  )
}

export default function ResultScreen({ extinct, matched, onReset }: ResultScreenProps) {
  const [openStat, setOpenStat] = useState<StatId | null>(null)

  const verdict = computeVerdict(matched)
  const composite = Math.round(
    matched.score * 0.5 +
    matched.ecoFactors.habitatOverlap * 0.2 +
    matched.ecoFactors.climateMatch * 0.15 +
    matched.ecoFactors.trophicPresence * 0.15
  )

  return (
    <>
    {openStat && (
      <StatModal
        extinctId={extinct.id}
        candidateModalKey={matched.modalKey}
        stat={openStat}
        score={openStat === 'genomicScore' ? matched.score
          : openStat === 'habitatOverlap' ? matched.ecoFactors.habitatOverlap
          : openStat === 'climateMatch' ? matched.ecoFactors.climateMatch
          : matched.ecoFactors.trophicPresence}
        onClose={() => setOpenStat(null)}
      />
    )}
    <div
      style={{
        flex: 1,
        minHeight: '100vh',
        background: G.bg,
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '22px 32px 16px',
          borderBottom: `1px solid ${G.border}`,
          position: 'sticky',
          top: 0,
          background: G.bg,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 14px',
              background: G.card,
              border: `1px solid ${G.border}`,
              borderRadius: 100,
            }}
          >
            <span style={{ fontSize: 18 }}>{extinct.icon}</span>
            <div>
              <div style={{ color: G.white, fontSize: 12, fontWeight: 600 }}>{extinct.name}</div>
              <div style={{ color: G.sageDim, fontSize: 10, fontStyle: 'italic' }}>{extinct.sci}</div>
            </div>
          </div>
          <div style={{ color: G.sageDim, fontSize: 13 }}>→</div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: G.sageDim, marginBottom: 2 }}>
              Revival Analysis
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: G.white }}>
              You matched <span style={{ color: G.accent }}>{matched.name}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onReset}
          style={{
            padding: '9px 20px',
            borderRadius: 100,
            background: 'transparent',
            border: `1px solid ${G.border}`,
            color: G.sage,
            fontSize: 13,
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          ← Start Over
        </button>
      </div>

      {/* Main content */}
      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Hero row: candidate identity + score ring */}
        <div
          style={{
            background: `${G.accent}08`,
            border: `1px solid ${G.accent}35`,
            borderRadius: 16,
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${G.accent}, ${G.accent}00)` }} />
          <div style={{ fontSize: 64, lineHeight: 1 }}>{matched.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: G.sageDim, marginBottom: 6 }}>
              Living Candidate
            </div>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: 26, fontWeight: 700, color: G.white, marginBottom: 3 }}>
              {matched.name}
            </div>
            <div style={{ fontSize: 13, fontStyle: 'italic', color: G.sageDim, marginBottom: 12 }}>
              {matched.sci}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {matched.tags.map((t) => (
                <span key={t} style={{ fontSize: 10, padding: '4px 10px', borderRadius: 100, border: `1px solid ${G.border}`, color: G.sage }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <ScoreRing score={matched.score} color={G.accent} size={100} />
            <button
              onClick={() => setOpenStat('genomicScore')}
              style={{
                fontSize: 10, color: G.sageDim, background: 'none', border: 'none',
                cursor: 'pointer', textDecoration: 'underline', padding: 0,
              }}
            >
              How is this calculated?
            </button>
          </div>
        </div>

        {/* Verdict */}
        <VerdictBadge candidate={matched} size="lg" />

        {/* Composite score bar */}
        <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: G.sage }}>Composite revival score</span>
            <span style={{ fontSize: 13, color: G.white, fontWeight: 700 }}>{composite} / 100</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${composite}%`, background: verdict.color, borderRadius: 100, boxShadow: `0 0 10px ${verdict.color}66`, transition: 'width 0.6s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, gap: 8 }}>
            {([
              { label: 'Genomic', value: matched.score, statId: 'genomicScore' as StatId },
              { label: 'Habitat', value: matched.ecoFactors.habitatOverlap, statId: 'habitatOverlap' as StatId },
              { label: 'Climate', value: matched.ecoFactors.climateMatch, statId: 'climateMatch' as StatId },
              { label: 'Trophic', value: matched.ecoFactors.trophicPresence, statId: 'trophicPresence' as StatId },
            ]).map(({ label, value, statId }) => (
              <div key={label} style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: G.sageDim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
                  <button
                    onClick={() => setOpenStat(statId)}
                    style={{
                      width: 13, height: 13, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(255,255,255,0.07)', border: `1px solid ${G.border}`,
                      color: G.sageDim, fontSize: 8, cursor: 'pointer', lineHeight: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                    }}
                    title={`Explain ${label}`}
                  >
                    i
                  </button>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${value}%`, background: verdict.color, borderRadius: 100 }} />
                </div>
                <div style={{ fontSize: 10, color: G.white, fontWeight: 600, marginTop: 3 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* For / Against */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'For', text: matched.forText, color: G.accent },
            { label: 'Against', text: matched.againstText, color: G.red },
          ].map(({ label, text, color }) => (
            <div key={label} style={{ background: `${color}0d`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color, marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 12, color: G.sage, lineHeight: 1.7 }}>{text}</div>
            </div>
          ))}
        </div>

        {/* Stats table */}
        <div style={{ border: `1px solid ${G.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {([
            ['Scientific name', matched.sci],
            ['Habitat', matched.habitat],
            ['Geographic range', matched.range],
            ['Body mass', matched.mass],
            ['Divergence time', matched.divTime],
            ['Population trend', matched.ecoFactors.populationTrend],
          ] as [string, string][]).map(([k, v], i, a) => (
            <div
              key={k}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 20px',
                borderBottom: i < a.length - 1 ? `1px solid ${G.border}` : undefined,
              }}
            >
              <span style={{ fontSize: 11, color: G.sageDim, textTransform: 'uppercase', letterSpacing: '0.05em', flex: '0 0 180px' }}>{k}</span>
              <span style={{ fontSize: 12, color: G.white, fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Phylogenetic tree */}
        <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: '20px 24px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: G.sageDim, marginBottom: 4 }}>
            Phylogenetic Relationship
          </div>
          <div style={{ fontFamily: "'Georgia', serif", fontSize: 15, fontWeight: 700, color: G.white, marginBottom: 16 }}>
            Cladogram
          </div>
          <PhyloTree extinct={extinct} candA={matched} />
        </div>

        {/* CTA */}
        <div
          style={{
            background: `linear-gradient(135deg, ${G.card}, #0b2a1d)`,
            border: `1px solid ${G.accent}30`,
            borderRadius: 16,
            padding: '24px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: G.accent, marginBottom: 6 }}>
              Next Step
            </div>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: 700, color: G.white, marginBottom: 6 }}>
              Run a live BLAST comparison
            </div>
            <div style={{ fontSize: 12, color: G.sage, lineHeight: 1.6, maxWidth: 420 }}>
              Compare actual mitochondrial DNA sequences from NCBI for {matched.name} and {extinct.name} using our BLAST pipeline.
            </div>
          </div>
          <button
            onClick={onReset}
            style={{
              padding: '11px 24px',
              borderRadius: 100,
              background: G.accent,
              border: 'none',
              color: G.bg,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Try Another Species →
          </button>
        </div>

      </div>
    </div>
    </>
  )
}
