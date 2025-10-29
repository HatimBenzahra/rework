import { AdvancedDataTable } from '@/components/tableau'
import { TableSkeleton } from '@/components/LoadingSkeletons'
import {
  useManagers,
  useCreateManager,
  useUpdateManager,
  useRemoveManager,
  useDirecteurs,
} from '@/services'
import { useEntityPage } from '@/hooks/metier/useRoleBasedData'
import { useRole } from '@/contexts/userole'
import { useErrorToast } from '@/hooks/utils/use-error-toast'
import { useMemo } from 'react'
import { RANKS } from '@/share/ranks'
import { Card } from '@/components/ui/card'
import { calculateRank } from '@/share/ranks'

const getManagersColumns = isAdmin => {
  const baseColumns = [
    {
      header: 'Nom Prénom',
      accessor: 'name',
      sortable: true,
      className: 'font-medium',
    },
    {
      header: 'Rang',
      accessor: 'rankBadge',
      sortKey: 'points',
      sortable: true,
      className: 'hidden sm:table-cell',
    },
    {
      header: 'Email',
      accessor: 'email',
      className: 'hidden sm:table-cell',
    },
    {
      header: 'Téléphone',
      accessor: 'numTelephone',
      className: 'hidden md:table-cell',
    },
    {
      header: 'Directeur',
      accessor: 'directeur',
      sortable: true,
      className: 'hidden lg:table-cell',
    },
  ]

  return baseColumns
}

export default function Managers() {
  const { isAdmin, currentRole, currentUserId } = useRole()
  const { showError, showSuccess } = useErrorToast()
  // API hooks
  const {
    data: managersApi,
    loading: managersLoading,
    refetch,
  } = useManagers(parseInt(currentUserId, 10), currentRole)
  const { data: directeurs } = useDirecteurs(parseInt(currentUserId, 10), currentRole)
  const { mutate: createManager } = useCreateManager()
  const { mutate: updateManager } = useUpdateManager()
  const { mutate: removeManager } = useRemoveManager()

  // Utilisation du système de rôles pour filtrer les données
  const {
    data: filteredManagers,
    permissions,
    description,
  } = useEntityPage('managers', managersApi || [])
  // Préparation des données pour le tableau avec mapping API -> UI
  const tableData = useMemo(() => {
    if (!filteredManagers) return []
    return filteredManagers.map(manager => {
      const directeur = directeurs?.find(d => d.id === manager.directeurId)
      const { rank, points } = calculateRank(
        manager.statistics?.reduce((sum, stat) => sum + stat.contratsSignes, 0) || 0,
        manager.statistics?.reduce((sum, stat) => sum + stat.rendezVousPris, 0) || 0,
        manager.statistics?.reduce((sum, stat) => sum + stat.immeublesVisites, 0) || 0
      )
      return {
        ...manager,
        name: `${manager.prenom} ${manager.nom}`,
        email: manager.email || 'Non renseigné',
        numTelephone: manager.numTelephone || 'Non renseigné',
        directeur: directeur ? `${directeur.prenom} ${directeur.nom}` : 'Aucun directeur',
        rankBadge: (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${rank.bgColor} ${rank.textColor} ${rank.borderColor} border`}
          >
            <span>🏆</span>
            {rank.name}
            <span className="text-[10px] opacity-75">({points}pts)</span>
          </span>
        ),
        points,
      }
    })
  }, [filteredManagers, directeurs])

  // Options dynamiques pour les directeurs
  const directeurOptions = useMemo(() => {
    if (!directeurs) return []
    return directeurs.map(d => ({
      value: `${d.prenom} ${d.nom}`,
      label: `${d.prenom} ${d.nom}`,
    }))
  }, [directeurs])

  // Configuration des champs du modal d'édition
  const managersEditFields = useMemo(
    () => [
      {
        key: 'name',
        label: 'Nom complet',
        type: 'text',
        required: true,
        section: 'Informations personnelles',
      },
      {
        key: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        section: 'Informations personnelles',
        validate: value => {
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return 'Email invalide'
          }
        },
      },
      {
        key: 'phone',
        label: 'Téléphone',
        type: 'tel',
        required: true,
        section: 'Informations personnelles',
        placeholder: '+33 XX XXX XXX',
      },

      {
        key: 'directeur',
        label: 'Directeur',
        type: 'select',
        required: true,
        section: 'Affectation',
        options: directeurOptions,
      },
    ],
    [directeurOptions]
  )

  const handleAddManager = async formData => {
    try {
      // Conversion des données UI vers format API
      const [prenom, ...nomParts] = (formData.name || '').split(' ')
      const nom = nomParts.join(' ')

      const managerInput = {
        nom: nom || formData.nom || '',
        prenom: prenom || formData.prenom || '',
        email: formData.email || null,
        numTelephone: formData.phone || null,
        directeurId:
          formData.directeur && formData.directeur !== 'Aucun directeur'
            ? directeurs?.find(d => `${d.prenom} ${d.nom}` === formData.directeur)?.id
            : null,
      }

      await createManager(managerInput)
      await refetch()
      showSuccess('Manager créé avec succès')
    } catch (error) {
      showError(error, 'Managers.handleAddManager')
      throw error
    }
  }

  const handleEditManager = async editedData => {
    try {
      // Conversion des données UI vers format API
      const [prenom, ...nomParts] = (editedData.name || '').split(' ')
      const nom = nomParts.join(' ')

      const updateInput = {
        id: editedData.id,
        nom: nom || editedData.nom,
        prenom: prenom || editedData.prenom,
        email: editedData.email,
        numTelephone: editedData.phone,
        directeurId:
          editedData.directeur && editedData.directeur !== 'Aucun directeur'
            ? directeurs?.find(d => `${d.prenom} ${d.nom}` === editedData.directeur)?.id
            : null,
      }

      await updateManager(updateInput)
      await refetch()
      showSuccess('Manager modifié avec succès')
    } catch (error) {
      showError(error, 'Managers.handleEditManager')
      throw error
    }
  }

  const handleDeleteManager = async idOrRow => {
    try {
      const id = typeof idOrRow === 'object' ? idOrRow.id : idOrRow
      await removeManager(id)
      await refetch()
      showSuccess('Manager supprimé avec succès')
    } catch (error) {
      showError(error, 'Managers.handleDeleteManager')
      throw error
    }
  }

  if (managersLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Managers</h1>
          <p className="text-muted-foreground text-base">
            Gestion des managers régionaux et suivi de leurs équipes
          </p>
        </div>
        <TableSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Managers</h1>
        <p className="text-muted-foreground text-base">{description}</p>
      </div>
      {/* Section d'information sur le système de rangs */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              🏆 Système de Rangs
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Progression et paliers de performance basés sur les statistiques
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {RANKS.map(rank => (
              <div
                key={rank.name}
                className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${rank.bgColor} ${rank.textColor} ${rank.borderColor} border font-semibold text-sm`}
                >
                  {rank.name}
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {rank.maxPoints === Infinity
                    ? `${rank.minPoints}+ points`
                    : `${rank.minPoints} - ${rank.maxPoints} points`}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-semibold">Calcul des points:</span> Contrat signé (+50 pts) •
              Rendez-vous pris (+10 pts) • Immeuble visité (+5 pts)
            </p>
          </div>
        </div>
      </Card>

      <AdvancedDataTable
        showStatusColumn={false}
        title="Liste des Managers"
        description={description}
        data={tableData}
        columns={getManagersColumns(isAdmin)}
        searchKey="name"
        onAdd={permissions.canAdd ? handleAddManager : undefined}
        addButtonText="Nouveau Manager"
        detailsPath="/managers"
        editFields={managersEditFields}
        onEdit={permissions.canEdit ? handleEditManager : undefined}
        onDelete={permissions.canDelete ? handleDeleteManager : undefined}
      />
    </div>
  )
}
