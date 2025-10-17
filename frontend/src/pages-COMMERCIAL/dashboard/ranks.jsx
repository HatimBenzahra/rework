// Système de rangs basé sur les points

export const RANKS = [
  {
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 99,
    color: '#CD7F32',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-300',
  },
  {
    name: 'Silver',
    minPoints: 100,
    maxPoints: 249,
    color: '#C0C0C0',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
  },
  {
    name: 'Gold',
    minPoints: 250,
    maxPoints: 499,
    color: '#FFD700',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-300',
  },
  {
    name: 'Platinum',
    minPoints: 500,
    maxPoints: 999,
    color: '#E5E4E2',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
  },
  {
    name: 'Diamond',
    minPoints: 1000,
    maxPoints: Infinity,
    color: '#B9F2FF',
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-300',
  },
]
