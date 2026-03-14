import type { Candidate, VerdictCode, Verdict } from '../../types'

const VERDICTS: Record<VerdictCode, Omit<Verdict, 'code'>> = {
  WILD_GMO: {
    label: 'Wild via GMO',
    color: '#4fb86b',
    description: 'Genomic and ecological profile supports full wild reintroduction after targeted gene-editing.',
  },
  WILD_RELOCATION: {
    label: 'Wild Relocation',
    color: '#60a5fa',
    description: 'Strong ecological match — candidate can be relocated to original habitat range without major modification.',
  },
  CAPTIVITY: {
    label: 'Captivity Only',
    color: '#d4a84b',
    description: 'Partial compatibility — viable in managed care but unsuitable for direct wild reintroduction.',
  },
  NOT_RECOMMENDED: {
    label: 'Not Recommended',
    color: '#e06060',
    description: 'Insufficient genomic or ecological compatibility for safe de-extinction use.',
  },
  NOT_POSSIBLE: {
    label: 'Not Possible',
    color: '#6b7280',
    description: 'Current science cannot bridge the genomic and ecological gap for this pairing.',
  },
}

export function computeVerdict(candidate: Candidate): Verdict {
  const { score, ecoFactors } = candidate
  const { habitatOverlap, climateMatch, trophicPresence } = ecoFactors
  const composite = score * 0.5 + habitatOverlap * 0.2 + climateMatch * 0.15 + trophicPresence * 0.15

  let code: VerdictCode
  if (composite >= 85) code = 'WILD_GMO'
  else if (composite >= 70) code = 'WILD_RELOCATION'
  else if (composite >= 55) code = 'CAPTIVITY'
  else if (composite >= 40) code = 'NOT_RECOMMENDED'
  else code = 'NOT_POSSIBLE'

  return { code, ...VERDICTS[code] }
}

interface VerdictBadgeProps {
  candidate: Candidate
  size?: 'sm' | 'lg'
}

export default function VerdictBadge({ candidate, size = 'lg' }: VerdictBadgeProps) {
  const verdict = computeVerdict(candidate)
  const compact = size === 'sm'

  return (
    <div
      style={{
        background: `${verdict.color}15`,
        border: `1px solid ${verdict.color}50`,
        borderLeft: `3px solid ${verdict.color}`,
        borderRadius: 10,
        padding: compact ? '10px 14px' : '14px 18px',
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          color: '#4d7557',
          marginBottom: 5,
        }}
      >
        Verdict
      </div>
      <div
        style={{
          fontSize: compact ? 13 : 15,
          fontWeight: 800,
          color: verdict.color,
          marginBottom: compact ? 0 : 6,
        }}
      >
        {verdict.label}
      </div>
      {!compact && (
        <div style={{ fontSize: 11, color: verdict.color, opacity: 0.75, lineHeight: 1.6 }}>
          {verdict.description}
        </div>
      )}
    </div>
  )
}
