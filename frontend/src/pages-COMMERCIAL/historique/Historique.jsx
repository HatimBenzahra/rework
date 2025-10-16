import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCommercialTheme } from '@/hooks/use-commercial-theme'

/**
 * Page Historique - Affiche l'historique d'activité du commercial
 * Utilise le contexte du layout parent (CommercialLayout)
 */
export default function Historique() {
  const { colors, base, components } = useCommercialTheme()

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold ${base.text.primary}`}>Historique d'activité</h1>
          <p className={base.text.muted}>Retrouvez toutes vos actions récentes</p>
        </div>
        <Badge variant="outline" className={components.badge.outline}>
          Récent
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Exemple d'historique - à remplacer par vraies données */}
        <Card className={`p-4 ${base.bg.card} ${base.border.card}`}>
          <div className="flex items-start space-x-3">
            <div className={`w-2 h-2 ${colors.success.bg} rounded-full mt-2`}></div>
            <div className="flex-1">
              <p className={`font-medium text-sm ${base.text.primary}`}>
                Contrat signé - Immeuble Maarif
              </p>
              <p className={`text-xs ${base.text.muted}`}>Il y a 2 heures</p>
            </div>
          </div>
        </Card>

        <Card className={`p-4 ${base.bg.card} ${base.border.card}`}>
          <div className="flex items-start space-x-3">
            <div className={`w-2 h-2 ${colors.primary.bg} rounded-full mt-2`}></div>
            <div className="flex-1">
              <p className={`font-medium text-sm ${base.text.primary}`}>
                Visite effectuée - Zone Centre
              </p>
              <p className={`text-xs ${base.text.muted}`}>Il y a 4 heures</p>
            </div>
          </div>
        </Card>

        <Card className={`p-4 ${base.bg.card} ${base.border.card}`}>
          <div className="flex items-start space-x-3">
            <div className={`w-2 h-2 ${colors.warning.bg} rounded-full mt-2`}></div>
            <div className="flex-1">
              <p className={`font-medium text-sm ${base.text.primary}`}>
                Rendez-vous planifié - Secteur Nord
              </p>
              <p className={`text-xs ${base.text.muted}`}>Hier à 14h30</p>
            </div>
          </div>
        </Card>

        <Card className={`p-4 ${base.bg.card} ${base.border.card}`}>
          <div className="flex items-start space-x-3">
            <div className={`w-2 h-2 ${colors.neutral.bg} rounded-full mt-2`}></div>
            <div className="flex-1">
              <p className={`font-medium text-sm ${base.text.primary}`}>
                Prospection terminée - Zone Est
              </p>
              <p className={`text-xs ${base.text.muted}`}>Hier à 10h15</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
