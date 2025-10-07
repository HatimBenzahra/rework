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
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRole } from '@/contexts/RoleContext'
import { hasPermission } from '@/utils/roleFilters'

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
    title: 'Commerciaux',
    url: '/commerciaux',
    icon: Inbox,
    entity: 'commerciaux',
  },
  {
    title: 'Managers',
    url: '/managers',
    icon: Calendar,
    entity: 'managers',
  },
  {
    title: 'Directeurs',
    url: '/directeurs',
    icon: Search,
    entity: 'directeurs',
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
    title: 'Paramètres',
    url: '/settings',
    icon: Settings,
    entity: null, // Paramètres toujours visibles
  },
]

export function AppSidebar() {
  const { currentRole } = useRole()

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
                  <SidebarMenuButton asChild>
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
                <DropdownMenuItem>Se déconnecter</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
