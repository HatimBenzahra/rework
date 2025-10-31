// Système de rangs basé sur les points
// Couleurs alignées avec le système de thème pour une cohérence visuelle parfaite

export const RANKS = [
  {
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 99,
    color: '#CD7F32',
    bgColor: 'bg-orange-100/80 dark:bg-orange-950/30',
    textColor: 'text-orange-700 dark:text-orange-400',
    borderColor: 'border-orange-300 dark:border-orange-700',
  },
  {
    name: 'Silver',
    minPoints: 100,
    maxPoints: 249,
    color: '#C0C0C0',
    bgColor: 'bg-slate-100/80 dark:bg-slate-800/30',
    textColor: 'text-slate-700 dark:text-slate-300',
    borderColor: 'border-slate-300 dark:border-slate-600',
  },
  {
    name: 'Gold',
    minPoints: 250,
    maxPoints: 499,
    color: '#FFD700',
    bgColor: 'bg-amber-100/80 dark:bg-amber-950/30',
    textColor: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-400 dark:border-amber-700',
  },
  {
    name: 'Platinum',
    minPoints: 500,
    maxPoints: 999,
    color: '#E5E4E2',
    bgColor: 'bg-blue-100/80 dark:bg-blue-950/30',
    textColor: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-blue-400 dark:border-blue-700',
  },
  {
    name: 'Diamond',
    minPoints: 1000,
    maxPoints: Infinity,
    color: '#B9F2FF',
    bgColor: 'bg-emerald-100/80 dark:bg-emerald-950/30',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    borderColor: 'border-emerald-400 dark:border-emerald-700',
  },
]

export const calculateRank = (contratsSignes = 0, rendezVousPris = 0, immeublesVisites = 0) => {
  // Système de points:
  // - 50 points par contrat signé
  // - 10 points par rendez-vous pris
  // - 5 points par immeuble visité
  const points = contratsSignes * 50 + rendezVousPris * 10 + immeublesVisites * 5

  // Trouver le rang correspondant
  const rank = RANKS.find(r => points >= r.minPoints && points <= r.maxPoints) || RANKS[0]

  return { rank, points }
}

export const getNextRank = currentPoints => {
  const nextRank = RANKS.find(r => r.minPoints > currentPoints)
  const pointsToNextRank = nextRank ? nextRank.minPoints - currentPoints : 0
  return { nextRank, pointsToNextRank }
}
