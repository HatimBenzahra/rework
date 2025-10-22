// Système de rangs basé sur les points
// Couleurs alignées avec useCommercialTheme pour la cohérence visuelle

export const RANKS = [
  {
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 99,
    color: '#CD7F32',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-300',
  },
  {
    name: 'Silver',
    minPoints: 100,
    maxPoints: 249,
    color: '#C0C0C0',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-500',
  },
  {
    name: 'Gold',
    minPoints: 250,
    maxPoints: 499,
    color: '#FFD700',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-500',
  },
  {
    name: 'Platinum',
    minPoints: 500,
    maxPoints: 999,
    color: '#E5E4E2',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-500',
  },
  {
    name: 'Diamond',
    minPoints: 1000,
    maxPoints: Infinity,
    color: '#B9F2FF',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-500',
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
