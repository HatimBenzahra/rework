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
function AudioPlayer({ src, title, onDownload, className = '' }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)
    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('canplay', handleCanPlay)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('canplay', handleCanPlay)
    }
  }, [src])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
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
      className={`bg-card text-card-foreground border rounded-lg p-4 space-y-4 shadow-sm ${className}`}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-card-foreground truncate">{title}</h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        {onDownload && (
          <Button variant="outline" size="sm" onClick={onDownload} className="ml-2">
            <Download className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Waveform visualization */}
      <div className="flex items-center justify-center">
        <AudioWaveform
          isActive={isPlaying && !isLoading}
          intensity="voice"
          className="flex-1"
          barCount={60}
          maxHeight={40}
        />
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={togglePlay}
            disabled={isLoading || !src}
            className="h-10 w-10 p-0"
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
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={isMuted ? 0 : volume * 100}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      </div>
    </div>
  )
}

export default AudioPlayer
