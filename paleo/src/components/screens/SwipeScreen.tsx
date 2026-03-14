import { useState } from 'react'
import candidatesData from '../../data/candidates.json'
import { useSwipe } from '../../hooks/useSwipe'
import type { ExtinctSpecies, Candidate } from '../../types'

const G = {
  bg: '#0f1f15', card: '#162b1e', border: 'rgba(255,255,255,0.07)',
  white: '#FFFFFF', sage: '#8aad90', sageDim: '#4d7557',
  mint: '#d0ead3', accent: '#4fb86b', red: '#e06060', amber: '#d4a84b',
} as const

interface SwipeScreenProps {
  extinct: ExtinctSpecies
  onMatch: (candidate: Candidate) => void
}

export default function SwipeScreen({ extinct, onMatch }: SwipeScreenProps) {
  const cands: Candidate[] = (candidatesData as Record<string, Candidate[]>)[extinct.id] ?? []
  const [idx, setIdx] = useState(0)
  const [dir, setDir] = useState<'left' | 'right' | null>(null)
  const card = cands[idx]

  const doLeft = () => {
    const i = idx; const c = cands[i]
    setDir('left')
    setTimeout(() => { if (i < cands.length - 1) setIdx(i + 1); else onMatch(c); setDir(null) }, 380)
  }
  const doRight = () => {
    const c = cands[idx]
    setDir('right')
    setTimeout(() => { onMatch(c); setDir(null) }, 380)
  }

  const sw = useSwipe({ onSwipeLeft: doLeft, onSwipeRight: doRight })
  const fc = card.score >= 85 ? G.accent : card.score >= 60 ? G.amber : G.red
  const tf = dir === 'right' ? 'translateX(520px) rotate(18deg)' : dir === 'left' ? 'translateX(-520px) rotate(-18deg)' : `translateX(${sw.dragX}px) rotate(${sw.tilt}deg)`
  const tr = dir ? 'transform 0.38s cubic-bezier(0.4,0,0.2,1)' : sw.dragging ? 'none' : 'transform 0.2s ease'
  const bc = sw.dragX > 30 ? `${G.accent}55` : sw.dragX < -30 ? `${G.red}55` : G.border

  if (!card) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: G.bg, color: G.sage }}>No candidates available.</div>

  return (
    <div style={{ display: 'flex', flex: 1, height: '100vh', background: G.bg, fontFamily: "'Helvetica Neue', Arial, sans-serif", overflow: 'hidden' }}>

      {/* LEFT PANEL */}
      <div style={{ flex: '0 0 420px', borderRight: `1px solid ${G.border}`, display: 'flex', flexDirection: 'column', padding: '28px 24px', gap: 14, overflow: 'hidden' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', background: G.card, border: `1px solid ${G.border}`, borderRadius: 100, alignSelf: 'flex-start' }}>
          <span style={{ fontSize: 22 }}>{extinct.icon}</span>
          <div>
            <div style={{ color: G.white, fontSize: 13, fontWeight: 600 }}>{extinct.name}</div>
            <div style={{ color: G.sageDim, fontSize: 11, fontStyle: 'italic' }}>{extinct.sci}</div>
          </div>
        </div>

        <div>
          <div style={{ color: G.sage, fontSize: 13 }}>Candidate {idx + 1} of {cands.length}</div>
          <div style={{ color: G.sageDim, fontSize: 11, marginTop: 2 }}>Swipe to match or skip</div>
        </div>

        {/* Card stack */}
        <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
          {cands[idx + 1] && <div style={{ position: 'absolute', top: 14, left: 10, right: 10, bottom: 0, background: G.card, borderRadius: 20, border: `1px solid ${G.border}`, opacity: 0.5 }} />}

          <div onMouseDown={sw.onMD} onMouseMove={sw.onMM} onMouseUp={sw.onMU} onMouseLeave={sw.onMU}
            style={{ position: 'absolute', inset: 0, background: G.card, borderRadius: 20, border: `1px solid ${bc}`, padding: '18px 20px 16px', cursor: sw.dragging ? 'grabbing' : 'grab', userSelect: 'none', transform: tf, transition: tr, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${extinct.accent}18 0%, transparent 70%)`, pointerEvents: 'none' }} />

            <div style={{ position: 'absolute', top: 18, right: 18, border: `2px solid ${G.accent}`, borderRadius: 6, padding: '3px 9px', color: G.accent, fontSize: 15, fontWeight: 800, letterSpacing: '0.1em', opacity: sw.matchOp, transform: 'rotate(15deg)' }}>MATCH</div>
            <div style={{ position: 'absolute', top: 18, left: 18, border: `2px solid ${G.red}`, borderRadius: 6, padding: '3px 9px', color: G.red, fontSize: 15, fontWeight: 800, letterSpacing: '0.1em', opacity: sw.skipOp, transform: 'rotate(-15deg)' }}>SKIP</div>

            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: G.sageDim, textTransform: 'uppercase', marginBottom: 10 }}>Living Candidate</div>
            <div style={{ fontSize: 96, lineHeight: 1, marginBottom: 10 }}>{card.icon}</div>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: 24, fontWeight: 700, color: G.white, marginBottom: 2 }}>{card.name}</div>
            <div style={{ fontSize: 12, fontStyle: 'italic', color: G.sageDim, marginBottom: 12 }}>{card.sci}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
              {card.tags.map(t => <span key={t} style={{ fontSize: 10, padding: '3px 9px', borderRadius: 100, border: `1px solid ${G.border}`, color: G.sage }}>{t}</span>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: G.border, borderRadius: 8, overflow: 'hidden', marginTop: 'auto' }}>
              {([['Mass', card.mass], ['Range', card.range], ['Habitat', card.habitat], ['Div. Time', card.divTime]] as [string, string][]).map(([k, v]) => (
                <div key={k} style={{ background: G.bg, padding: '8px 10px' }}>
                  <div style={{ fontSize: 9, color: G.sageDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 11, color: G.white, fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'center', minWidth: 60 }}>
            <div style={{ fontSize: 9, color: G.sageDim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Genomic Match</div>
            <span style={{ fontSize: 34, fontWeight: 800, color: G.white }}>{card.score}</span>
            <span style={{ fontSize: 18, color: G.sage }}>%</span>
          </div>
          <button onClick={doLeft} style={{ width: 50, height: 50, borderRadius: '50%', background: 'transparent', border: `1px solid ${G.border}`, color: G.sage, fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>✕</button>
          <button onClick={doRight} style={{ flex: 1.4, height: 50, borderRadius: 100, background: G.white, color: G.bg, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>Match →</button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ fontFamily: "'Georgia', serif", fontSize: 22, fontWeight: 700, color: G.white }}>Species profile</div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: G.sage }}>Genomic identity (mtDNA)</span>
            <span style={{ fontSize: 13, color: G.white, fontWeight: 600 }}>{card.score}%</span>
          </div>
          <div style={{ height: 6, background: G.border, borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${card.score}%`, background: fc, borderRadius: 100, boxShadow: `0 0 12px ${fc}66`, transition: 'width 0.6s ease' }} />
          </div>
        </div>

        {([{ label: 'For', text: card.forText, color: G.accent }, { label: 'Against', text: card.againstText, color: G.red }]).map(({ label, text, color }) => (
          <div key={label} style={{ background: G.card, borderRadius: 12, border: `1px solid ${color}38`, borderLeft: `3px solid ${color}`, padding: '14px 18px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 13, color: G.sage, lineHeight: 1.7 }}>{text}</div>
          </div>
        ))}

        <div style={{ border: `1px solid ${G.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {([['Scientific name', card.sci], ['Habitat', card.habitat], ['Geographic range', card.range], ['Body mass', card.mass], ['Divergence time', card.divTime]] as [string, string][]).map(([k, v], i, a) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < a.length - 1 ? `1px solid ${G.border}` : undefined }}>
              <span style={{ fontSize: 12, color: G.sageDim, textTransform: 'uppercase', letterSpacing: '0.05em', flex: '0 0 180px' }}>{k}</span>
              <span style={{ fontSize: 13, color: G.white, fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
