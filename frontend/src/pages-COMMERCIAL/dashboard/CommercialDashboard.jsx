import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  Building2,
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  Phone,
  History,
} from 'lucide-react'
import { useRole } from '@/contexts/RoleContext'
import { useCommercialFull } from '@/hooks/use-api'
import CommercialBottomBar from '@/components/CommercialBottomBar'
import CommercialHeader from '@/components/CommercialHeader'
import ImmeublesList from '@/pages-COMMERCIAL/immeubles/ImmeublesList'
import { useCommercialTheme } from '@/hooks/use-commercial-theme'

export default function CommercialDashboard({ initialTab = 'stats' }) {
  const { currentUserId } = useRole()
  const [activeTab, setActiveTab] = useState(initialTab)

  // Hook pour le thème commercial - centralise TOUS les styles
  const { colors, base, components, getButtonClasses } = useCommercialTheme()

  const { data: commercial, loading: commercialLoading } = useCommercialFull(
    parseInt(currentUserId)
  )

  // Utilise les statistiques déjà incluses dans le commercial
  // Prend la première statistique (ou dernière selon votre logique métier)
  const myStats = commercial?.statistics?.[0] || {
    contratsSignes: 0,
    immeublesVisites: 0,
    rendezVousPris: 0,
    refus: 0,
  }

  const navigationItems = [
    {
      id: 'stats',
      label: 'Mes Stats',
      icon: BarChart3,
      badge: myStats.contratsSignes,
    },
    {
      id: 'immeubles',
      label: 'Immeubles',
      icon: Building2,
      badge: commercial?.immeubles?.length || 0,
    },
    {
      id: 'historique',
      label: 'Historique',
      icon: History,
      badge: 0,
    },
  ]

  if (commercialLoading) {
    return (
      <div className={components.loading.container}>
        <div className="text-center">
          <div className={`${components.loading.spinner} mx-auto mb-4`}></div>
          <p className={components.loading.text}>Chargement...</p>
        </div>
      </div>
    )
  }

  const StatCard = ({ title, value, icon, trend }) => {
    const Icon = icon
    return (
      <Card className={`flex-1 min-w-0 ${base.bg.card} ${base.border.card}`}>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="space-y-1 flex-1 min-w-0">
              <p className={`text-xs ${base.text.muted}`}>{title}</p>
              <p className={`text-xl md:text-2xl font-bold ${base.text.primary}`}>{value}</p>
              {trend && (
                <div
                  className={`flex items-center text-xs ${trend > 0 ? colors.success.text : colors.danger.text}`}
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {trend > 0 ? '+' : ''}
                  {trend}%
                </div>
              )}
            </div>
            <div className="p-2 md:p-2.5 rounded-lg border border-gray-200 bg-gray-50 flex-shrink-0">
              <Icon className={`h-4 w-4 md:h-5 md:w-5 ${base.icon.default}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'stats':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                title="Contrats signés"
                value={myStats.contratsSignes}
                icon={CheckCircle2}
                trend={15}
              />
              <StatCard
                title="Immeubles visités"
                value={myStats.immeublesVisites}
                icon={Building2}
                trend={8}
              />
              <StatCard
                title="Rendez-vous pris"
                value={myStats.rendezVousPris}
                icon={Clock}
                trend={-3}
              />
              <StatCard
                title="Taux de refus"
                value={`${Math.round((myStats.refus / Math.max(myStats.immeublesVisites, 1)) * 100)}%`}
                icon={Target}
              />
            </div>

            <Card className={`${base.bg.card} ${base.border.card}`}>
              <CardHeader>
                <CardTitle className={`text-lg ${base.text.primary}`}>
                  Performance mensuelle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${base.text.secondary}`}>Objectif mensuel</span>
                    <Badge variant="outline" className={components.badge.outline}>
                      25 contrats
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${colors.primary.bg} h-2 rounded-full`}
                      style={{
                        width: `${Math.min((myStats.contratsSignes / 25) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <div className={`text-xs ${base.text.muted}`}>
                    {myStats.contratsSignes} / 25 contrats
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'immeubles':
        return <ImmeublesList />

      case 'historique':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className={`text-lg font-semibold ${base.text.primary}`}>
                Historique d'activité
              </h3>
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

            <Card className={`p-4 ${base.bg.card} ${base.border.card}`}>
              <div className="space-y-3">
                <h4 className={`font-medium text-sm ${base.text.primary}`}>Actions rapides</h4>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`justify-start ${getButtonClasses('outline')}`}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Appeler un prospect
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`justify-start ${getButtonClasses('outline')}`}
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Planifier une visite
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`justify-start ${getButtonClasses('outline')}`}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Programmer un rappel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={`flex flex-col h-screen ${base.bg.card} overflow-hidden`}>
      {/* Header optionnel */}
      <CommercialHeader commercial={commercial} showGreeting={true} stats={myStats} />

      {/* Content avec padding bottom pour la bottom bar */}
      <div className={`flex-1 overflow-y-auto ${base.bg.page} px-6 py-6 pb-24`}>
        {renderContent()}
      </div>

      {/* Bottom Navigation Bar */}
      <CommercialBottomBar
        navigationItems={navigationItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  )
}
