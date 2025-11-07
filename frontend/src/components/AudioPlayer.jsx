import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Pause, Volume2, VolumeX, Download } from 'lucide-react'
import AudioWaveform from './AudioWaveform'

/**
 * AudioPlayer component for playing MP4 audio files
 * Props:
 * - src: string - URL of the audio file
 * - title: string - Title to display
 * - onDownload?: () => void - Download handler
 */
function AudioPlayer({ src, title, onDownload }) {
  const audioRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const containerRef = useRef(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(100)
  const [analyserReady, setAnalyserReady] = useState(false)
  const [waveformConfig, setWaveformConfig] = useState({
    barCount: 50,
    barWidth: 4,
    maxHeight: 48,
  })

  // Setup Web Audio API for real-time analysis
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)
    const handleLoadStart = () => {
      setIsLoading(true)
      setLoadingProgress(0)
    }
    const handleLoadedData = () => {
      setLoadingProgress(50)
    }
    const handleCanPlay = () => {
      setIsLoading(false)
      setLoadingProgress(100)
    }
    const handleCanPlayThrough = () => {
      setIsLoading(false)
      setLoadingProgress(100)
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('loadeddata', handleLoadedData)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('canplaythrough', handleCanPlayThrough)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('loadeddata', handleLoadedData)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('canplaythrough', handleCanPlayThrough)
    }
  }, [src])

  // Initialize Web Audio API context and analyser
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Create audio context and analyser only once
    if (!audioContextRef.current) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        audioContextRef.current = new AudioContext()
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 256
        analyserRef.current.smoothingTimeConstant = 0.7
        analyserRef.current.minDecibels = -90
        analyserRef.current.maxDecibels = -10

        // Create source and connect to analyser
        sourceRef.current = audioContextRef.current.createMediaElementSource(audio)
        sourceRef.current.connect(analyserRef.current)
        analyserRef.current.connect(audioContextRef.current.destination)

        console.log('🎵 Web Audio API initialized successfully')
        console.log(
          '📊 Analyser:',
          analyserRef.current.fftSize,
          'FFT size,',
          analyserRef.current.frequencyBinCount,
          'bins'
        )

        // Signal that analyser is ready
        setAnalyserReady(true)
      } catch (error) {
        console.error('❌ Error initializing Web Audio API:', error)
        setAnalyserReady(false)
      }
    }
  }, [])

  // Reset loading state when src changes
  useEffect(() => {
    if (src) {
      setIsLoading(true)
      setLoadingProgress(0)
      console.log('🔄 Nouvelle source audio - reset loading')

      // Simuler progression pendant 2 secondes puis débloquer
      const timer1 = setTimeout(() => setLoadingProgress(30), 200)
      const timer2 = setTimeout(() => setLoadingProgress(60), 800)
      const timer3 = setTimeout(() => {
        setLoadingProgress(100)
        setIsLoading(false)
        console.log('✅ Simulation loading terminée - 100%')
      }, 1500)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
      }
    }
  }, [src])

  // Handle responsive waveform configuration
  useEffect(() => {
    const updateWaveformConfig = () => {
      const width = window.innerWidth
      if (width < 640) {
        setWaveformConfig({ barCount: 30, barWidth: 3, maxHeight: 36 })
      } else if (width < 1024) {
        setWaveformConfig({ barCount: 50, barWidth: 4, maxHeight: 48 })
      } else {
        setWaveformConfig({ barCount: 70, barWidth: 4, maxHeight: 48 })
      }
    }

    updateWaveformConfig()
    window.addEventListener('resize', updateWaveformConfig)
    return () => window.removeEventListener('resize', updateWaveformConfig)
  }, [])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      try {
        // Resume audio context if suspended (important for Chrome autoplay policy)
        if (audioContextRef.current) {
          if (audioContextRef.current.state === 'suspended') {
            console.log('🔊 Resuming audio context...')
            await audioContextRef.current.resume()
          }
          console.log('🎵 Audio context state:', audioContextRef.current.state)
        }

        // Chargement intelligent - loadstart si pas encore chargé
        if (audio.readyState === 0) {
          audio.load()
        }
        await audio.play()
        setIsPlaying(true)
        console.log('▶️ Playing audio')
      } catch (error) {
        console.error('❌ Erreur lecture audio:', error)
        setIsPlaying(false)
      }
    }
  }

  const handleSeek = e => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = (e.target.value / 100) * duration
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = e => {
    const audio = audioRef.current
    const newVolume = e.target.value / 100
    setVolume(newVolume)
    if (audio) {
      audio.volume = newVolume
    }
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const formatTime = time => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className="bg-card text-card-foreground rounded-lg p-3 sm:p-4 space-y-3 w-full"
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        crossOrigin="anonymous"
        onError={e => console.error('Erreur audio element:', e.target.error)}
        onLoadStart={() => console.log('🔄 Début chargement audio')}
        onCanPlay={() => console.log('✅ Audio prêt à jouer')}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-card-foreground truncate text-sm sm:text-base">
            {title}
          </h4>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
            {isLoading && (
              <span className="text-blue-600 font-medium">• Chargement {loadingProgress}%</span>
            )}
          </div>
        </div>
        {onDownload && (
          <Button variant="outline" size="sm" onClick={onDownload} className="shrink-0">
            <Download className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Waveform visualization */}
      <div className="w-full overflow-hidden px-1">
        {analyserReady && analyserRef.current ? (
          <AudioWaveform
            key="real-waveform"
            isActive={isPlaying && !isLoading}
            analyserNode={analyserRef.current}
            className="w-full"
            barCount={waveformConfig.barCount}
            barWidth={waveformConfig.barWidth}
            gap={2}
            maxHeight={waveformConfig.maxHeight}
          />
        ) : (
          <AudioWaveform
            key="fallback-waveform"
            isActive={isPlaying && !isLoading}
            analyserNode={null}
            className="w-full"
            barCount={waveformConfig.barCount}
            barWidth={waveformConfig.barWidth}
            gap={2}
            maxHeight={waveformConfig.maxHeight}
          />
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={progress}
          onChange={handleSeek}
          disabled={isLoading || duration === 0}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={togglePlay}
            disabled={!src || loadingProgress < 100}
            className="h-9 w-9 p-0"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Volume control */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleMute} className="h-8 w-8 p-0">
            {isMuted || volume === 0 ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </Button>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={isMuted ? 0 : volume * 100}
            onChange={handleVolumeChange}
            className="w-16 sm:w-20 h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      </div>
    </div>
  )
}

export default AudioPlayer
