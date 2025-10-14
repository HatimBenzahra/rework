import { useParams } from 'react-router-dom'
import DetailsPage from '@/components/DetailsPage'
import { useSimpleLoading } from '@/hooks/use-page-loading'
import { DetailsPageSkeleton } from '@/components/LoadingSkeletons'
import { useDirecteur, useManagers, useUpdateManager, useZones } from '@/services'
import { useRole } from '@/contexts/RoleContext'
import { useErrorToast } from '@/hooks/use-error-toast'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function DirecteurDetails() {
  const { id } = useParams()
  const loading = useSimpleLoading(1000)
  const { isAdmin } = useRole()
  const { showError, showSuccess } = useErrorToast()
  const [assigningManager, setAssigningManager] = useState(null)

  // API hooks
  const { data: directeur, loading: directeurLoading, error, refetch } = useDirecteur(parseInt(id))
  const { data: allManagers, refetch: refetchManagers } = useManagers()
  const { mutate: updateManager, loading: updatingManager } = useUpdateManager()
  const { data: allZones } = useZones()

  // Transformation des données API vers format UI
  const directeurData = useMemo(() => {
    if (!directeur) return null

    const assignedManagers = allManagers?.filter(m => m.directeurId === directeur.id) || []

    return {
      ...directeur,
      name: `${directeur.prenom} ${directeur.nom}`,
      email: directeur.email || 'Non renseigné',
      phone: directeur.numTelephone || 'Non renseigné',
      division: 'Division régionale',
      managers_count: assignedManagers.length,
      commerciaux_count: 0, // À calculer si nécessaire
      status: 'actif',
      ca_division: '0 TND',
      objectif_division: '0 TND',
      date_nomination: new Date(directeur.createdAt).toLocaleDateString('fr-FR'),
      experience: '0 ans',
      address: directeur.adresse || 'Non renseignée',
      clients_total: 0,
      taux_atteinte: '0%',
    }
  }, [directeur, allManagers])

  // Récupérer les zones assignées à ce directeur
  const directeurZones = useMemo(() => {
    if (!allZones || !directeur) return []

    // DEBUG: Vérifier les zones
    console.log('🔍 DirecteurDetails - Toutes les zones:', allZones)
    console.log('👤 Directeur ID:', directeur.id)
    const filtered = allZones.filter(zone => zone.directeurId === directeur.id)
    console.log('🗺️ Zones filtrées pour ce directeur:', filtered)

    // Calculer le nombre d'immeubles par zone (pour l'instant 0, à implémenter si nécessaire)
    return filtered.map(zone => ({
      ...zone,
      immeublesCount: 0, // TODO: Calculer depuis les commerciaux de la zone
    }))
  }, [allZones, directeur])

  // Gestion de l'assignation/désassignation
  const handleAssignManager = async managerId => {
    setAssigningManager(managerId)
    try {
      await updateManager({
        id: managerId,
        directeurId: directeur.id,
      })
      await refetchManagers()
      await refetch()
      showSuccess('Manager assigné avec succès')
    } catch (error) {
      showError(error, 'DirecteurDetails.handleAssignManager')
    } finally {
      setAssigningManager(null)
    }
  }

  const handleUnassignManager = async managerId => {
    setAssigningManager(managerId)
    try {
      await updateManager({
        id: managerId,
        directeurId: null,
      })
      await refetchManagers()
      await refetch()
      showSuccess('Manager désassigné avec succès')
    } catch (error) {
      showError(error, 'DirecteurDetails.handleUnassignManager')
    } finally {
      setAssigningManager(null)
    }
  }

  // Tableau des managers pour les admins
  const renderManagersTable = () => {
    if (!isAdmin || !allManagers) return null

    const assignedManagers = allManagers.filter(m => m.directeurId === directeur.id)
    const unassignedManagers = allManagers.filter(m => !m.directeurId)

    return (
      <div className="space-y-6">
        {/* Managers assignés */}
        <div>
          <h4 className="text-lg font-semibold mb-3">
            Managers assignés ({assignedManagers.length})
          </h4>
          {assignedManagers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedManagers.map(manager => (
                  <TableRow key={manager.id}>
                    <TableCell className="font-medium">
                      {manager.prenom} {manager.nom}
                    </TableCell>
                    <TableCell>{manager.email || 'Non renseigné'}</TableCell>
                    <TableCell>{manager.numTelephone || 'Non renseigné'}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnassignManager(manager.id)}
                        disabled={assigningManager === manager.id || updatingManager}
                      >
                        {assigningManager === manager.id ? 'Retrait...' : 'Retirer'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Aucun manager assigné à ce directeur
            </p>
          )}
        </div>

        {/* Managers disponibles */}
        {unassignedManagers.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold mb-3">
              Managers disponibles ({unassignedManagers.length})
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unassignedManagers.map(manager => (
                  <TableRow key={manager.id}>
                    <TableCell className="font-medium">
                      {manager.prenom} {manager.nom}
                    </TableCell>
                    <TableCell>{manager.email || 'Non renseigné'}</TableCell>
                    <TableCell>{manager.numTelephone || 'Non renseigné'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Non assigné</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAssignManager(manager.id)}
                        disabled={assigningManager === manager.id || updatingManager}
                      >
                        {assigningManager === manager.id ? 'Assignation...' : 'Assigner'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    )
  }

  if (loading || directeurLoading) return <DetailsPageSkeleton />
  if (error) return <div className="text-red-500">Erreur: {error}</div>
  if (!directeurData) return <div>Directeur non trouvé</div>

  const personalInfo = [
    { label: 'Email', value: directeurData.email, icon: 'mail' },
    { label: 'Téléphone', value: directeurData.phone, icon: 'phone' },
    { label: 'Division', value: directeurData.division, icon: 'building' },
    { label: 'Date de nomination', value: directeurData.date_nomination, icon: 'calendar' },
    { label: 'Expérience', value: directeurData.experience, icon: 'calendar' },
    { label: 'Bureau', value: directeurData.address, icon: 'mapPin' },
  ]

  const statsCards = [
    {
      title: 'CA de la division',
      value: directeurData.ca_division,
      description: `Objectif: ${directeurData.objectif_division}`,
      icon: 'trendingUp',
      trend: { type: 'positive', value: '+15% vs année dernière' },
    },
    {
      title: 'Managers',
      value: directeurData.managers_count,
      description: 'Sous supervision',
      icon: 'users',
    },
    {
      title: 'Commerciaux',
      value: directeurData.commerciaux_count,
      description: 'Dans la division',
      icon: 'users',
    },
    {
      title: 'Clients total',
      value: directeurData.clients_total,
      description: 'Portfolio division',
      icon: 'users',
    },
    {
      title: "Taux d'atteinte",
      value: directeurData.taux_atteinte,
      description: 'Performance globale',
      icon: 'trendingUp',
    },
  ]

  const additionalSections = [
    {
      title: 'Performance de la division',
      description: 'CA trimestriel 2024',
      type: 'list',
      items: [
        { label: 'Q1 2024', value: '2 100 000 TND' },
        { label: 'Q2 2024', value: '2 350 000 TND' },
        { label: 'Q3 2024 (prévision)', value: '2 500 000 TND' },
        { label: 'Q4 2024 (objectif)', value: '2 600 000 TND' },
      ],
    },
    {
      title: 'Structure de la division',
      description: 'Organisation et effectifs',
      type: 'grid',
      items: [
        { label: 'Nombre de managers', value: directeurData.managers_count },
        { label: 'Nombre de commerciaux', value: directeurData.commerciaux_count },
        { label: 'Zones couvertes', value: '8' },
        { label: 'Taux de satisfaction', value: '92%' },
      ],
    },
  ]

  // Ajouter la section d'assignation des managers pour les admins
  if (isAdmin) {
    additionalSections.push({
      title: 'Gestion des managers',
      description: 'Assignation et gestion des managers de cette division',
      type: 'custom',
      render: () => renderManagersTable(),
    })
  }

  return (
    <DetailsPage
      title={directeurData.name}
      subtitle={`Directeur - ${directeurData.division}`}
      status={directeurData.status}
      data={directeurData}
      personalInfo={personalInfo}
      statsCards={statsCards}
      assignedZones={directeurZones}
      additionalSections={additionalSections}
      backUrl="/directeurs"
    />
  )
}
