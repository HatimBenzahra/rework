import React from 'react'
import { Badge } from '@/components/ui/badge'
import { User, Calendar, Award, Crown, Star, Gem, Trophy, UserPlus } from 'lucide-react'

export default function CommercialHeader({ commercial, showGreeting = true, stats }) {
  // Système de badges basé sur les performances
  const getBadgeLevel = stats => {
    const contracts = stats?.contratsSignes || 0

    if (contracts >= 100)
      return {
        level: 'Expert',
        color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
        icon: Crown,
      }
    if (contracts >= 50)
      return {
        level: 'Pro',
        color: 'bg-gradient-to-r from-green-500 to-teal-500 text-white',
        icon: Star,
      }
    if (contracts >= 30)
      return {
        level: 'Diamond',
        color: 'bg-gradient-to-r from-blue-400 to-purple-500 text-white',
        icon: Gem,
      }
    if (contracts >= 20)
      return {
        level: 'Gold',
        color: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
        icon: Trophy,
      }
    if (contracts >= 10)
      return {
        level: 'Silver',
        color: 'bg-gradient-to-r from-gray-300 to-gray-500 text-white',
        icon: Award,
      }
    if (contracts > 0)
      return {
        level: 'Bronze',
        color: 'bg-gradient-to-r from-orange-600 to-red-600 text-white',
        icon: Award,
      }

    // Cas pour 0 contrats
    return {
      level: 'Débutant',
      color: 'bg-gradient-to-r from-slate-400 to-slate-500 text-white',
      icon: UserPlus,
    }
  }

  const badgeInfo = getBadgeLevel(stats)
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const currentTime = new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (!showGreeting) return null

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-6 rounded-b-3xl shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Bonjour {commercial?.prenom || 'Commercial'} !</h1>
            <div className="flex items-center space-x-2 text-blue-100 text-sm">
              <Calendar className="w-4 h-4" />
              <span className="capitalize">{currentDate}</span>
              <span className="text-blue-200">•</span>
              <span>{currentTime}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-1">
          <Badge
            className={`${badgeInfo.color} border-none shadow-lg flex items-center space-x-1 px-3 py-1`}
          >
            <badgeInfo.icon className="w-4 h-4" />
            <span className="font-bold">{badgeInfo.level}</span>
          </Badge>
          <div className="flex flex-col items-end space-y-0.5">
            {stats?.contratsSignes !== undefined && (
              <span className="text-xs text-blue-100 font-medium text-right">
                {stats.contratsSignes} contrats signés
              </span>
            )}
            {commercial?.email && (
              <span className="text-xs text-blue-100 opacity-80 text-right">
                {commercial.email}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
