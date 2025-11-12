import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatsCard } from '@/components/card'
import CommercialRankingTable from '@/components/CommercialRankingTable'
import ActiveZonesSlider_Dashboard from '@/components/ActiveZonesSlider_Dashboard'
import { Pagination } from '@/components/Pagination'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Building2,
  Users,
  Trophy,
  MapPin,
  TrendingUp,
  Calendar,
  ArrowRight,
  Award,
  Target,
  Activity,
  DoorOpen,
} from 'lucide-react'
import {
  useCommercials,
  useManagers,
  useDirecteurs,
  useStatistics,
  useImmeubles,
  useAllCurrentAssignments,
  usePortesModifiedToday,
  usePortesRdvToday,
} from '@/hooks/metier/use-api'
import { Skeleton } from '@/components/ui/skeleton'

export default function Dashboard() {
  const navigate = useNavigate()

  // État de pagination pour les rendez-vous
  const [currentRdvPage, setCurrentRdvPage] = useState(1)
  const ITEMS_PER_PAGE = 4

  // Chargement des données
  const { data: commercials, loading: loadingCommercials } = useCommercials()
  const { data: managers, loading: loadingManagers } = useManagers()
  const { data: directeurs, loading: loadingDirecteurs } = useDirecteurs()
  const { data: statistics, loading: loadingStats } = useStatistics()
  const { data: immeubles, loading: loadingImmeubles } = useImmeubles()
  const { data: assignments, loading: loadingAssignments } = useAllCurrentAssignments()
  const { data: portesModifiedToday, loading: loadingPortesModified } = usePortesModifiedToday()
  const { data: rdvToday, loading: loadingRdvToday } = usePortesRdvToday()

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  // Calcul des stats à partir des portes modifiées aujourd'hui
  const totals = useMemo(() => {
    if (!portesModifiedToday) return { contrats: 0, rdv: 0, refus: 0, portes: 0, immeubles: 0 }

    const stats = {
      contrats: 0,
      rdv: 0,
      refus: 0,
      portes: portesModifiedToday.length,
      immeubles: 0,
    }

    // Compter par statut
    portesModifiedToday.forEach(porte => {
      if (porte.statut === 'CONTRAT_SIGNE') stats.contrats++
      else if (porte.statut === 'RENDEZ_VOUS_PRIS') stats.rdv++
      else if (porte.statut === 'REFUS') stats.refus++
    })

    // Compter le nombre d'immeubles uniques
    const immeubleIds = new Set(portesModifiedToday.map(p => p.immeubleId))
    stats.immeubles = immeubleIds.size

    return stats
  }, [portesModifiedToday])

  const tauxConversion =
    totals.contrats + totals.rdv + totals.refus > 0
      ? `${Math.round((totals.contrats / (totals.contrats + totals.rdv + totals.refus)) * 100)}%`
      : '0%'

  // Pagination des rendez-vous
  const paginatedRdv = useMemo(() => {
    if (!rdvToday) return { items: [], totalPages: 0, startIndex: 0, endIndex: 0 }

    const startIndex = (currentRdvPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    const items = rdvToday.slice(startIndex, endIndex)
    const totalPages = Math.ceil(rdvToday.length / ITEMS_PER_PAGE)

    return { items, totalPages, startIndex, endIndex }
  }, [rdvToday, currentRdvPage])

  const isLoading =
    loadingCommercials ||
    loadingManagers ||
    loadingDirecteurs ||
    loadingStats ||
    loadingImmeubles ||
    loadingAssignments ||
    loadingPortesModified ||
    loadingRdvToday

  if (isLoading)
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )

  return (
    <div className="flex flex-col gap-8 animate-in fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground">Aperçu des performances du jour</p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-5 w-5" />
          <span className="text-sm font-medium">
            {today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Statistiques du jour
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* STATS DU JOUR */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
            <StatsCard
              title="Immeubles prospectés"
              value={totals.immeubles}
              description="Visites effectuées"
              icon={<Building2 />}
            />
            <StatsCard
              title="Contrats signés"
              value={totals.contrats}
              description="Signatures du jour"
              icon={<Trophy />}
              variant="success"
            />
            <StatsCard
              title="Rendez-vous pris"
              value={totals.rdv}
              description="Planifiés aujourd'hui"
              icon={<Calendar />}
            />
            <StatsCard
              title="Portes prospectées"
              value={totals.portes}
              description="Portes visitées"
              icon={<DoorOpen />}
            />
            <StatsCard
              title="Taux de conversion"
              value={tauxConversion}
              description="Succès / Total contacts"
              icon={<TrendingUp />}
              variant={parseInt(tauxConversion) >= 20 ? 'success' : 'warning'}
            />
          </div>
          {/* RENDEZ-VOUS D'AUJOURD'HUI */}
          {rdvToday && rdvToday.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Rendez-vous d'aujourd'hui
                </CardTitle>
                <CardDescription>
                  {rdvToday.length} rendez-vous prévu{rdvToday.length > 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paginatedRdv.items.map(porte => {
                    const immeuble = immeubles?.find(imm => imm.id === porte.immeubleId)
                    return (
                      <div
                        key={porte.id}
                        onClick={() => navigate(`/immeubles/${porte.immeubleId}`)}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-500" />
                            </div>{' '}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-base text-primary">
                              {immeuble?.adresse}
                            </span>
                            <span className="text-xs text-muted-foreground mt-1">
                              Porte {porte.numero} - Étage {porte.etage}
                              {porte.nomPersonnalise && ` (${porte.nomPersonnalise})`}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {porte.rdvTime || 'Heure non définie'}
                            </span>
                          </div>
                          {porte.commentaire && (
                            <span className="text-xs text-muted-foreground max-w-[200px] truncate">
                              {porte.commentaire}
                            </span>
                          )}
                          <Button variant="ghost" size="sm" className="mt-1">
                            Voir détails
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <Pagination
                  currentPage={currentRdvPage}
                  totalPages={paginatedRdv.totalPages}
                  startIndex={paginatedRdv.startIndex}
                  endIndex={paginatedRdv.endIndex}
                  totalItems={rdvToday.length}
                  itemLabel="rendez-vous"
                  onPrevious={() => setCurrentRdvPage(prev => Math.max(1, prev - 1))}
                  onNext={() =>
                    setCurrentRdvPage(prev => Math.min(paginatedRdv.totalPages, prev + 1))
                  }
                  hasPreviousPage={currentRdvPage > 1}
                  hasNextPage={currentRdvPage < paginatedRdv.totalPages}
                />
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
      {/* ZONES EN COURS */}
      <ActiveZonesSlider_Dashboard assignments={assignments || []} />

      {/* ACCÈS RAPIDES */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Accès rapides
          </CardTitle>
          <CardDescription>Navigation vers les sections principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: 'Commerciaux',
                icon: Users,
                path: '/commerciaux',
                info: `${commercials?.length || 0}`,
              },
              {
                label: 'Managers',
                icon: Award,
                path: '/managers',
                info: `${managers?.length || 0}`,
              },
              {
                label: 'Zones',
                icon: MapPin,
                path: '/zones',
                info: `${assignments?.length || 0}`,
              },
              {
                label: 'Immeubles',
                icon: Building2,
                path: '/immeubles',
                info: `${immeubles?.length || 0}`,
              },
              {
                label: 'Statistiques',
                icon: TrendingUp,
                path: '/statistiques',
                info: 'Performances détaillées',
              },
              {
                label: 'Historique zones',
                icon: Calendar,
                path: '/zones/historique',
                info: 'Historique des zones',
              },
              {
                label: 'Directeurs',
                icon: Trophy,
                path: '/directeurs',
                info: `${directeurs?.length || 0}`,
              },
              {
                label: 'Gestion',
                icon: Target,
                path: '/gestion',
                info: 'Gestion globale',
              },
            ].map(({ label, icon: Icon, path, info }) => (
              <Button
                key={label}
                variant="outline"
                className="h-auto py-4 flex flex-col items-start gap-2 transition hover:scale-[1.01]"
                onClick={() => navigate(path)}
              >
                <div className="flex items-center gap-2 w-full">
                  {Icon && <Icon className="h-5 w-5 text-primary" />}
                  <span className="font-semibold">{label}</span>
                </div>
                <span className="text-xs text-muted-foreground">{info}</span>
                <ArrowRight className="h-4 w-4 ml-auto opacity-70" />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CLASSEMENT */}
      <CommercialRankingTable
        commercials={commercials || []}
        directeurs={directeurs || []}
        managers={managers || []}
        statistics={statistics || []}
        currentUserRole="admin"
        title="Top Performers"
        description="Classement général des meilleures performances"
        limit={5}
      />
    </div>
  )
}
