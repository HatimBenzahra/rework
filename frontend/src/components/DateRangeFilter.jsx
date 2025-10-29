import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Filter } from 'lucide-react'

export default function DateRangeFilter({
  startDate,
  endDate,
  appliedStartDate,
  appliedEndDate,
  onChangeStart,
  onChangeEnd,
  onApply,
  onReset,
  className = '',
  title = 'Filtres de période',
}) {
  const hasAnyValue = Boolean(startDate || endDate || appliedStartDate || appliedEndDate)

  return (
    <Card className={`border-2 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="start-date" className="text-sm font-medium">
                Date de début
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={e => onChangeStart?.(e.target.value)}
                max={endDate || new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="end-date" className="text-sm font-medium">
                Date de fin
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={e => onChangeEnd?.(e.target.value)}
                min={startDate || undefined}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-primary">
              {appliedStartDate || appliedEndDate ? (
                <span>
                  Période sélectionnée:{' '}
                  <span className="font-medium">
                    {appliedStartDate
                      ? new Date(appliedStartDate).toLocaleDateString('fr-FR')
                      : 'Début'}{' '}
                    -{' '}
                    {appliedEndDate ? new Date(appliedEndDate).toLocaleDateString('fr-FR') : 'Fin'}
                  </span>
                </span>
              ) : (
                <span>Toutes les périodes</span>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onReset} disabled={!hasAnyValue}>
                Réinitialiser
              </Button>
              <Button size="sm" onClick={onApply} disabled={!startDate && !endDate}>
                Valider
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
