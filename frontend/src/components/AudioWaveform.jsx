import { useState, useEffect, useRef, memo } from 'react'

/**
 * AudioWaveform
 * Props:
 * - isActive: boolean – active animation when true
 * - intensity: 'low' | 'medium' | 'high' | 'voice'
 * - className: string – extra classes for the container
 * - barCount: number – number of bars (default 72)
 * - barWidth: number – width of each bar in px (default 8)
 * - gap: number – gap between bars in px (default 3)
 * - maxHeight: number – max bar height in px (default 56)
 */
function AudioWaveform({
  isActive = false,
  intensity = 'medium',
  className = '',
  barCount = 72,
  barWidth = 8,
  gap = 3,
  maxHeight = 56,
}) {
  const [waveData, setWaveData] = useState(() => Array(barCount).fill(0))
  const rafRef = useRef(null)
  const idleTimeoutRef = useRef(null)

  // Sync bars count if it changes
  useEffect(() => {
    setWaveData(Array(barCount).fill(0))
  }, [barCount])

  useEffect(() => {
    const multipliers = { low: 0.3, medium: 0.6, high: 1.0, voice: 0.8 }
    const m = multipliers[intensity] ?? 0.6

    const generate = () =>
      Array(barCount)
        .fill(0)
        .map((_, i) => {
          if (!isActive) return 0.1 + Math.random() * 0.1
          const voice = Math.sin(Date.now() * 0.005 + i * 0.3) * 0.4
          const noise = Math.random() * 0.3
          const speech = Math.sin(Date.now() * 0.008 + i * 0.1) * 0.3
          return Math.max(0.1, (voice + noise + speech) * m + 0.2)
        })

    const animate = () => {
      setWaveData(generate())
      rafRef.current = requestAnimationFrame(animate)
    }

    const subtle = () => {
      setWaveData(
        Array(barCount)
          .fill(0)
          .map(() => 0.1 + Math.random() * 0.05)
      )
      idleTimeoutRef.current = setTimeout(subtle, 200)
    }

    // Start proper loop
    if (isActive) {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current)
        idleTimeoutRef.current = null
      }
      animate()
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      subtle()
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
    }
  }, [isActive, intensity, barCount])

  return (
    <div
      className={`flex items-end ${className}`}
      style={{ gap: `${gap}px` }}
      role="img"
      aria-label={isActive ? 'Visualisation audio active' : 'Visualisation audio inactive'}
    >
      {waveData.map((h, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-75 ${
            isActive
              ? 'bg-gradient-to-t from-green-500 to-green-300'
              : 'bg-gradient-to-t from-gray-300 to-gray-200'
          }`}
          style={{
            width: `${barWidth}px`,
            height: `${Math.max(4, h * maxHeight)}px`,
            transform: isActive ? 'scaleY(1)' : 'scaleY(0.5)',
            opacity: isActive ? 1 : 0.6,
          }}
        />
      ))}
    </div>
  )
}

export default memo(AudioWaveform)
