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
import { useCommercialFull, useStatistics } from '@/hooks/use-api'
import { useCommercialTheme } from '@/hooks/use-commercial-theme'
import CommercialBottomBar from '@/components/CommercialBottomBar'
import CommercialHeader from '@/components/CommercialHeader'
import ImmeublesList from '@/pages-COMMERCIAL/immeubles/ImmeublesList'

export default function CommercialDashboard() {
  const { currentUserId } = useRole()
  const { getCardClasses } = useCommercialTheme()
  const [activeTab, setActiveTab] = useState('stats')

  const { data: commercial, loading: commercialLoading } = useCommercialFull(
    parseInt(currentUserId)
  )

  const { data: allStatistics } = useStatistics()

  const myStats = allStatistics?.find(stat => stat.commercialId === parseInt(currentUserId)) || {
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
      <div className="flex-1 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  const StatCard = ({ title, value, icon, trend, type = 'visits' }) => {
    const Icon = icon
    return (
      <Card className="flex-1 min-w-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {trend && (
                <div
                  className={`flex items-center text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {trend > 0 ? '+' : ''}
                  {trend}%
                </div>
              )}
            </div>
            <div className={`p-2 rounded-lg ${getCardClasses(type)}`}>
              <Icon className="w-5 h-5" />
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
                type="contracts"
              />
              <StatCard
                title="Immeubles visités"
                value={myStats.immeublesVisites}
                icon={Building2}
                trend={8}
                type="visits"
              />
              <StatCard
                title="Rendez-vous pris"
                value={myStats.rendezVousPris}
                icon={Clock}
                trend={-3}
                type="appointments"
              />
              <StatCard
                title="Taux de refus"
                value={`${Math.round((myStats.refus / Math.max(myStats.immeublesVisites, 1)) * 100)}%`}
                icon={Target}
                type="refusals"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance mensuelle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Objectif mensuel</span>
                    <Badge variant="outline">25 contrats</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${Math.min((myStats.contratsSignes / 25) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground">
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
              <h3 className="text-lg font-semibold">Historique d'activité</h3>
              <Badge variant="outline">Récent</Badge>
            </div>

            <div className="space-y-3">
              {/* Exemple d'historique - à remplacer par vraies données */}
              <Card className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Contrat signé - Immeuble Maarif</p>
                    <p className="text-xs text-muted-foreground">Il y a 2 heures</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Visite effectuée - Zone Centre</p>
                    <p className="text-xs text-muted-foreground">Il y a 4 heures</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Rendez-vous planifié - Secteur Nord</p>
                    <p className="text-xs text-muted-foreground">Hier à 14h30</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Prospection terminée - Zone Est</p>
                    <p className="text-xs text-muted-foreground">Hier à 10h15</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-4">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Actions rapides</h4>
                <div className="grid grid-cols-1 gap-2">
                  <Button variant="outline" size="sm" className="justify-start">
                    <Phone className="w-4 h-4 mr-2" />
                    Appeler un prospect
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    <Building2 className="w-4 h-4 mr-2" />
                    Planifier une visite
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header optionnel */}
      <CommercialHeader commercial={commercial} showGreeting={true} stats={myStats} />

      {/* Content avec padding bottom pour la bottom bar */}
      <div className="flex-1 overflow-auto px-6 py-6 pb-28">{renderContent()}</div>

      {/* Bottom Navigation Bar */}
      <CommercialBottomBar
        navigationItems={navigationItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  )
}
