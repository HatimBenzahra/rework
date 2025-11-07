import { useState, useEffect, useRef } from 'react'

/**
 * AudioWaveform
 * Props:
 * - isActive: boolean – active animation when true
 * - analyserNode: AnalyserNode | null – Web Audio API analyser for real-time audio data
 * - className: string – extra classes for the container
 * - barCount: number – number of bars (default 40 for responsive design)
 * - barWidth: number – width of each bar in px (default 4)
 * - gap: number – gap between bars in px (default 2)
 * - maxHeight: number – max bar height in px (default 48)
 */
function AudioWaveform({
  isActive = false,
  analyserNode = null,
  className = '',
  barCount = 40,
  barWidth = 4,
  gap = 2,
  maxHeight = 48,
}) {
  const [waveData, setWaveData] = useState(() => Array(barCount).fill(0.1))
  const rafRef = useRef(null)
  const idleTimeoutRef = useRef(null)
  const dataArrayRef = useRef(null)

  // Sync bars count if it changes
  useEffect(() => {
    setWaveData(Array(barCount).fill(0.1))
  }, [barCount])

  useEffect(() => {
    // Initialize data array for analyser
    if (analyserNode) {
      analyserNode.fftSize = 256
      analyserNode.smoothingTimeConstant = 0.7
      const bufferLength = analyserNode.frequencyBinCount
      dataArrayRef.current = new Uint8Array(bufferLength)
      console.log('🎵 Analyser initialized:', bufferLength, 'bins')
    }

    let frameCount = 0
    const generateRealAudio = () => {
      if (analyserNode && dataArrayRef.current && isActive) {
        analyserNode.getByteFrequencyData(dataArrayRef.current)

        // Debug log every 60 frames (~1 second)
        frameCount++
        if (frameCount % 60 === 0) {
          const sample = dataArrayRef.current.slice(0, 10)
          console.log(
            '🎵 Audio data sample:',
            sample,
            'avg:',
            Array.from(sample).reduce((a, b) => a + b, 0) / 10
          )
        }

        // Sample frequency data to match bar count
        const samplesPerBar = Math.floor(dataArrayRef.current.length / barCount)
        const newWaveData = Array(barCount)
          .fill(0)
          .map((_, i) => {
            const startIndex = i * samplesPerBar
            const endIndex = Math.min(startIndex + samplesPerBar, dataArrayRef.current.length)
            let sum = 0

            // Average the frequency data for this bar
            for (let j = startIndex; j < endIndex; j++) {
              sum += dataArrayRef.current[j]
            }

            const average = sum / (endIndex - startIndex)
            // Normalize to 0-1 range with better scaling
            const normalized = Math.min(1, average / 128) // Changed from 180 to 128
            return Math.max(0.1, normalized * 0.9 + 0.1) // Ensure minimum height
          })

        return newWaveData
      }

      // Fallback: simulated data when no analyser available or not active
      return Array(barCount)
        .fill(0)
        .map((_, i) => {
          if (!isActive) return 0.08 + Math.random() * 0.04
          const voice = Math.sin(Date.now() * 0.005 + i * 0.3) * 0.4
          const noise = Math.random() * 0.2
          const speech = Math.sin(Date.now() * 0.008 + i * 0.1) * 0.2
          return Math.max(0.1, (voice + noise + speech) * 0.7 + 0.15)
        })
    }

    const animate = () => {
      const newData = generateRealAudio()
      setWaveData(newData)
      rafRef.current = requestAnimationFrame(animate)
    }

    const subtle = () => {
      setWaveData(
        Array(barCount)
          .fill(0)
          .map(() => 0.08 + Math.random() * 0.04)
      )
      idleTimeoutRef.current = setTimeout(subtle, 200)
    }

    // Start proper loop
    if (isActive) {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current)
        idleTimeoutRef.current = null
      }
      console.log('🎬 Starting waveform animation, analyserNode:', !!analyserNode)
      animate()
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      subtle()
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current)
        idleTimeoutRef.current = null
      }
    }
  }, [isActive, analyserNode, barCount])

  return (
    <div
      className={`flex items-end justify-center w-full ${className}`}
      style={{ gap: `${gap}px`, height: `${maxHeight}px` }}
      role="img"
      aria-label={isActive ? 'Visualisation audio active' : 'Visualisation audio inactive'}
    >
      {waveData.map((h, i) => {
        const barHeight = Math.max(4, h * maxHeight)
        return (
          <div
            key={i}
            className={`rounded-full flex-shrink-0 ${
              isActive
                ? 'bg-gradient-to-t from-green-600 via-green-500 to-green-400'
                : 'bg-gradient-to-t from-gray-400 to-gray-300'
            }`}
            style={{
              width: `${barWidth}px`,
              height: `${isActive ? barHeight : barHeight * 0.5}px`,
              opacity: isActive ? 1 : 0.5,
              transition: 'opacity 0.2s ease-out',
            }}
          />
        )
      })}
    </div>
  )
}

// Export without memo to ensure updates on every state change
export default AudioWaveform
