import {
  Calendar,
  Home,
  Inbox,
  Search,
  Settings,
  ChevronUp,
  User2,
  Building2,
  MapPin,
  Navigation2,
  Headphones,
  BarChart3,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useRole } from '@/contexts/userole'
import { hasPermission, ROLES } from '@/hooks/metier/roleFilters'

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
  },
  {
    title: 'Suivi GPS',
    url: '/gps-tracking',
    icon: Navigation2,
    entity: 'gps-tracking',
  },
  {
    title: 'Écoutes',
    url: '/ecoutes',
    icon: Headphones,
    entity: 'ecoutes',
  },
  {
    title: 'Statistiques',
    url: '/statistiques',
    icon: BarChart3,
    entity: 'statistics',
  },
  {
    title: 'Paramètres',
    url: '/settings',
    icon: Settings,
    entity: null, // Paramètres toujours visibles
  },
]

export function AppSidebar() {
  const { currentRole, currentUserId } = useRole()
  const location = useLocation()

  const normalizePath = value => {
    if (!value) return ''
    return value.replace(/\/+$/, '') || '/'
  }

  const isActiveRoute = path => {
    const currentPath = normalizePath(location.pathname)
    const targetPath = normalizePath(path)

    if (!targetPath) return false
    if (targetPath === '/') {
      return currentPath === '/'
    }
    return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
  }

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

  // Filtrer les éléments du menu selon les permissions
  const visibleItems = items.filter(item => {
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
                  <span className="truncate font-semibold">Mon App</span>
                  <span className="truncate text-xs">Gestion commerciale</span>
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
              {visibleItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActiveRoute(item.url)}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
