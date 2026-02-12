import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  SkipBack,
  SkipForward,
  Loader2,
} from 'lucide-react'
import WaveSurfer from 'wavesurfer.js'

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2]

function AudioPlayer({ src, title, onDownload }) {
  const waveformRef = useRef(null)
  const wsRef = useRef(null)
  const containerRef = useRef(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  useEffect(() => {
    if (!waveformRef.current || !src) return

    setIsLoading(true)
    setIsReady(false)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)

    // Canvas can't resolve CSS custom properties; convert theme oklch to hex
    function resolveColor(cssVar, fallback) {
      const probe = document.createElement('div')
      probe.style.cssText = `color: var(--${cssVar}); display:none;`
      document.documentElement.appendChild(probe)
      const resolved = getComputedStyle(probe).color
      probe.remove()
      return resolved && resolved !== '' ? resolved : fallback
    }
    const primary = resolveColor('primary', '#818cf8')
    const mutedFg = resolveColor('muted-foreground', 'rgba(160,160,160,0.5)')

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: mutedFg || 'rgba(160, 160, 160, 0.4)',
      progressColor: primary || '#818cf8',
      cursorColor: primary || '#818cf8',
      cursorWidth: 2,
      barWidth: 3,
      barGap: 1,
      barRadius: 2,
      height: 72,
      normalize: true,
      interact: true,
      dragToSeek: true,
      mediaControls: false,
      url: src,
    })

    ws.on('ready', (dur) => {
      setDuration(dur)
      setIsReady(true)
      setIsLoading(false)
      ws.setVolume(1)
    })

    ws.on('timeupdate', (time) => {
      setCurrentTime(time)
    })

    ws.on('play', () => setIsPlaying(true))
    ws.on('pause', () => setIsPlaying(false))
    ws.on('finish', () => setIsPlaying(false))

    ws.on('loading', (percent) => {
      if (percent < 100) setIsLoading(true)
    })

    ws.on('error', () => {
      setIsLoading(false)
      setIsReady(false)
    })

    wsRef.current = ws

    return () => {
      ws.destroy()
      wsRef.current = null
    }
  }, [src])

  const togglePlay = useCallback(() => {
    if (!wsRef.current || !isReady) return
    wsRef.current.playPause()
  }, [isReady])

  const skip = useCallback((seconds) => {
    if (!wsRef.current || !isReady) return
    wsRef.current.skip(seconds)
  }, [isReady])

  const cycleSpeed = useCallback(() => {
    if (!wsRef.current) return
    const currentIdx = SPEED_OPTIONS.indexOf(playbackSpeed)
    const nextIdx = (currentIdx + 1) % SPEED_OPTIONS.length
    const newSpeed = SPEED_OPTIONS[nextIdx]
    const wasPlaying = wsRef.current.isPlaying()
    const time = wsRef.current.getCurrentTime()
    if (wasPlaying) wsRef.current.pause()
    wsRef.current.setPlaybackRate(newSpeed, true)
    wsRef.current.setTime(time)
    setPlaybackSpeed(newSpeed)
    if (wasPlaying) wsRef.current.play()
  }, [playbackSpeed])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [togglePlay])

  const handleVolumeChange = useCallback((e) => {
    const val = e.target.value / 100
    setVolume(val)
    if (wsRef.current) wsRef.current.setVolume(val)
    if (val > 0) setIsMuted(false)
  }, [])

  const toggleMute = useCallback(() => {
    if (!wsRef.current) return
    const next = !isMuted
    setIsMuted(next)
    wsRef.current.setMuted(next)
  }, [isMuted])

  const formatTime = useCallback((time) => {
    if (!time || isNaN(time)) return '0:00'
    const m = Math.floor(time / 60)
    const s = Math.floor(time % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [])

  return (
    <div
      ref={containerRef}
      className="bg-card text-card-foreground rounded-lg p-3 sm:p-4 space-y-3 w-full"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-card-foreground truncate text-sm sm:text-base">
            {title}
          </h4>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
            {playbackSpeed !== 1 && (
              <span className="text-primary font-medium">{playbackSpeed}x</span>
            )}
          </div>
        </div>
        {onDownload && (
          <Button variant="outline" size="sm" onClick={onDownload} className="shrink-0">
            <Download className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Waveform */}
      <div className="w-full relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-card/60">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}
        <div ref={waveformRef} className="w-full" />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => skip(-10)}
            disabled={!isReady}
            className="h-8 w-8 p-0"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            onClick={togglePlay}
            disabled={!isReady}
            className="h-9 w-9 p-0"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => skip(10)}
            disabled={!isReady}
            className="h-8 w-8 p-0"
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={cycleSpeed}
            className="h-7 px-2 text-xs font-semibold tabular-nums ml-1"
          >
            {playbackSpeed}x
          </Button>
        </div>

        {/* Volume */}
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
