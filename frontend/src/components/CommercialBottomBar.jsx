import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { useCommercialTheme } from '@/hooks/use-commercial-theme'
import { useRole } from '@/contexts/RoleContext'
import { LogOut, X } from 'lucide-react'

export default function CommercialBottomBar({ navigationItems, activeTab, onTabChange }) {
  const { colors, base } = useCommercialTheme()
  const { setUserRole } = useRole()
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = () => {
    setUserRole('admin')
  }

  return (
    <>
      {/* Overlay menu moderne */}
      {showMenu && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={() => setShowMenu(false)}
        >
          <div
            className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-xs bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Header du menu */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className={`font-semibold ${base.text.primary}`}>Menu</h3>
              <button
                onClick={() => setShowMenu(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Actions du menu */}
            <div className="p-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-600 hover:bg-red-50 transition-all duration-200 active:scale-98"
              >
                <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center">
                  <LogOut className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">Se déconnecter</p>
                  <p className="text-xs text-red-400">Retour à l'interface admin</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar - Design moderne et épuré */}
      <nav
        className={`fixed bottom-0 left-0 right-0 ${base.bg.card} border-t ${base.border.light} z-50 safe-area-inset-bottom`}
        role="navigation"
        aria-label="Navigation principale"
      >
        {/* Container avec padding responsive */}
        <div className="max-w-screen-lg mx-auto px-safe">
          <div className="flex items-stretch justify-around h-20 sm:h-16">
            {/* Navigation items */}
            {navigationItems.map(item => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              const showBadge = item.badge > 0

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`
                    relative flex flex-col items-center justify-center gap-1 flex-1 min-w-0
                    transition-all duration-300 ease-out
                    ${isActive ? 'scale-105' : 'active:scale-95 hover:scale-102'}
                  `}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <div
                      className={`absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-b-full ${colors.primary.bg} animate-in slide-in-from-top-1 duration-300`}
                    />
                  )}

                  {/* Icon avec badge */}
                  <div className="relative">
                    <div
                      className={`
                      p-2 rounded-2xl transition-all duration-300
                      ${
                        isActive
                          ? `${colors.primary.bgLight} ${colors.primary.textLight}`
                          : `${base.bg.transparent} ${base.text.muted} group-hover:${base.bg.muted}`
                      }
                    `}
                    >
                      <Icon
                        className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 ${
                          isActive ? 'scale-110' : ''
                        }`}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    </div>

                    {/* Badge moderne */}
                    {showBadge && (
                      <Badge
                        className={`
                          absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1
                          flex items-center justify-center text-[10px] font-bold
                          border-2 border-white shadow-md
                          ${isActive ? `${colors.primary.bg} ${colors.primary.text}` : 'bg-red-500 text-white'}
                          ${isActive && item.badge > 0 ? 'animate-pulse' : ''}
                          transition-all duration-300
                        `}
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </Badge>
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={`
                    text-[11px] sm:text-xs leading-tight text-center max-w-full truncate px-1
                    transition-all duration-300
                    ${
                      isActive
                        ? `${colors.primary.text} font-bold`
                        : `${base.text.muted} font-medium`
                    }
                  `}
                  >
                    {item.label}
                  </span>
                </button>
              )
            })}

            {/* Menu button - Design cohérent */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`
                relative flex flex-col items-center justify-center gap-1 flex-1 min-w-0
                transition-all duration-300 ease-out
                ${showMenu ? 'scale-105' : 'active:scale-95 hover:scale-102'}
              `}
              aria-label="Menu"
              aria-expanded={showMenu}
            >
              {/* Active indicator pour le menu */}
              {showMenu && (
                <div
                  className={`absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-b-full bg-gray-700 animate-in slide-in-from-top-1 duration-300`}
                />
              )}

              <div
                className={`
                  p-2 rounded-2xl transition-all duration-300
                  ${
                    showMenu
                      ? 'bg-gray-100 text-gray-900'
                      : `${base.bg.transparent} ${base.text.muted}`
                  }
                `}
              >
                <div className="flex gap-1">
                  <div
                    className={`w-1 h-1 rounded-full bg-current transition-all duration-300 ${showMenu ? 'scale-125' : ''}`}
                  />
                  <div
                    className={`w-1 h-1 rounded-full bg-current transition-all duration-300 ${showMenu ? 'scale-125' : ''}`}
                  />
                  <div
                    className={`w-1 h-1 rounded-full bg-current transition-all duration-300 ${showMenu ? 'scale-125' : ''}`}
                  />
                </div>
              </div>

              <span
                className={`
                  text-[11px] sm:text-xs leading-tight text-center font-medium
                  transition-all duration-300
                  ${showMenu ? 'text-gray-900 font-bold' : base.text.muted}
                `}
              >
                Plus
              </span>
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}
