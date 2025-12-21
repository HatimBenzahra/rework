import { useMemo } from 'react'
import { useDirecteurs, useUpdateDirecteur } from '@/services'
import { useEntityPage } from '@/hooks/metier/permissions/useRoleBasedData'
import { useErrorToast } from '@/hooks/utils/ui/use-error-toast'
import { useRole } from '@/contexts/userole'

export function useDirecteursLogic() {
  const { showError, showSuccess } = useErrorToast()
  const { isAdmin } = useRole()

  // API hooks
  const { data: directeursApi, loading: directeursLoading, refetch } = useDirecteurs()
  const { mutate: updateDirecteur } = useUpdateDirecteur()

  // Utilisation du système de rôles pour filtrer les données
  const {
    data: filteredDirecteurs,
    permissions,
    description,
  } = useEntityPage('directeurs', directeursApi || [])

  // Préparation des données pour le tableau avec mapping API → UI
  const tableData = useMemo(() => {
    if (!filteredDirecteurs) return []
    return filteredDirecteurs.map(directeur => ({
      ...directeur,
      nom: directeur.nom,
      prenom: directeur.prenom,
      email: directeur.email || 'Non renseigné',
      numTelephone: directeur.numTelephone || 'Non renseigné',
      adresse: directeur.adresse || 'Non renseignée',
    }))
  }, [filteredDirecteurs])

  // Définition des colonnes
  const columns = useMemo(() => [
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
      header: 'Email',
      accessor: 'email',
      sortable: true,
      className: 'hidden sm:table-cell',
    },
    {
      header: 'Téléphone',
      accessor: 'numTelephone',
      className: 'hidden md:table-cell',
    },
    {
      header: 'Adresse',
      accessor: 'adresse',
      className: 'hidden lg:table-cell',
    },
  ], [])

  // Configuration des champs du modal d'édition
  const directeursEditFields = useMemo(() => [
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
      key: 'numTelephone',
      label: 'Téléphone',
      type: 'tel',
      section: 'Informations personnelles',
      placeholder: '+33 XX XXX XXX',
    },
    {
      key: 'adresse',
      label: 'Adresse',
      type: 'textarea',
      section: 'Informations personnelles',
      fullWidth: true,
      placeholder: 'Adresse complète',
    },
  ], [])

  const handleEditDirecteur = async editedData => {
    try {
      const updateInput = {
        id: editedData.id,
        nom: editedData.nom,
        prenom: editedData.prenom,
        numTelephone: editedData.numTelephone,
        adresse: editedData.adresse,
      }

      await updateDirecteur(updateInput)
      await refetch()
      showSuccess('Directeur modifié avec succès')
    } catch (error) {
      showError(error, 'Directeurs.handleEditDirecteur')
      throw error
    }
  }

  return {
    tableData,
    columns,
    permissions,
    description,
    directeursLoading,
    directeursEditFields,
    handleEditDirecteur,
    isAdmin
  }
}
