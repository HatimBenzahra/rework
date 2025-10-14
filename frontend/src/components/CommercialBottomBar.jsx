import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCommercialTheme } from '@/hooks/use-commercial-theme'
import { useRole } from '@/contexts/RoleContext'
import { LogOut, MoreHorizontal } from 'lucide-react'

export default function CommercialBottomBar({ navigationItems, activeTab, onTabChange }) {
  const { getNavClasses, getBadgeClasses } = useCommercialTheme()
  const { setUserRole } = useRole()
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = () => {
    // Retour à l'interface admin par défaut
    setUserRole('admin')
  }

  const toggleMenu = () => {
    setShowMenu(!showMenu)
  }

  return (
    <>
      {/* Overlay menu pour déconnexion */}
      {showMenu && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setShowMenu(false)}>
          <div className="absolute bottom-20 right-4 bg-white rounded-2xl shadow-xl border border-gray-200 p-2 min-w-[180px]">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Se déconnecter
            </Button>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/50 shadow-2xl">
        
        <div className="safe-area-inset-bottom">
          <div className="flex items-center justify-center px-2 py-3">
            {/* Navigation tabs */}
            <div className="flex items-center justify-center space-x-1 flex-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                const navClasses = getNavClasses(isActive)
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`
                      relative flex flex-col items-center justify-center px-4 py-2 rounded-2xl 
                      transition-all duration-300 ease-out min-w-[70px] group
                      ${isActive 
                        ? `${navClasses.bg} ${navClasses.text} shadow-lg scale-105` 
                        : `${navClasses.bg} ${navClasses.text} hover:bg-gray-50 active:scale-95`
                      }
                    `}
                    aria-label={item.label}
                    role="tab"
                    aria-selected={isActive}
                  >
                    {/* Active background glow */}
                    {isActive && (
                      <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-sm" />
                    )}
                    
                    {/* Icon container */}
                    <div className="relative z-10 mb-1">
                      <Icon 
                        className={`w-6 h-6 transition-all duration-300 ${
                          isActive ? 'scale-110 drop-shadow-sm' : 'group-hover:scale-105 group-active:scale-95'
                        }`} 
                      />
                      
                      {/* Badge notification */}
                      {item.badge > 0 && (
                        <Badge 
                          className={`
                            absolute -top-2 -right-2 text-xs min-w-[18px] h-5 px-1.5 
                            flex items-center justify-center font-bold transition-all duration-300
                            shadow-sm border-2 border-white
                            ${getBadgeClasses(isActive)}
                            ${isActive ? 'animate-pulse scale-110' : 'hover:scale-110'}
                          `}
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Label */}
                    <span className={`
                      text-xs font-medium leading-tight text-center transition-all duration-300 z-10
                      ${isActive ? 'font-bold' : 'group-hover:font-semibold'}
                    `}>
                      {item.label}
                    </span>

                    {/* Active dot indicator */}
                    {isActive && (
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-sm animate-pulse" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Menu button */}
            <button
              onClick={toggleMenu}
              className={`
                relative flex flex-col items-center justify-center p-3 rounded-2xl 
                transition-all duration-300 ease-out ml-2 group
                ${showMenu 
                  ? 'bg-gray-100 text-gray-700 scale-105' 
                  : 'hover:bg-gray-50 text-gray-600 active:scale-95'
                }
              `}
              aria-label="Menu"
            >
              <MoreHorizontal 
                className={`w-5 h-5 transition-all duration-300 ${
                  showMenu ? 'rotate-90 scale-110' : 'group-hover:scale-105'
                }`} 
              />
              <span className="text-xs font-medium mt-1">Menu</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}