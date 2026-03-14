import { useEffect } from 'react'
import modalTextData from '../../data/modalText.json'

const G = {
  bg: '#0a1c11',
  card: '#162b1e',
  border: 'rgba(255,255,255,0.08)',
  white: '#FFFFFF',
  sage: '#8aad90',
  sageDim: '#4d7557',
  accent: '#4fb86b',
} as const

export type StatId = 'genomicScore' | 'habitatOverlap' | 'climateMatch' | 'trophicPresence'

const STAT_LABELS: Record<StatId, string> = {
  genomicScore: 'Genomic Score',
  habitatOverlap: 'Habitat Overlap',
  climateMatch: 'Climate Match',
  trophicPresence: 'Trophic Presence',
}

interface StatModalProps {
  extinctId: string
  candidateModalKey: string
  stat: StatId
  score: number
  onClose: () => void
}

interface ModalEntry {
  what: string
  how: string
  meaning: string
  sources: string[]
}

export default function StatModal({ extinctId, candidateModalKey, stat, score, onClose }: StatModalProps) {
  const key = `${extinctId}_${candidateModalKey}_${stat}`
  const entry = (modalTextData as Record<string, ModalEntry>)[key]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: G.card,
          border: `1px solid ${G.border}`,
          borderRadius: 18,
          padding: '28px 32px',
          maxWidth: 540,
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: G.sageDim, marginBottom: 5 }}>
              Methodology
            </div>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: 20, fontWeight: 700, color: G.white }}>
              {STAT_LABELS[stat]}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: G.accent, marginTop: 2 }}>
              {score}<span style={{ fontSize: 14, color: G.sageDim, fontWeight: 400, marginLeft: 2 }}>/ 100</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${G.border}`,
              color: G.sage, fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ width: '100%', height: 1, background: G.border, marginBottom: 20 }} />

        {!entry ? (
          <div style={{ color: G.sageDim, fontSize: 13 }}>No explanation available for this pairing.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {[
              { label: 'What this measures', text: entry.what },
              { label: 'How we calculated it', text: entry.how },
              { label: 'What this score means', text: entry.meaning },
            ].map(({ label, text }) => (
              <div key={label}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: G.accent, marginBottom: 6 }}>
                  {label}
                </div>
                <div style={{ fontSize: 13, color: G.sage, lineHeight: 1.75 }}>{text}</div>
              </div>
            ))}

            <div>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: G.accent, marginBottom: 8 }}>
                Data sources
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {entry.sources.map((s) => (
                  <div key={s} style={{ display: 'flex', gap: 8, fontSize: 12, color: G.sageDim }}>
                    <span style={{ color: G.accent, flexShrink: 0 }}>·</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
