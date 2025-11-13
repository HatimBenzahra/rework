import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { useCommercialTheme } from '@/hooks/ui/use-commercial-theme'
import { useRole } from '@/contexts/userole'
import { LogOut, X } from 'lucide-react'

export default function CommercialBottomBar({ navigationItems, activeTab, onTabChange }) {
  const { colors, base } = useCommercialTheme()
  const { logout } = useRole()
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = () => {
    logout()
  }

  return (
    <>
      {/* Overlay menu moderne */}
      {showMenu && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-md z-40 animate-in fade-in duration-300"
          onClick={() => setShowMenu(false)}
        >
          <div
            className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-xs bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Header du menu */}
            <div className="px-5 py-4 border-b border-gray-100/80 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-transparent">
              <h3 className={`font-semibold text-gray-900 ${base.text.primary}`}>Menu</h3>
              <button
                onClick={() => setShowMenu(false)}
                className="p-1.5 hover:bg-gray-100/80 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
                aria-label="Fermer"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Actions du menu */}
            <div className="p-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-600 hover:bg-red-50/80 transition-all duration-200 active:scale-[0.98] hover:shadow-md hover:shadow-red-100"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center shadow-sm">
                  <LogOut className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm">Se déconnecter</p>
                  <p className="text-xs text-red-400/80">Retour à la page de connexion</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar - Design moderne avec forme arrondie */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom"
        role="navigation"
        aria-label="Navigation principale"
      >
        {/* Container avec forme arrondie moderne */}
        <div className="max-w-screen-lg mx-auto px-4 pb-2">
          <div
            className={`
              ${base.bg.card}/98 backdrop-blur-2xl
              rounded-t-[2rem] sm:rounded-t-[2.5rem]
              border-t ${base.border.light}
              shadow-[0_-8px_32px_rgba(0,0,0,0.12)]
              relative overflow-hidden
              before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2
              before:w-24 before:h-1 before:bg-gradient-to-r
              before:from-transparent before:via-gray-300/60 before:to-transparent
              before:rounded-full
            `}
          >
            {/* Ligne décorative en haut */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-gray-300/60 to-transparent rounded-full" />

            <div className="flex items-stretch justify-around h-20 sm:h-20 pt-3 pb-4 relative z-10">
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
                    {/* Active indicator - forme moderne avec pill */}
                    {isActive && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <div
                          className={`w-10 h-1.5 rounded-full ${colors.primary.bg} animate-in slide-in-from-top-1 duration-300 shadow-lg`}
                          style={{
                            boxShadow: `0 2px 8px ${colors.primary.bg}40`,
                          }}
                        />
                      </div>
                    )}

                    {/* Icon avec badge - design pill moderne */}
                    <div className="relative">
                      <div
                        className={`
                      p-3 rounded-2xl transition-all duration-300 ease-out
                      ${
                        isActive
                          ? `${colors.primary.bgLight} ${colors.primary.textLight} shadow-lg`
                          : `${base.bg.transparent} ${base.text.muted} hover:${base.bg.muted}/60`
                      }
                      ${isActive ? 'scale-110' : 'hover:scale-105 active:scale-95'}
                    `}
                        style={
                          isActive
                            ? {
                                boxShadow: `0 6px 20px ${colors.primary.bg}25`,
                              }
                            : {}
                        }
                      >
                        <Icon
                          className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${
                            isActive ? 'scale-110' : ''
                          }`}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                      </div>

                      {/* Badge moderne avec glow et forme arrondie */}
                      {showBadge && (
                        <Badge
                          className={`
                          absolute -top-0.5 -right-0.5 min-w-[22px] h-[22px] px-1.5
                          flex items-center justify-center text-[10px] font-bold
                          border-2 border-white rounded-full
                          ${isActive ? `${colors.primary.bg} ${colors.primary.text}` : 'bg-gradient-to-br from-red-500 to-red-600 text-white'}
                          ${isActive && item.badge > 0 ? 'animate-pulse' : ''}
                          transition-all duration-300 hover:scale-110
                        `}
                          style={
                            isActive
                              ? {
                                  boxShadow: `0 4px 16px ${colors.primary.bg}50`,
                                }
                              : {
                                  boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
                                }
                          }
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </Badge>
                      )}
                    </div>

                    {/* Label avec animation */}
                    <span
                      className={`
                    text-[11px] sm:text-xs leading-tight text-center max-w-full truncate px-1 mt-0.5
                    transition-all duration-300
                    ${
                      isActive
                        ? `${colors.primary.text} font-bold tracking-wide`
                        : `${base.text.muted} font-medium`
                    }
                  `}
                    >
                      {item.label}
                    </span>
                  </button>
                )
              })}

              {/* Menu button - Design cohérent avec forme moderne */}
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`
                relative flex flex-col items-center justify-center gap-1 flex-1 min-w-0
                transition-all duration-300 ease-out
                ${showMenu ? 'scale-110' : 'active:scale-95 hover:scale-105'}
              `}
                aria-label="Menu"
                aria-expanded={showMenu}
              >
                {/* Active indicator pour le menu avec forme moderne */}
                {showMenu && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <div
                      className="w-10 h-1.5 rounded-full bg-gray-700 animate-in slide-in-from-top-1 duration-300 shadow-lg"
                      style={{
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                      }}
                    />
                  </div>
                )}

                <div
                  className={`
                  p-3 rounded-2xl transition-all duration-300 ease-out
                  ${
                    showMenu
                      ? 'bg-gray-100 text-gray-900 shadow-lg'
                      : `${base.bg.transparent} ${base.text.muted} hover:${base.bg.muted}/60`
                  }
                  ${showMenu ? 'scale-110' : 'hover:scale-105 active:scale-95'}
                `}
                  style={
                    showMenu
                      ? {
                          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                        }
                      : {}
                  }
                >
                  <div className="flex gap-1 items-center">
                    <div
                      className={`w-1.5 h-1.5 rounded-full bg-current transition-all duration-300 ${
                        showMenu ? 'scale-125 opacity-100' : 'opacity-70'
                      }`}
                    />
                    <div
                      className={`w-1.5 h-1.5 rounded-full bg-current transition-all duration-300 delay-75 ${
                        showMenu ? 'scale-125 opacity-100' : 'opacity-70'
                      }`}
                    />
                    <div
                      className={`w-1.5 h-1.5 rounded-full bg-current transition-all duration-300 delay-150 ${
                        showMenu ? 'scale-125 opacity-100' : 'opacity-70'
                      }`}
                    />
                  </div>
                </div>

                <span
                  className={`
                  text-[11px] sm:text-xs leading-tight text-center font-medium mt-0.5
                  transition-all duration-300
                  ${showMenu ? 'text-gray-900 font-bold tracking-wide' : base.text.muted}
                `}
                >
                  Plus
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
