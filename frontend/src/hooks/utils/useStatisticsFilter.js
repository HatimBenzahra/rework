import { useMemo } from 'react'
import { filterStatisticsByDate, filterPortesByDate } from './useDateFilter'

/**
 * Hook pour calculer les statistiques personnelles filtrées par date
 * IMPORTANT: Calcule les stats à partir des PORTES filtrées, pas des statistiques
 * @param {Object} user - Utilisateur (manager ou commercial)
 * @param {string} appliedStartDate - Date de début appliquée
 * @param {string} appliedEndDate - Date de fin appliquée
 * @returns {Object} Statistiques personnelles calculées
 */
export function usePersonalStats(user, appliedStartDate, appliedEndDate) {
  // Collecter toutes les portes de l'utilisateur
  const allPortes = useMemo(() => {
    if (!user?.immeubles) return []
    return user.immeubles.reduce((acc, immeuble) => {
      if (immeuble.portes) {
        return [...acc, ...immeuble.portes]
      }
      return acc
    }, [])
  }, [user?.immeubles])

  // Filtrer les portes par date
  const filteredPortes = useMemo(() => {
    return filterPortesByDate(allPortes, appliedStartDate, appliedEndDate)
  }, [allPortes, appliedStartDate, appliedEndDate])

  // Calculer les totaux à partir des portes filtrées
  const personalStats = useMemo(() => {
    const totalContratsSignes = filteredPortes.filter(p => p.statut === 'CONTRAT_SIGNE').length
    const totalRendezVousPris = filteredPortes.filter(p => p.statut === 'RENDEZ_VOUS_PRIS').length
    const totalRefus = filteredPortes.filter(p => p.statut === 'REFUS').length
    const totalAbsents = filteredPortes.filter(p => p.statut === 'ABSENT').length
    const totalArgumentes = filteredPortes.filter(p => p.statut === 'ARGUMENTE').length
    const totalPortesProspectes = filteredPortes.filter(p => p.statut !== 'NON_VISITE').length

    // Compter les immeubles uniques visités
    const immeublesVisitesSet = new Set(
      filteredPortes
        .filter(p => p.statut !== 'NON_VISITE')
        .map(p => p.immeubleId)
    )
    const totalImmeublesVisites = immeublesVisitesSet.size

    // Compter les immeubles uniques prospectés
    const immeublesProspectesSet = new Set(
      filteredPortes
        .filter(p => p.statut !== 'NON_VISITE')
        .map(p => p.immeubleId)
    )
    const totalImmeublesProspectes = immeublesProspectesSet.size

    return {
      totalContratsSignes,
      totalImmeublesVisites,
      totalRendezVousPris,
      totalRefus,
      totalAbsents,
      totalArgumentes,
      totalPortesProspectes,
      totalImmeublesProspectes,
    }
  }, [filteredPortes])

  return { filteredStats: filteredPortes, personalStats }
}

/**
 * Hook pour préparer les données des immeubles avec statistiques calculées
 * @param {Array} immeubles - Tableau des immeubles
 * @param {string} appliedStartDate - Date de début appliquée
 * @param {string} appliedEndDate - Date de fin appliquée
 * @returns {Array} Données des immeubles formatées pour le tableau
 */
export function useImmeublesTableData(immeubles, appliedStartDate, appliedEndDate) {
  return useMemo(() => {
    if (!immeubles) return []

    // Trier les immeubles du plus récent au plus ancien
    const sortedImmeubles = [...immeubles].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return sortedImmeubles.map(immeuble => {
      // Utiliser les portes de l'immeuble directement (chargées avec l'immeuble)
      const portesImmeubleUnfiltered = immeuble.portes || []
      // Filtrer les portes par date
      const portesImmeuble = filterPortesByDate(
        portesImmeubleUnfiltered,
        appliedStartDate,
        appliedEndDate
      )
      const totalDoors = immeuble.nbEtages * immeuble.nbPortesParEtage

      // Calculer les statistiques à partir des portes
      const contratsSignes = portesImmeuble.filter(p => p.statut === 'CONTRAT_SIGNE').length
      const rdvPris = portesImmeuble.filter(p => p.statut === 'RENDEZ_VOUS_PRIS').length
      const refus = portesImmeuble.filter(p => p.statut === 'REFUS').length
      const absent = portesImmeuble.filter(p => p.statut === 'ABSENT').length
      const argumente = portesImmeuble.filter(p => p.statut === 'ARGUMENTE').length
      const repassages = portesImmeuble.reduce((sum, p) => sum + (p.nbRepassages || 0), 0)
      const portesProspectees = portesImmeuble.filter(p => p.statut !== 'NON_VISITE').length
      const couverture = totalDoors > 0 ? Math.round((portesProspectees / totalDoors) * 100) : 0

      return {
        id: immeuble.id,
        address: immeuble.adresse,
        floors: immeuble.nbEtages,
        doors_per_floor: immeuble.nbPortesParEtage,
        total_doors: totalDoors,
        couverture: couverture,
        contrats_signes: contratsSignes,
        rdv_pris: rdvPris,
        refus: refus,
        absent: absent,
        argumente: argumente,
        repassages: repassages,
        portes_prospectees: portesProspectees,
        createdAt: immeuble.createdAt,
      }
    })
  }, [immeubles, appliedStartDate, appliedEndDate])
}

/**
 * Hook pour collecter toutes les portes filtrées par date
 * @param {Array} immeubles - Tableau des immeubles
 * @param {string} appliedStartDate - Date de début appliquée
 * @param {string} appliedEndDate - Date de fin appliquée
 * @returns {Array} Toutes les portes filtrées
 */
export function useFilteredPortes(immeubles, appliedStartDate, appliedEndDate) {
  return useMemo(() => {
    if (!immeubles) return []

    // Collecter toutes les portes de tous les immeubles
    const allPortesUnfiltered = immeubles.reduce((acc, immeuble) => {
      if (immeuble.portes) {
        return [...acc, ...immeuble.portes]
      }
      return acc
    }, [])

    // Filtrer par date si nécessaire
    return filterPortesByDate(allPortesUnfiltered, appliedStartDate, appliedEndDate)
  }, [immeubles, appliedStartDate, appliedEndDate])
}
