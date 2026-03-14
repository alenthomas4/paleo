export interface EcoFactors {
  habitatOverlap: number       // 0–100
  climateMatch: number         // 0–100
  trophicPresence: number      // 0–100
  timeSinceExtinction: number  // years
  populationTrend: 'increasing' | 'stable' | 'decreasing'
}

export interface ExtinctSpecies {
  id: string
  name: string
  sci: string
  icon: string
  accent: string
  period: string
  epochType: 'pleistocene' | 'modern' | 'early-modern'
  mass: string
  role: string
  range: string
  tags: string[]
  blurb: string
}

export interface Candidate {
  name: string
  sci: string
  icon: string
  score: number
  habitat: string
  range: string
  mass: string
  divTime: string
  tags: string[]
  forText: string
  againstText: string
  ecoFactors: EcoFactors
  modalKey: string
}

export type VerdictCode = 'NOT_POSSIBLE' | 'WILD_GMO' | 'WILD_RELOCATION' | 'CAPTIVITY' | 'NOT_RECOMMENDED'

export interface Verdict {
  code: VerdictCode
  label: string
  color: string
  description: string
}

export interface SwipeState {
  dragX: number
  dragging: boolean
  tilt: number
  matchOp: number
  skipOp: number
  onMD: (e: React.MouseEvent) => void
  onMM: (e: React.MouseEvent) => void
  onMU: () => void
}

export interface SwipeOptions {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  threshold?: number
}
