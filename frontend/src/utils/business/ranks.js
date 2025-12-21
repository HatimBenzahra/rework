// Système de rangs basé sur les points
// Couleurs alignées avec le système de thème pour une cohérence visuelle parfaite

export const RANKS = [
  {
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 99,
    color: '#CD7F32',
    bgColor: 'bg-orange-500',
    textColor: 'text-white',
    borderColor: 'border-orange-600',
  },
  {
    name: 'Silver',
    minPoints: 100,
    maxPoints: 249,
    color: '#C0C0C0',
    bgColor: 'bg-slate-400',
    textColor: 'text-white',
    borderColor: 'border-slate-500',
  },
  {
    name: 'Gold',
    minPoints: 250,
    maxPoints: 499,
    color: '#FFD700',
    bgColor: 'bg-yellow-500',
    textColor: 'text-white',
    borderColor: 'border-yellow-600',
  },
  {
    name: 'Platinum',
    minPoints: 500,
    maxPoints: 999,
    color: '#E5E4E2',
    bgColor: 'bg-cyan-500',
    textColor: 'text-white',
    borderColor: 'border-cyan-600',
  },
  {
    name: 'Diamond',
    minPoints: 1000,
    maxPoints: Infinity,
    color: '#B9F2FF',
    bgColor: 'bg-purple-600',
    textColor: 'text-white',
    borderColor: 'border-purple-700',
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
