import React, { forwardRef } from 'react'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCommercialTheme } from '@/hooks/ui/use-commercial-theme'

const PorteListFilters = forwardRef(
  (
    {
      activeFilters,
      clearAllFilters,
      toggleFilter,
      statusCounts,
      statutOptions,
      immeuble,
      selectedFloor,
      statsData,
      totalPortes,
    },
    ref
  ) => {
    const { colors, base } = useCommercialTheme()

    return (
      <div ref={ref} className="mb-6 space-y-4">
        {/* Info Immeuble - Carte épurée */}
        <div
          className={`${base.bg.card} border ${base.border.default} rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colors.primary.bgLight}`}>
              <Building2 className={`h-5 w-5 ${colors.primary.text}`} />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${base.text.primary}`}>Vue d'ensemble</h3>
              {immeuble && (
                <p className={`text-xs ${base.text.muted}`}>
                  {selectedFloor ? `Étage ${selectedFloor} • ` : ''}
                  {immeuble.nbEtages} étages • {immeuble.nbPortesParEtage} portes/étage • Total:{' '}
                  {statsData ? statsData.totalPortes : totalPortes} portes
                </p>
              )}
            </div>
          </div>

          {/* Filtre global */}
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              Effacer les filtres
            </Button>
          )}
        </div>

        {/* Filtres par statut - Design pills horizontal scrollable */}
        <div className="space-y-2">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${base.text.muted} ml-1`}>
            Filtrer par statut
          </h3>
          <div className="flex flex-wrap gap-2">
            {/* Bouton "Tout voir" */}
            <button
              onClick={clearAllFilters}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                activeFilters.length === 0
                  ? `${colors.primary.bg} text-white border-transparent shadow-md`
                  : `${base.bg.card} ${base.text.muted} ${base.border.default} hover:border-gray-300`
              }`}
            >
              <span>Tout voir</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeFilters.length === 0 ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}
              >
                {statsData ? Math.max(0, statsData.totalPortes || 0) : totalPortes}
              </span>
            </button>

            {statutOptions
              .filter(
                option => option.value !== 'CONTRAT_SIGNE' && option.value !== 'NECESSITE_REPASSAGE'
              )
              .map(option => {
                const count = statusCounts.byStatus.get(option.value) || 0
                const isActive = activeFilters.includes(option.value)
                const IconComponent = option.icon

                return (
                  <button
                    key={option.value}
                    onClick={() => toggleFilter(option.value)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                      isActive
                        ? `${option.color} border-transparent shadow-sm ring-1 ring-offset-1 ring-gray-200 dark:ring-gray-800`
                        : `${base.bg.card} ${base.text.muted} ${base.border.default} hover:border-gray-300 opacity-70 hover:opacity-100`
                    }`}
                  >
                    <IconComponent className="h-3.5 w-3.5" />
                    <span>{option.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
          </div>
        </div>
      </div>
    )
  }
)

PorteListFilters.displayName = 'PorteListFilters'
export default PorteListFilters
