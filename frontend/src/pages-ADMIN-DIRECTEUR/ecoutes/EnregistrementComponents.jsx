import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronUp, ChevronDown, ChevronsUpDown, Download, CalendarDays, X } from 'lucide-react'

export function formatRelativeDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return "À l'instant"
  if (diffMin < 60) return `Il y a ${diffMin} min`
  if (diffHour < 24) return `Il y a ${diffHour}h`
  if (diffDay === 1) return 'Hier'
  if (diffDay < 7) return `Il y a ${diffDay} jours`

  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function UserAvatar({ prenom, nom, userType, size = 'md' }) {
  const initials = `${(prenom || '')[0] || ''}${(nom || '')[0] || ''}`.toUpperCase()
  const colorClass =
    userType === 'manager'
      ? 'bg-violet-500/15 text-violet-600'
      : 'bg-blue-500/15 text-blue-600'
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs'
  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold shrink-0 ${colorClass} ${sizeClass}`}
    >
      {initials}
    </div>
  )
}

export function RecordingStatusBadge({ lastModified }) {
  if (!lastModified) return null
  const diffMs = Date.now() - new Date(lastModified).getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = diffHours / 24

  if (diffHours < 24) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/10 text-green-600">
        Nouveau
      </span>
    )
  }
  if (diffDays < 7) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-600">
        Cette semaine
      </span>
    )
  }
  return null
}

export function RecordingCard({ recording, onPlay, onDownload }) {
  return (
    <div
      className="border border-border/60 rounded-xl p-3 hover:border-border hover:shadow-sm transition-all duration-200 cursor-pointer bg-card"
      onClick={() => onPlay?.(recording)}
    >
      <div className="flex items-start gap-2.5">
        <UserAvatar
          prenom={recording.userPrenom}
          nom={recording.userNom}
          userType={recording.userType}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-medium truncate">
              {recording.userName ||
                `${recording.userPrenom || ''} ${recording.userNom || ''}`.trim()}
            </span>
            <Badge
              variant={recording.userType === 'manager' ? 'secondary' : 'outline'}
              className="text-[10px] px-1.5 py-0 h-4 shrink-0"
            >
              {recording.userType === 'manager' ? 'Manager' : 'Commercial'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate mb-1">{recording.filename}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-muted-foreground/70">
              {formatRelativeDate(recording.lastModified)}
            </span>
            <span className="text-[10px] text-muted-foreground/50">·</span>
            <span className="text-[10px] text-muted-foreground/70">{recording.duration}</span>
            <RecordingStatusBadge lastModified={recording.lastModified} />
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0"
          onClick={e => {
            e.stopPropagation()
            onDownload?.(recording)
          }}
          aria-label="Télécharger"
        >
          <Download className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

export function SortableTableHeader({ label, sortKey, currentSort, onSort }) {
  const isActive = currentSort?.key === sortKey
  const direction = isActive ? currentSort.direction : null

  return (
    <button
      onClick={() => onSort?.(sortKey)}
      className="flex items-center gap-1 font-medium text-left hover:text-foreground transition-colors text-muted-foreground text-sm w-full"
    >
      {label}
      {!isActive && <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />}
      {isActive && direction === 'desc' && <ChevronDown className="w-3.5 h-3.5" />}
      {isActive && direction === 'asc' && <ChevronUp className="w-3.5 h-3.5" />}
    </button>
  )
}

export function DateRangeFilter({ dateFrom, dateTo, onDateFromChange, onDateToChange, onClear }) {
  const hasFilter = dateFrom || dateTo
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Période
      </span>
      <div className="flex items-center h-9 rounded-md border border-input bg-background">
        <div className="flex items-center pl-2.5 pr-1 text-muted-foreground">
          <CalendarDays className="w-3.5 h-3.5" />
        </div>
        <input
          type="date"
          value={dateFrom || ''}
          onChange={e => onDateFromChange(e.target.value || null)}
          className="h-full w-[120px] px-1.5 text-sm bg-transparent text-foreground focus:outline-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer relative"
        />
        <span className="text-xs text-muted-foreground/50 px-1">→</span>
        <input
          type="date"
          value={dateTo || ''}
          onChange={e => onDateToChange(e.target.value || null)}
          className="h-full w-[120px] px-1.5 text-sm bg-transparent text-foreground focus:outline-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer relative"
        />
        {hasFilter && (
          <button
            onClick={onClear}
            className="flex items-center justify-center w-7 h-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
