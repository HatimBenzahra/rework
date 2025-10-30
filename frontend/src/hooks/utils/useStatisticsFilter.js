import { useMemo } from 'react'
import { filterStatisticsByDate, filterPortesByDate } from './useDateFilter'

/**
 * Hook pour calculer les statistiques personnelles filtrées par date
 * @param {Object} user - Utilisateur (manager ou commercial)
 * @param {string} appliedStartDate - Date de début appliquée
 * @param {string} appliedEndDate - Date de fin appliquée
 * @returns {Object} Statistiques personnelles calculées
 */
export function usePersonalStats(user, appliedStartDate, appliedEndDate) {
  // Filtrer les statistiques par date
  const filteredStats = useMemo(() => {
    if (!user?.statistics) return []
    return filterStatisticsByDate(user.statistics, appliedStartDate, appliedEndDate)
  }, [user?.statistics, appliedStartDate, appliedEndDate])

  // Calculer les totaux
  const personalStats = useMemo(() => {
    const totalContratsSignes = filteredStats.reduce((sum, stat) => sum + stat.contratsSignes, 0)
    const totalImmeublesVisites = filteredStats.reduce(
      (sum, stat) => sum + stat.immeublesVisites,
      0
    )
    const totalRendezVousPris = filteredStats.reduce((sum, stat) => sum + stat.rendezVousPris, 0)
    const totalRefus = filteredStats.reduce((sum, stat) => sum + stat.refus, 0)
    const totalPortesProspectes = filteredStats.reduce(
      (sum, stat) => sum + (stat.nbPortesProspectes || 0),
      0
    )
    const totalImmeublesProspectes = filteredStats.reduce(
      (sum, stat) => sum + (stat.nbImmeublesProspectes || 0),
      0
    )

    // Taux de conversion
    const tauxConversion_portes_prospectes =
      totalPortesProspectes > 0
        ? ((totalContratsSignes / totalPortesProspectes) * 100).toFixed(1)
        : '0'

    const tauxConversion_rdv_pris =
      totalRendezVousPris > 0 ? ((totalContratsSignes / totalRendezVousPris) * 100).toFixed(1) : '0'

    return {
      totalContratsSignes,
      totalImmeublesVisites,
      totalRendezVousPris,
      totalRefus,
      totalPortesProspectes,
      totalImmeublesProspectes,
      tauxConversion_portes_prospectes: `${tauxConversion_portes_prospectes}%`,
      tauxConversion_rdv_pris: `${tauxConversion_rdv_pris}%`,
    }
  }, [filteredStats])

  return { filteredStats, personalStats }
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
      const curieux = portesImmeuble.filter(p => p.statut === 'CURIEUX').length
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
        curieux: curieux,
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
