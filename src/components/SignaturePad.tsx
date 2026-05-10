import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

export interface SignaturePadHandle {
  isEmpty: () => boolean
  clear: () => void
  toDataURL: () => string | null
}

interface Props {
  onInkChange?: (hasInk: boolean) => void
  className?: string
}

export const SignaturePad = forwardRef<SignaturePadHandle, Props>(function SignaturePad(
  { onInkChange, className },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const lastRef = useRef<{ x: number; y: number } | null>(null)
  const [hasInk, setHasInk] = useState(false)

  useEffect(() => {
    onInkChange?.(hasInk)
  }, [hasInk, onInkChange])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function setup() {
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, rect.width * dpr)
      canvas.height = Math.max(1, rect.height * dpr)
      ctx.scale(dpr, dpr)
      ctx.lineWidth = 2.2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#111111'
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, rect.width, rect.height)
    }

    setup()
    window.addEventListener('resize', setup)
    return () => window.removeEventListener('resize', setup)
  }, [])

  function pointFromEvent(e: React.PointerEvent): { x: number; y: number } | null {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    const p = pointFromEvent(e)
    if (!p) return
    drawingRef.current = true
    lastRef.current = p
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drawingRef.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const p = pointFromEvent(e)
    if (!p || !lastRef.current) return
    ctx.beginPath()
    ctx.moveTo(lastRef.current.x, lastRef.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    lastRef.current = p
    if (!hasInk) setHasInk(true)
  }

  function onPointerUp(e: React.PointerEvent) {
    drawingRef.current = false
    lastRef.current = null
    const canvas = canvasRef.current
    if (canvas?.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId)
    }
  }

  useImperativeHandle(ref, () => ({
    isEmpty: () => !hasInk,
    clear: () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, rect.width, rect.height)
      setHasInk(false)
    },
    toDataURL: () => {
      const canvas = canvasRef.current
      if (!canvas) return null
      return canvas.toDataURL('image/png')
    },
  }))

  return (
    <canvas
      ref={canvasRef}
      className={`bg-white rounded-md touch-none cursor-crosshair ${className ?? ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    />
  )
})
