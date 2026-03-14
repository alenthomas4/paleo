import { useState, useRef } from 'react'
import type { SwipeOptions, SwipeState } from '../types'

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 100 }: SwipeOptions): SwipeState {
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const dragXRef = useRef(0)
  const draggingRef = useRef(false)

  const onMD = (e: React.MouseEvent) => {
    draggingRef.current = true
    setDragging(true)
    startX.current = e.clientX
    dragXRef.current = 0
  }

  const onMM = (e: React.MouseEvent) => {
    if (!draggingRef.current) return
    const x = e.clientX - startX.current
    dragXRef.current = x
    setDragX(x)
  }

  const onMU = () => {
    if (!draggingRef.current) return
    draggingRef.current = false
    setDragging(false)
    const dx = dragXRef.current
    if (dx > threshold) onSwipeRight()
    else if (dx < -threshold) onSwipeLeft()
    setDragX(0)
    dragXRef.current = 0
  }

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

  return {
    dragX,
    dragging,
    tilt: dragX / 22,
    matchOp: clamp(dragX / 140, 0, 1),
    skipOp: clamp(-dragX / 140, 0, 1),
    onMD,
    onMM,
    onMU,
  }
}
