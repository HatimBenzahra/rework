import { useState, useMemo, useEffect } from 'react'
import {
  useImmeubles,
  useUpdateImmeuble,
  useRemoveImmeuble,
  useCommercials,
  useManagers,
} from '@/services'
import {
  useEntityPermissions,
  useEntityDescription,
} from '@/hooks/metier/permissions/useRoleBasedData'
import { useErrorToast } from '@/hooks/utils/ui/use-error-toast'

export function useImmeublesLogic() {
  const { showError, showSuccess } = useErrorToast()
  const [viewMode, setViewMode] = useState('list')
  const [dateFilterMode, setDateFilterMode] = useState('updatedAt_desc')
  const [filterCommercial, setFilterCommercial] = useState('all')
  const [createdDate, setCreatedDate] = useState('')

  // API hooks
  const { data: immeublesApi, loading: immeublesLoading, refetch } = useImmeubles()
  const { data: commercials } = useCommercials()
  const { data: managers } = useManagers()
  const { mutate: updateImmeuble } = useUpdateImmeuble()
  const { mutate: removeImmeuble } = useRemoveImmeuble()

  useEffect(() => {
    if (dateFilterMode !== 'created_specific_date' && createdDate) {
      setCreatedDate('')
    }
  }, [dateFilterMode, createdDate])

  const effectiveSortBy = useMemo(() => {
    if (
      dateFilterMode === 'createdAt_desc' ||
      dateFilterMode === 'createdAt_asc' ||
      dateFilterMode === 'updatedAt_desc' ||
      dateFilterMode === 'updatedAt_asc'
    ) {
      return dateFilterMode
    }
    return 'createdAt_desc'
  }, [dateFilterMode])

  const filteredImmeubles = useMemo(() => {
    let result = immeublesApi || []

    if (filterCommercial !== 'all') {
      result = result.filter(imm => imm.commercialId === parseInt(filterCommercial))
    }

    if (dateFilterMode === 'created_yesterday') {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 1)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(startDate)
      endDate.setHours(23, 59, 59, 999)

      result = result.filter(imm => {
        const createdAt = new Date(imm.createdAt)
        return createdAt >= startDate && createdAt <= endDate
      })
    }

    if (dateFilterMode === 'created_this_week') {
      const now = new Date()
      const day = now.getDay()
      const diffToMonday = (day + 6) % 7
      const startDate = new Date(now)
      startDate.setDate(now.getDate() - diffToMonday)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)

      result = result.filter(imm => {
        const createdAt = new Date(imm.createdAt)
        return createdAt >= startDate && createdAt <= endDate
      })
    }

    if (dateFilterMode === 'created_specific_date' && createdDate) {
      const startDate = new Date(createdDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(startDate)
      endDate.setHours(23, 59, 59, 999)

      result = result.filter(imm => {
        const createdAt = new Date(imm.createdAt)
        return createdAt >= startDate && createdAt <= endDate
      })
    }

    return result
  }, [immeublesApi, filterCommercial, dateFilterMode, createdDate])

  // Récupération des permissions et description
  const permissions = useEntityPermissions('immeubles')
  const description = useEntityDescription('immeubles')

  function calculnbcontrats(immeuble) {
    // Somme des nbContrats pour toutes les portes avec statut CONTRAT_SIGNE
    return (immeuble.portes || [])
      .filter(p => p.statut === 'CONTRAT_SIGNE')
      .reduce((sum, p) => sum + (p.nbContrats || 1), 0)
  }

  // Configuration des colonnes
  const immeublesColumns = useMemo(
    () => [
      {
        header: 'Adresse',
        accessor: 'address',
        sortable: true,
        className: 'font-medium',
      },
      {
        header: 'Étages',
        accessor: 'floors',
        className: 'hidden md:table-cell text-center',
        cell: row => `${row.floors} étages`,
      },
      {
        header: 'contrats signés',
        accessor: 'contrats_signes',
        sortable: true,
        className: 'hidden md:table-cell text-center',
        cell: row => `${row.contrats_signes} contrats`,
      },
      {
        header: 'Couverture',
        accessor: 'couverture',
        sortable: true,
        className: 'hidden lg:table-cell text-center',
        cell: row => `${row.couverture}%`,
      },
      {
        header: 'Commercial',
        accessor: 'commercial_name',
        sortable: true,
        className: 'hidden xl:table-cell',
      },
    ],
    []
  )

  // Configuration des champs d'édition
  const getImmeublesEditFields = useMemo(
    () => [
      {
        key: 'address',
        label: 'Adresse',
        type: 'textarea',
        required: true,
        section: 'Informations générales',
        fullWidth: true,
        placeholder: "Adresse complète de l'immeuble",
      },
      {
        key: 'floors',
        label: "Nombre d'étages",
        type: 'number',
        required: true,
        section: 'Caractéristiques',
        min: 1,
        max: 100,
      },
      {
        key: 'doors_per_floor',
        label: 'Portes par étage',
        type: 'number',
        required: true,
        section: 'Caractéristiques',
        min: 1,
        max: 100,
      },
      {
        key: 'commercial_name',
        label: 'Commercial responsable',
        type: 'select',
        required: true,
        section: 'Gestion',
        options: (commercials || []).map(c => ({
          value: `${c.prenom} ${c.nom}`,
          label: `${c.prenom} ${c.nom}`,
        })),
      },
    ],
    [commercials]
  )

  const tableData = useMemo(() => {
    if (!filteredImmeubles) return []

    const [field, direction] = effectiveSortBy.split('_')
    const sortedImmeubles = [...filteredImmeubles].sort((a, b) => {
      const dateA = new Date(a[field]).getTime()
      const dateB = new Date(b[field]).getTime()
      return direction === 'desc' ? dateB - dateA : dateA - dateB
    })
    const mappedData = sortedImmeubles.map(immeuble => {
      const commercial = commercials?.find(c => c.id === immeuble.commercialId)
      const manager = managers?.find(m => m.id === immeuble.managerId)
      const portesImmeuble = immeuble.portes || []
      const totalDoors = portesImmeuble.length
      const portesProspectees = portesImmeuble.filter(p => p.statut !== 'NON_VISITE').length
      const couverture =
        totalDoors > 0 ? parseFloat(((portesProspectees / totalDoors) * 100).toFixed(1)) : 0

      // Déterminer le nom du responsable
      let responsibleName = 'N/A'
      if (commercial) {
        responsibleName = `${commercial.prenom} ${commercial.nom}`
      } else if (manager) {
        responsibleName = `${manager.prenom} ${manager.nom} (Manager)`
      }

      return {
        ...immeuble,
        address: immeuble.adresse,
        floors: immeuble.nbEtages,
        doors_per_floor: immeuble.nbPortesParEtage,
        total_doors: totalDoors,
        contrats_signes: calculnbcontrats(immeuble),
        couverture: couverture,
        commercial_name: responsibleName,
      }
    })

    const totalImmeubles = sortedImmeubles.length
    const totalContrats = sortedImmeubles.reduce((acc, curr) => acc + calculnbcontrats(curr), 0)
    const avgCouverture =
      totalImmeubles > 0
        ? (
            sortedImmeubles.reduce((acc, curr) => {
              const portesImmeuble = curr.portes || []
              const totalDoors = portesImmeuble.length
              const portesProspectees = portesImmeuble.filter(p => p.statut !== 'NON_VISITE').length
              const couverture = totalDoors > 0 ? (portesProspectees / totalDoors) * 100 : 0
              return acc + couverture
            }, 0) / totalImmeubles
          ).toFixed(1)
        : 0

    return { data: mappedData, stats: { totalImmeubles, totalContrats, avgCouverture } }
  }, [filteredImmeubles, commercials, managers, effectiveSortBy])

  const stats = tableData?.stats || {
    totalImmeubles: 0,
    totalContrats: 0,
    avgCouverture: 0,
  }
  const finalTableData = tableData?.data || []

  const handleEditImmeuble = async editedData => {
    try {
      const commercial = commercials?.find(
        c => `${c.prenom} ${c.nom}` === editedData.commercial_name
      )

      const updateInput = {
        id: editedData.id,
        adresse: editedData.address,
        nbEtages: parseInt(editedData.floors),
        nbPortesParEtage: parseInt(editedData.doors_per_floor),
        commercialId: commercial?.id,
      }

      await updateImmeuble(updateInput)
      await refetch()
      showSuccess('Immeuble modifié avec succès')
    } catch (error) {
      showError(error, 'Immeubles.handleEditImmeuble')
      throw error
    }
  }

  const handleDeleteImmeuble = async id => {
    try {
      await removeImmeuble(id)
      await refetch()
      showSuccess('Immeuble supprimé avec succès')
    } catch (error) {
      showError(error, 'Immeubles.handleDeleteImmeuble')
      throw error
    }
  }

  return {
    viewMode,
    setViewMode,
    immeublesLoading,
    description,
    tableData: finalTableData,
    stats,
    immeublesColumns,
    getImmeublesEditFields,
    permissions,
    handleEditImmeuble,
    handleDeleteImmeuble,
    filteredImmeubles,
    filterCommercial,
    setFilterCommercial,
    dateFilterMode,
    setDateFilterMode,
    createdDate,
    setCreatedDate,
    commercialsList: commercials,
  }
}
