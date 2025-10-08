import { useParams } from 'react-router-dom'
import DetailsPage from '@/components/DetailsPage'
import { useSimpleLoading } from '@/hooks/use-page-loading'
import { DetailsPageSkeleton } from '@/components/LoadingSkeletons'
import { useManager, useDirecteurs, useCommercials, useUpdateCommercial } from '@/services'
import { useRole } from '@/contexts/RoleContext'
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

export default function ManagerDetails() {
  const { id } = useParams()
  const loading = useSimpleLoading(1000)
  const { isAdmin } = useRole()
  const [assigningCommercial, setAssigningCommercial] = useState(null)
  
  // API hooks
  const { data: manager, loading: managerLoading, error, refetch } = useManager(parseInt(id))
  const { data: directeurs } = useDirecteurs()
  const { data: allCommercials, refetch: refetchCommercials } = useCommercials()
  const { mutate: updateCommercial, loading: updatingCommercial } = useUpdateCommercial()
  
  // Transformation des données API vers format UI
  const managerData = useMemo(() => {
    if (!manager) return null
    
    const directeur = directeurs?.find(d => d.id === manager.directeurId)
    const assignedCommercials = allCommercials?.filter(c => c.managerId === manager.id) || []
    
    return {
      ...manager,
      name: `${manager.prenom} ${manager.nom}`,
      directeur: directeur ? `${directeur.prenom} ${directeur.nom}` : 'Aucun directeur',
      email: manager.email || 'Non renseigné',
      phone: manager.numTelephone || 'Non renseigné',
      region: 'Non assignée',
      equipe_taille: assignedCommercials.length,
      status: 'actif',
      ca_equipe: '0 TND',
      objectif_equipe: '0 TND',
      date_promotion: new Date(manager.createdAt).toLocaleDateString('fr-FR'),
      address: 'Adresse non renseignée',
      commerciaux_actifs: assignedCommercials.length,
      clients_total: 0,
      taux_atteinte: '0%'
    }
  }, [manager, directeurs, allCommercials])

  // Gestion de l'assignation/désassignation
  const handleAssignCommercial = async (commercialId) => {
    setAssigningCommercial(commercialId)
    try {
      await updateCommercial({
        id: commercialId,
        managerId: manager.id,
      })
      await refetchCommercials()
      await refetch()
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error)
    } finally {
      setAssigningCommercial(null)
    }
  }

  const handleUnassignCommercial = async (commercialId) => {
    setAssigningCommercial(commercialId)
    try {
      await updateCommercial({
        id: commercialId,
        managerId: null,
      })
      await refetchCommercials()
      await refetch()
    } catch (error) {
      console.error('Erreur lors de la désassignation:', error)
    } finally {
      setAssigningCommercial(null)
    }
  }

  // Tableau des commerciaux pour les admins
  const renderCommercialsTable = () => {
    if (!isAdmin || !allCommercials) return null

    const assignedCommercials = allCommercials.filter(c => c.managerId === manager.id)
    const unassignedCommercials = allCommercials.filter(c => !c.managerId)

    return (
      <div className="space-y-6">
        {/* Commerciaux assignés */}
        <div>
          <h4 className="text-lg font-semibold mb-3">Commerciaux assignés ({assignedCommercials.length})</h4>
          {assignedCommercials.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedCommercials.map((commercial) => (
                  <TableRow key={commercial.id}>
                    <TableCell className="font-medium">
                      {commercial.prenom} {commercial.nom}
                    </TableCell>
                    <TableCell>{commercial.email || 'Non renseigné'}</TableCell>
                    <TableCell>{commercial.numTel || 'Non renseigné'}</TableCell>
                    <TableCell>{commercial.age} ans</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnassignCommercial(commercial.id)}
                        disabled={assigningCommercial === commercial.id || updatingCommercial}
                      >
                        {assigningCommercial === commercial.id ? 'Retrait...' : 'Retirer'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Aucun commercial assigné à ce manager
            </p>
          )}
        </div>

        {/* Commerciaux disponibles */}
        {unassignedCommercials.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold mb-3">Commerciaux disponibles ({unassignedCommercials.length})</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unassignedCommercials.map((commercial) => (
                  <TableRow key={commercial.id}>
                    <TableCell className="font-medium">
                      {commercial.prenom} {commercial.nom}
                    </TableCell>
                    <TableCell>{commercial.email || 'Non renseigné'}</TableCell>
                    <TableCell>{commercial.numTel || 'Non renseigné'}</TableCell>
                    <TableCell>{commercial.age} ans</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Non assigné</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAssignCommercial(commercial.id)}
                        disabled={assigningCommercial === commercial.id || updatingCommercial}
                      >
                        {assigningCommercial === commercial.id ? 'Assignation...' : 'Assigner'}
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

  if (loading || managerLoading) return <DetailsPageSkeleton />
  if (error) return <div className="text-red-500">Erreur: {error}</div>
  if (!managerData) return <div>Manager non trouvé</div>

  const personalInfo = [
    { label: 'Email', value: managerData.email, icon: 'mail' },
    { label: 'Téléphone', value: managerData.phone, icon: 'phone' },
    { label: 'Région', value: managerData.region, icon: 'mapPin' },
    { label: 'Directeur', value: managerData.directeur, icon: 'users' },
    { label: 'Date de création', value: managerData.date_promotion, icon: 'calendar' },
    { label: 'Adresse', value: managerData.address, icon: 'mapPin' },
  ]

  const statsCards = [
    {
      title: "CA de l'équipe",
      value: managerData.ca_equipe,
      description: `Objectif: ${managerData.objectif_equipe}`,
      icon: 'trendingUp',
      trend: { type: 'positive', value: '+8% vs mois dernier' },
    },
    {
      title: "Taille de l'équipe",
      value: managerData.equipe_taille,
      description: 'Commerciaux actifs',
      icon: 'users',
    },
    {
      title: 'Clients total',
      value: managerData.clients_total,
      description: "Portfolio de l'équipe",
      icon: 'users',
    },
    {
      title: "Taux d'atteinte",
      value: managerData.taux_atteinte,
      description: 'Performance équipe',
      icon: 'trendingUp',
    },
  ]

  const additionalSections = [
    {
      title: "Performance de l'équipe",
      description: 'CA mensuel des 6 derniers mois',
      type: 'list',
      items: [
        { label: 'Janvier 2024', value: '320 000 TND' },
        { label: 'Février 2024', value: '310 000 TND' },
        { label: 'Mars 2024', value: '335 000 TND' },
        { label: 'Avril 2024', value: '342 000 TND' },
        { label: 'Mai 2024', value: '358 000 TND' },
        { label: 'Juin 2024', value: '350 000 TND' },
      ],
    },
    {
      title: "Composition de l'équipe",
      description: 'Détails des commerciaux sous supervision',
      type: 'grid',
      items: [
        { label: 'Commerciaux seniors', value: '0' },
        { label: 'Commerciaux juniors', value: managerData.commerciaux_actifs },
        { label: 'En formation', value: '0' },
        { label: 'Top performer', value: 'N/A' },
      ],
    },
  ]

  // Ajouter la section d'assignation des commerciaux pour les admins
  if (isAdmin) {
    additionalSections.push({
      title: 'Gestion des commerciaux',
      description: 'Assignation et gestion des commerciaux de cette équipe',
      type: 'custom',
      render: () => renderCommercialsTable(),
    })
  }

  return (
    <DetailsPage
      title={managerData.name}
      subtitle={`Manager Régional - ${managerData.region}`}
      status={managerData.status}
      data={managerData}
      personalInfo={personalInfo}
      statsCards={statsCards}
      additionalSections={additionalSections}
      backUrl="/managers"
    />
  )
}