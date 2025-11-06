import {
  Calendar,
  Home,
  Inbox,
  Search,
  Settings,
  ChevronUp,
  ChevronDown,
  User2,
  Building2,
  MapPin,
  Navigation2,
  Headphones,
  BarChart3,
  Users,
} from 'lucide-react'
import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useRole } from '@/contexts/userole'
import { hasPermission, ROLES } from '@/hooks/metier/roleFilters'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible'
import { useDetailsSections } from '@/contexts/DetailsSectionsContext'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Menu items avec permissions requises
const items = [
  {
    title: 'Dashboard',
    url: '/',
    icon: Home,
    entity: null, // Dashboard toujours visible
  },
  {
    title: 'Directeurs',
    url: '/directeurs',
    icon: Search,
    entity: 'directeurs',
  },
  {
    title: 'Managers',
    url: '/managers',
    icon: Calendar,
    entity: 'managers',
  },
  {
    title: 'Commerciaux',
    url: '/commerciaux',
    icon: Inbox,
    entity: 'commerciaux',
  },
  {
    title: 'Gestion',
    url: '/gestion',
    icon: Users,
    entity: 'gestion',
  },
  {
    title: 'Immeubles',
    url: '/immeubles',
    icon: Building2,
    entity: 'immeubles',
  },
  {
    title: 'Zones',
    url: '/zones',
    icon: MapPin,
    entity: 'zones',
    subitems: [
      {
        title: "Vue d'ensemble",
        url: '/zones',
      },
      {
        title: 'Assignations en cours',
        url: '/zones/assignations',
      },
      {
        title: 'Historique',
        url: '/zones/historique',
      },
    ],
  },
  {
    title: 'Suivi GPS',
    url: '/gps-tracking',
    icon: Navigation2,
    entity: 'gps-tracking',
    disabled: true, // Ajouter cette ligne
  },
  {
    title: 'Écoutes',
    url: '/ecoutes',
    icon: Headphones,
    entity: 'ecoutes',
    subitems: [
      {
        title: 'Écoute Live',
        url: '/ecoutes/live',
      },
      {
        title: 'Enregistrement',
        url: '/ecoutes/enregistrement',
      },
    ],
  },
  {
    title: 'Statistiques',
    url: '/statistiques',
    icon: BarChart3,
    entity: 'statistics',
  },
]

export function AppSidebar() {
  const { currentRole, currentUserId } = useRole()
  const location = useLocation()
  const [openMenus, setOpenMenus] = React.useState({})
  const { sections, setFocusedSection } = useDetailsSections()
  const [activeSection, setActiveSection] = React.useState(null)

  const normalizePath = value => {
    if (!value) return ''
    return value.replace(/\/+$/, '') || '/'
  }

  const isActiveRoute = (path, subitems = []) => {
    const currentPath = normalizePath(location.pathname)
    const targetPath = normalizePath(path)

    if (!targetPath) return false
    if (targetPath === '/') {
      return currentPath === '/'
    }

    // Si cet item a des sous-items, vérifier s'il y a une correspondance plus spécifique
    // Pour éviter que le parent soit actif quand un enfant est actif
    if (subitems.length > 0) {
      const hasMoreSpecificMatch = subitems.some(
        sub =>
          currentPath === normalizePath(sub.url) ||
          currentPath.startsWith(`${normalizePath(sub.url)}/`)
      )

      // Si un sous-item correspond mieux, utiliser une correspondance exacte pour le parent
      if (hasMoreSpecificMatch && currentPath !== targetPath) {
        return false
      }
    }

    return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
  }

  // Fonction pour gérer le scroll vers une section
  const handleScrollToSection = sectionId => {
    const element = document.getElementById(sectionId)
    if (element) {
      // Définir la section comme focusée pour l'effet visuel
      setFocusedSection(sectionId)

      // Calculer la position pour centrer vraiment l'élément
      const elementRect = element.getBoundingClientRect()
      const absoluteElementTop = elementRect.top + window.pageYOffset
      const middle = absoluteElementTop - window.innerHeight / 2 + elementRect.height / 2

      window.scrollTo({
        top: middle,
        behavior: 'smooth',
      })

      // Retirer l'effet de focus après 2 secondes
      setTimeout(() => {
        setFocusedSection(null)
      }, 2000)
    }
  }

  // Enrichir les items du menu avec les sections dynamiques pour les pages de détails
  const enrichedItems = React.useMemo(() => {
    return items.map(item => {
      // Si on est sur une page de détails et qu'il y a des sections disponibles
      if (sections.length > 0 && location.pathname.includes(item.url) && item.url !== '/') {
        // Créer des sous-items à partir des sections
        const dynamicSubitems = sections.map(section => ({
          title: section.title,
          id: section.id,
          isSection: true, // Marquer comme section pour gérer différemment
        }))

        return {
          ...item,
          subitems: dynamicSubitems,
        }
      }
      return item
    })
  }, [sections, location.pathname])

  // Ouvrir automatiquement le menu qui contient des sections dynamiques
  React.useEffect(() => {
    enrichedItems.forEach(item => {
      if (item.subitems && item.subitems.some(sub => sub.isSection)) {
        setOpenMenus(prev => ({ ...prev, [item.title]: true }))
      }
    })
  }, [enrichedItems])

  // Détecter la section active en fonction du scroll
  React.useEffect(() => {
    if (sections.length === 0) return

    const handleScroll = () => {
      // Vérifier si on est en bas de la page
      const isBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 10

      // Si on est en bas, activer la dernière section
      if (isBottom && sections.length > 0) {
        setActiveSection(sections[sections.length - 1].id)
        return
      }

      // Récupérer toutes les sections
      const sectionElements = sections.map(section => ({
        id: section.id,
        element: document.getElementById(section.id),
      }))

      // Trouver quelle section est actuellement visible
      // On considère qu'une section est active si elle est dans le tiers supérieur de l'écran
      const scrollPosition = window.scrollY + 200

      let currentActiveSection = null

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const section = sectionElements[i]
        if (section.element) {
          const offsetTop = section.element.offsetTop
          if (scrollPosition >= offsetTop) {
            currentActiveSection = section.id
            break
          }
        }
      }
      if (!currentActiveSection && sections.length > 0) {
        currentActiveSection = sections[0].id
      }

      setActiveSection(currentActiveSection)
    }

    // Écouter les événements de scroll
    window.addEventListener('scroll', handleScroll)
    // Appeler une première fois pour initialiser
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [sections])

  // Fonction helper pour changer rôle + userId
  const switchRole = (role, userId) => {
    localStorage.setItem('userRole', role)
    localStorage.setItem('userId', userId)
    // Rediriger vers la page d'accueil appropriée selon le rôle
    if (role === ROLES.COMMERCIAL || role === ROLES.MANAGER) {
      window.location.href = '/' // Dashboard commercial
    } else {
      window.location.reload() // Recharger pour les autres rôles
    }
  }

  // Filtrer les éléments enrichis selon les permissions
  const visibleItems = enrichedItems.filter(item => {
    // Si pas d'entité spécifiée, toujours visible (Dashboard, Paramètres)
    if (!item.entity) return true

    // Vérifier si l'utilisateur a la permission de voir cette entité
    return hasPermission(currentRole, item.entity, 'view')
  })

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <User2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Pro-Win</span>
                  <span className="truncate text-xs">Module prospection</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map(item => {
                // If item has subitems, render as collapsible
                if (item.subitems) {
                  const isAnySubitemActive = item.subitems.some(subitem =>
                    isActiveRoute(subitem.url)
                  )

                  return (
                    <Collapsible
                      key={item.title}
                      open={openMenus[item.title] ?? isAnySubitemActive}
                      onOpenChange={open => setOpenMenus(prev => ({ ...prev, [item.title]: open }))}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title}>
                            <item.icon />
                            <span>{item.title}</span>
                            <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subitems.map(subitem => (
                              <SidebarMenuSubItem key={subitem.title}>
                                {subitem.isSection ? (
                                  // Pour les sections, utiliser un bouton avec scroll et état actif basé sur le scroll
                                  <SidebarMenuSubButton
                                    onClick={() => handleScrollToSection(subitem.id)}
                                    isActive={activeSection === subitem.id}
                                  >
                                    <span>{subitem.title}</span>
                                  </SidebarMenuSubButton>
                                ) : (
                                  // Pour les vraies sous-pages, utiliser un lien
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isActiveRoute(subitem.url, item.subitems)}
                                  >
                                    <Link to={subitem.url}>
                                      <span>{subitem.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                )}
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                }

                // Regular menu item without subitems
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild={!item.disabled}
                      isActive={isActiveRoute(item.url)}
                      disabled={item.disabled}
                      className={item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      {item.disabled ? (
                        <div className="flex items-center gap-2 w-full">
                          <item.icon />
                          <span>{item.title}</span>
                        </div>
                      ) : (
                        <Link to={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <User2 className="size-4" />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Utilisateur</span>
                    <span className="truncate text-xs capitalize">{currentRole}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem>Profil</DropdownMenuItem>
                <DropdownMenuItem>Paramètres</DropdownMenuItem>
                <DropdownMenuItem disabled className="text-xs font-semibold">
                  Changer de rôle
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => switchRole(ROLES.ADMIN, '1')}
                  className={currentRole === ROLES.ADMIN ? 'bg-accent' : ''}
                >
                  Admin {currentRole === ROLES.ADMIN && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="text-xs">
                  Directeurs:
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => switchRole(ROLES.DIRECTEUR, '1')}
                  className={
                    currentRole === ROLES.DIRECTEUR && currentUserId === '1' ? 'bg-accent' : ''
                  }
                >
                  Fatma Gharbi {currentRole === ROLES.DIRECTEUR && currentUserId === '1' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => switchRole(ROLES.DIRECTEUR, '2')}
                  className={
                    currentRole === ROLES.DIRECTEUR && currentUserId === '2' ? 'bg-accent' : ''
                  }
                >
                  Mohamed Triki {currentRole === ROLES.DIRECTEUR && currentUserId === '2' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="text-xs">
                  Managers:
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => switchRole(ROLES.MANAGER, '5')}
                  className={
                    currentRole === ROLES.MANAGER && currentUserId === '5' ? 'bg-accent' : ''
                  }
                >
                  Ahmed Ben Salem {currentRole === ROLES.MANAGER && currentUserId === '5' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => switchRole(ROLES.MANAGER, '6')}
                  className={
                    currentRole === ROLES.MANAGER && currentUserId === '6' ? 'bg-accent' : ''
                  }
                >
                  Sarra Khelifi {currentRole === ROLES.MANAGER && currentUserId === '6' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="text-xs">
                  Commerciaux:
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => switchRole(ROLES.COMMERCIAL, '10')}
                  className={
                    currentRole === ROLES.COMMERCIAL && currentUserId === '10' ? 'bg-accent' : ''
                  }
                >
                  Ahmed Ben Ali {currentRole === ROLES.COMMERCIAL && currentUserId === '10' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => switchRole(ROLES.COMMERCIAL, '11')}
                  className={
                    currentRole === ROLES.COMMERCIAL && currentUserId === '11' ? 'bg-accent' : ''
                  }
                >
                  Sarra Mejri {currentRole === ROLES.COMMERCIAL && currentUserId === '11' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => switchRole(ROLES.COMMERCIAL, '12')}
                  className={
                    currentRole === ROLES.COMMERCIAL && currentUserId === '12' ? 'bg-accent' : ''
                  }
                >
                  Karim Ouali {currentRole === ROLES.COMMERCIAL && currentUserId === '12' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem>Se déconnecter</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
