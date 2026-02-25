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
  Trophy,
  Users,
  ArrowLeft,
} from 'lucide-react'
import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useRole } from '@/contexts/userole'
import { hasPermission, ROLES } from '@/hooks/metier/permissions/roleFilters'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible'
import { useDetailsSections } from '@/contexts/DetailsSectionsContext'
import { cn } from '@/lib/utils'
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

// Menu items avec permissions requises
const items = [
  {
    title: 'Dashboard',
    url: '/',
    icon: Home,
    entity: 'dashboard',
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
    title: 'Gamification',
    url: '/gamification',
    icon: Trophy,
    entity: 'gamification',
    subitems: [
      {
        title: 'Classement',
        url: '/gamification',
      },
      {
        title: 'Badges',
        url: '/gamification/badges',
      },
      {
        title: 'Mapping',
        url: '/gamification/mapping',
      },
      {
        title: 'Offres',
        url: '/gamification/offres',
      },
      {
        title: 'Synchronisation',
        url: '/gamification/sync',
      },
    ],
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
    disabled: true,
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
  const { currentRole, logout } = useRole()
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
        // Vérifier si on est sur une page de détail (avec un ID dans l'URL)
        const isDetailPage =
          location.pathname !== item.url && location.pathname.startsWith(item.url + '/')

        if (isDetailPage) {
          // Créer un premier sous-item pour retourner au tableau principal
          const backToListItem = {
            title: `Voir tous les ${item.title}`,
            url: item.url,
            isBackLink: true, // Marquer comme lien de retour
          }

          // Créer des sous-items à partir des sections
          const dynamicSubitems = sections.map(section => ({
            title: section.title,
            id: section.id,
            isSection: true, // Marquer comme section pour gérer différemment
          }))

          return {
            ...item,
            subitems: [backToListItem, ...dynamicSubitems], // Ajouter le lien de retour en premier
          }
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

  // Filtrer les éléments enrichis selon les permissions
  const visibleItems = enrichedItems.filter(item => {
    // Si pas d'entité spécifiée, toujours visible (Dashboard, Paramètres)
    if (!item.entity) return true

    // Vérifier si l'utilisateur a la permission de voir cette entité
    return hasPermission(currentRole, item.entity, 'view')
  })

  return (
    <Sidebar collapsible="icon" data-sidebar="sidebar">
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
                                ) : subitem.isBackLink ? (
                                  // Pour le lien de retour, utiliser un style différent avec une icône
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={false}
                                    className="font-semibold text-primary"
                                  >
                                    <Link to={subitem.url}>
                                      <ArrowLeft className="h-3 w-3 mr-1" />
                                      <span>{subitem.title}</span>
                                    </Link>
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
                      tooltip={item.disabled ? 'Fonctionnalité bientôt disponible' : undefined}
                      className={cn(
                        'gap-3 data-[sidebar-collapsed=true]:justify-center data-[sidebar-collapsed=true]:px-0',
                        item.disabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {item.disabled ? (
                        <div
                          className="flex w-full items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Fonctionnalité bientôt disponible"
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate data-[sidebar-collapsed=true]:hidden">
                            {item.title}
                          </span>
                        </div>
                      ) : (
                        <Link to={item.url} className="flex w-full items-center gap-3">
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate data-[sidebar-collapsed=true]:hidden">
                            {item.title}
                          </span>
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
          {/* Affichage des informations utilisateur */}
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={`Utilisateur - ${currentRole}`}
              className="w-full"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <User2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Utilisateur</span>
                <span className="truncate text-xs capitalize text-muted-foreground">
                  {currentRole}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* Bouton de déconnexion */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              tooltip="Se déconnecter"
              className="w-full bg-destructive/10 hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors"
              size="sm"
            >
              <ChevronUp className="h-4 w-4 rotate-180" />
              <span>Se déconnecter</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
