import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import AudioPlayer from '@/components/AudioPlayer'
import { RecordingService } from '@/services/audio'
import { ChevronLeft, ChevronRight, Download, Loader2, X } from 'lucide-react'

export default function RecordingDetailModal({
  open,
  onOpenChange,
  recording,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  currentIndex,
  totalCount,
  onDownload,
}) {
  const [streamingUrl, setStreamingUrl] = useState(null)
  const [loadingUrl, setLoadingUrl] = useState(false)

  useEffect(() => {
    if (!recording?.key || !open) {
      setStreamingUrl(null)
      return
    }
    let active = true
    setLoadingUrl(true)
    setStreamingUrl(null)
    RecordingService.getStreamingUrl(recording.key)
      .then(url => {
        if (active) {
          setStreamingUrl(url)
          setLoadingUrl(false)
        }
      })
      .catch(() => {
        if (active) setLoadingUrl(false)
      })
    return () => {
      active = false
    }
  }, [recording?.key, open])

  if (!recording) return null

  const userName =
    recording.userName ||
    `${recording.userPrenom || ''} ${recording.userNom || ''}`.trim() ||
    'Utilisateur inconnu'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-start gap-2 flex-wrap">
            <DialogTitle className="text-base font-semibold truncate max-w-xs sm:max-w-sm flex-1">
              {recording.filename}
            </DialogTitle>
            <Badge
              variant={recording.userType === 'manager' ? 'secondary' : 'outline'}
              className="text-[10px] px-1.5 py-0 h-5 shrink-0 self-center"
            >
              {recording.userType === 'manager' ? 'Manager' : 'Commercial'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 shrink-0 ml-auto"
              onClick={() => onOpenChange?.(false)}
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {userName}
            {recording.date && (
              <span className="ml-2 text-muted-foreground/60">
                · {recording.date} {recording.time && `à ${recording.time}`}
              </span>
            )}
          </p>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4 flex-1">
          {loadingUrl && (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Préparation de la lecture...</span>
            </div>
          )}
          {!loadingUrl && streamingUrl && (
            <AudioPlayer
              src={streamingUrl}
              title={recording.filename}
              onDownload={() => onDownload?.(recording)}
            />
          )}
          {!loadingUrl && !streamingUrl && (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-muted-foreground text-center">
                L'URL de streaming n'est pas disponible pour cet enregistrement.
              </p>
            </div>
          )}

         <div className="grid w-fit grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t mx-auto justify-items-center">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Taille
              </p>
              <p className="text-sm font-medium">{recording.duration || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Date
              </p>
              <p className="text-sm font-medium">{recording.date || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Heure
              </p>
              <p className="text-sm font-medium">{recording.time || '—'}</p>
            </div>
            
          </div>
        </div>

        <div className="flex items-center justify-between border-t px-6 py-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevious}
              disabled={!hasPrevious}
              className="h-8 w-8 p-0"
              aria-label="Enregistrement précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground tabular-nums px-1">
              {(currentIndex ?? 0) + 1} / {totalCount ?? 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onNext}
              disabled={!hasNext}
              className="h-8 w-8 p-0"
              aria-label="Enregistrement suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload?.(recording)}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" />
            Télécharger
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
