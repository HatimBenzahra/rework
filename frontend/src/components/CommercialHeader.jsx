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
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-4 sm:py-6 rounded-b-3xl shadow-2xl overflow-hidden">
      {/* Layout Mobile - Stack vertical */}
      <div className="flex flex-col sm:hidden space-y-3">
        {/* Top row: Avatar + Nom + Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-10 h-10 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-bold text-white truncate">
                Bonjour {commercial?.prenom || 'Commercial'} !
              </h1>
            </div>
          </div>
          <Badge
            className={`${badgeInfo.color} border-none shadow-xl flex items-center space-x-1 px-2 py-1 flex-shrink-0`}
          >
            <badgeInfo.icon className="w-3 h-3" />
            <span className="font-bold text-xs whitespace-nowrap">{badgeInfo.level}</span>
          </Badge>
        </div>

        {/* Bottom row: Date et stats */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-blue-50">
            <Calendar className="w-3 h-3" />
            <span>{currentTime}</span>
          </div>
          {stats?.contratsSignes !== undefined && (
            <span className="text-xs text-blue-50 font-medium">
              {stats.contratsSignes} contrats
            </span>
          )}
        </div>
      </div>

      {/* Layout Desktop/Tablet - Horizontal */}
      <div className="hidden sm:flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white">
              Bonjour {commercial?.prenom || 'Commercial'} !
            </h1>
            <div className="flex items-center space-x-2 text-blue-50 text-xs md:text-sm">
              <Calendar className="w-4 h-4" />
              <span className="capitalize hidden md:inline">{currentDate}</span>
              <span className="md:hidden">
                {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </span>
              <span className="text-blue-100">•</span>
              <span>{currentTime}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-1">
          <Badge
            className={`${badgeInfo.color} border-none shadow-xl flex items-center space-x-1 px-3 py-1.5`}
          >
            <badgeInfo.icon className="w-4 h-4" />
            <span className="font-bold text-sm">{badgeInfo.level}</span>
          </Badge>
          <div className="flex flex-col items-end space-y-0.5">
            {stats?.contratsSignes !== undefined && (
              <span className="text-xs text-blue-50 font-medium text-right">
                {stats.contratsSignes} contrats signés
              </span>
            )}
            {commercial?.email && (
              <span className="text-xs text-blue-100 text-right hidden lg:inline">
                {commercial.email}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
