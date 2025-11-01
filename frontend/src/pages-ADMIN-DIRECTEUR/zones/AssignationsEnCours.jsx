import { useMemo } from 'react'
import { useRole } from '@/contexts/userole'
import {
  useAllCurrentAssignments,
  useCommercials,
  useManagers,
  useDirecteurs,
} from '@/services'
import { AdvancedDataTable } from '@/components/tableau'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AssignationsEnCours() {
  const { currentRole, currentUserId } = useRole()

  // Charger les données
  const {
    data: rawAssignments,
    loading: assignmentsLoading,
    error: assignmentsError,
  } = useAllCurrentAssignments()

  const { data: commercials } = useCommercials(parseInt(currentUserId, 10), currentRole)
  const { data: managers } = useManagers(parseInt(currentUserId, 10), currentRole)
  const { data: directeurs } = useDirecteurs(parseInt(currentUserId, 10), currentRole)

  // Enrichir les données avec les noms des utilisateurs
  const enrichedAssignments = useMemo(() => {
    if (!rawAssignments) return []

    return rawAssignments.map(item => {
      // Trouver le nom de l'utilisateur selon son type
      let userName = `ID: ${item.userId}`

      if (item.userType === 'COMMERCIAL') {
        const commercial = commercials?.find(c => c.id === item.userId)
        if (commercial) userName = `${commercial.prenom} ${commercial.nom}`
      } else if (item.userType === 'MANAGER') {
        const manager = managers?.find(m => m.id === item.userId)
        if (manager) userName = `${manager.prenom} ${manager.nom}`
      } else if (item.userType === 'DIRECTEUR') {
        const directeur = directeurs?.find(d => d.id === item.userId)
        if (directeur) userName = `${directeur.prenom} ${directeur.nom}`
      }

      // Calculer le nombre de jours depuis l'assignation
      const daysSince = Math.ceil(
        (new Date() - new Date(item.assignedAt)) / (1000 * 60 * 60 * 24)
      )

      return {
        ...item,
        userName,
        zoneName: item.zone?.nom || 'N/A',
        daysSince,
      }
    })
  }, [rawAssignments, commercials, managers, directeurs])

  // Configuration des colonnes
  const columns = [
    {
      header: 'Zone',
      accessor: 'zoneName',
      sortable: true,
      className: 'font-medium',
    },
    {
      header: 'Utilisateur',
      accessor: 'userName',
      sortable: true,
    },
    {
      header: 'Type',
      accessor: 'userType',
      sortable: true,
      cell: row => {
        const variant =
          row.userType === 'DIRECTEUR'
            ? 'default'
            : row.userType === 'MANAGER'
              ? 'secondary'
              : 'outline'
        return <Badge variant={variant}>{row.userType}</Badge>
      },
    },
    {
      header: "Date d'assignation",
      accessor: 'assignedAt',
      sortable: true,
      cell: row => new Date(row.assignedAt).toLocaleDateString('fr-FR'),
    },
    {
      header: 'Depuis',
      accessor: 'daysSince',
      sortable: true,
      className: 'hidden md:table-cell text-center',
      cell: row => (
        <Badge className="bg-blue-100 text-blue-800">
          {row.daysSince} jour{row.daysSince > 1 ? 's' : ''}
        </Badge>
      ),
    },
    {
      header: 'Rayon',
      accessor: 'rayon',
      sortable: true,
      className: 'hidden lg:table-cell text-center',
      cell: row =>
        row.zone?.rayon ? `${(row.zone.rayon / 1000).toFixed(1)} km` : 'N/A',
    },
    {
      header: 'Coordonnées',
      accessor: 'coordinates',
      className: 'hidden xl:table-cell',
      cell: row => {
        if (row.zone?.xOrigin && row.zone?.yOrigin) {
          return `${row.zone.yOrigin.toFixed(2)}°N, ${row.zone.xOrigin.toFixed(2)}°E`
        }
        return 'N/A'
      },
    },
  ]

  if (assignmentsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assignations en Cours</CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (assignmentsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assignations en Cours</CardTitle>
          <CardDescription className="text-red-500">
            Erreur lors du chargement : {assignmentsError}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <AdvancedDataTable
        showStatusColumn={false}
        title="Assignations en Cours"
        description="Toutes les zones actuellement assignées aux utilisateurs"
        data={enrichedAssignments}
        columns={columns}
        searchKey="zoneName"
        itemsPerPage={15}
        detailsPath="/zones"
      />
    </div>
  )
}
