import { useMemo } from 'react'
import { useCommercials, useUpdateCommercial, useManagers, useDirecteurs } from '@/services'
import { useRole } from '@/contexts/userole'
import { useEntityPermissions, useEntityDescription } from '@/hooks/metier/permissions/useRoleBasedData'
import { useErrorToast } from '@/hooks/utils/ui/use-error-toast'
import { calculateRank } from '@/share/ranks'

const getCommerciauxColumns = (isAdmin, isDirecteur) => {
  const baseColumns = [
    {
      header: 'Nom',
      accessor: 'nom',
      sortable: true,
      className: 'font-medium',
    },
    {
      header: 'Prénom',
      accessor: 'prenom',
      sortable: true,
      className: 'font-medium',
    },
    {
      header: 'Rang',
      accessor: 'rankBadge',
      sortable: false,
      className: 'hidden sm:table-cell',
    },
    {
      header: 'Email',
      accessor: 'email',
      sortable: true,
      className: 'hidden md:table-cell',
    },
    {
      header: 'Téléphone',
      accessor: 'numTel',
      className: 'hidden lg:table-cell',
    },
  ]

  // Colonne Manager: visible pour Admin et Directeur seulement
  if (isAdmin || isDirecteur) {
    baseColumns.push({
      header: 'Manager',
      accessor: 'managerName',
      sortable: true,
      className: 'hidden lg:table-cell',
    })
  }

  // Colonne Directeur: visible pour Admin seulement
  if (isAdmin) {
    baseColumns.push({
      header: 'Directeur',
      accessor: 'directeurName',
      sortable: true,
      className: 'hidden xl:table-cell',
    })
  }

  return baseColumns
}

export function useCommerciauxLogic() {
  const { isAdmin, isDirecteur } = useRole()
  const { data: commercials, loading, error, refetch } = useCommercials()
  const { data: managers } = useManagers()
  const { data: directeurs } = useDirecteurs()
  const { mutate: updateCommercial, loading: updating } = useUpdateCommercial()
  const { showError, showSuccess } = useErrorToast()

  // Les données sont déjà filtrées côté serveur
  const filteredCommercials = useMemo(() => commercials || [], [commercials])

  // Récupération des permissions et description
  const permissions = useEntityPermissions('commerciaux')
  const description = useEntityDescription('commerciaux')
  const columns = useMemo(() => getCommerciauxColumns(isAdmin, isDirecteur), [isAdmin, isDirecteur])

  // Préparer les données pour le tableau
  const tableData = useMemo(() => {
    if (!filteredCommercials) return []

    return filteredCommercials.map(commercial => {
      // Trouver le nom du manager
      const manager = managers?.find(m => m.id === commercial.managerId)
      const managerName = manager ? `${manager.prenom} ${manager.nom}` : 'N/A'

      // Trouver le nom du directeur
      const directeur = directeurs?.find(d => d.id === commercial.directeurId)
      const directeurName = directeur ? `${directeur.prenom} ${directeur.nom}` : 'N/A'

      // Calculer les statistiques totales
      const totalStatistics = commercial.statistics || []
      const totalContratsSignes = totalStatistics.reduce(
        (sum, stat) => sum + stat.contratsSignes,
        0
      )
      const totalImmeublesVisites = totalStatistics.reduce(
        (sum, stat) => sum + stat.immeublesVisites,
        0
      )
      const totalRendezVousPris = totalStatistics.reduce(
        (sum, stat) => sum + stat.rendezVousPris,
        0
      )

      // Calculer le rang basé sur les statistiques réelles
      const { rank, points } = calculateRank(
        totalContratsSignes,
        totalRendezVousPris,
        totalImmeublesVisites
      )

      // Créer le badge de rang
      const rankBadge = (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${rank.bgColor} ${rank.textColor} ${rank.borderColor} border`}
        >
          <span>🏆</span>
          {rank.name}
          <span className="text-[10px] opacity-75">({points}pts)</span>
        </span>
      )

      return {
        ...commercial,
        nom: commercial.nom,
        prenom: commercial.prenom,
        columns,
        rankBadge,
        managerName,
        directeurName,
        createdAt: new Date(commercial.createdAt).toLocaleDateString('fr-FR'),
      }
    })
  }, [filteredCommercials, managers, directeurs, columns])

  // Préparer les options pour les formulaires
  const managerOptions = useMemo(() => {
    if (!managers) return []
    return managers.map(manager => ({
      value: manager.id,
      label: `${manager.prenom} ${manager.nom}`,
    }))
  }, [managers])

  // Configuration des champs du modal d'édition
  const commerciauxEditFields = [
    {
      key: 'nom',
      label: 'Nom',
      type: 'text',
      required: true,
      section: 'Informations personnelles',
    },
    {
      key: 'prenom',
      label: 'Prénom',
      type: 'text',
      required: true,
      section: 'Informations personnelles',
    },
    {
      key: 'numTel',
      label: 'Téléphone',
      type: 'tel',
      required: true,
      section: 'Informations personnelles',
      placeholder: '+33 XX XXX XXX',
    },
    {
      key: 'age',
      label: 'Age',
      type: 'number',
      required: true,
      section: 'Informations personnelles',
      min: 18,
      max: 65,
    },
    {
      key: 'managerId',
      label: 'Manager',
      type: 'select',
      section: 'Affectation',
      options: managerOptions,
    },
  ]

  const handleEditCommercial = async editedData => {
    try {
      await updateCommercial({
        id: editedData.id,
        nom: editedData.nom,
        prenom: editedData.prenom,
        numTel: editedData.numTel,
        age: editedData.age ? parseInt(editedData.age) : undefined,
        managerId: editedData.managerId ? parseInt(editedData.managerId) : undefined,
      })
      await refetch()
      showSuccess('Commercial modifié avec succès')
    } catch (error) {
      showError(error, 'Commerciaux.handleEditCommercial')
      throw error
    }
  }

  return {
    tableData,
    columns,
    permissions,
    description,
    loading,
    error,
    updating,
    refetch,
    commerciauxEditFields,
    handleEditCommercial,
  }
}
