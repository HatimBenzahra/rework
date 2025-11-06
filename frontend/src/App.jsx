import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/toast'
import { RoleProvider } from '@/contexts/RoleContext'
import { useRole } from '@/contexts/userole'
import { DetailsSectionsProvider } from '@/contexts/DetailsSectionsContext'
// Import Auth Pages
import Login from '@/pages-AUTH/Login'
// Import Admin/Directeur/Manager Layout & Pages
import { AppSidebar } from '@/components/sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import ThemeToggle from '@/components/ThemeSwitchDarklight'
import ThemeSelector from '@/components/Theme'
import Dashboard from '@/pages-ADMIN-DIRECTEUR/dashboard/Dashboard'
import Commerciaux from '@/pages-ADMIN-DIRECTEUR/commercial/Commerciaux'
import Managers from '@/pages-ADMIN-DIRECTEUR/managers/Managers'
import Directeurs from '@/pages-ADMIN-DIRECTEUR/directeurs/Directeurs'
import Immeubles from '@/pages-ADMIN-DIRECTEUR/immeubles/Immeubles'
import Zones from '@/pages-ADMIN-DIRECTEUR/zones/Zones'
import HistoriqueZones from '@/pages-ADMIN-DIRECTEUR/zones/HistoriqueZones'
import AssignationsEnCours from '@/pages-ADMIN-DIRECTEUR/zones/AssignationsEnCours'
import CommercialDetails from '@/pages-ADMIN-DIRECTEUR/commercial/CommercialDetails'
import ManagerDetails from '@/pages-ADMIN-DIRECTEUR/managers/ManagerDetails'
import DirecteurDetails from '@/pages-ADMIN-DIRECTEUR/directeurs/DirecteurDetails'
import ImmeubleDetails from '@/pages-ADMIN-DIRECTEUR/immeubles/ImmeubleDetails'
import ZoneDetails from '@/pages-ADMIN-DIRECTEUR/zones/ZoneDetails'
import GPSTracking from '@/pages-ADMIN-DIRECTEUR/gps-tracking/GPSTracking'
import EcouteLive from '@/pages-ADMIN-DIRECTEUR/ecoutes/EcouteLive'
import Enregistrement from '@/pages-ADMIN-DIRECTEUR/ecoutes/Enregistrement'
import Statistiques from '@/pages-ADMIN-DIRECTEUR/statistiques/Statistiques'
import Gestion from '@/pages-ADMIN-DIRECTEUR/gestion/Gestion'
// Import Commercial Layouts & Pages
import CommercialLayoutComponent from '@/pages-COMMERCIAL-MANAGER/layouts/CommercialLayout'
import CommercialDashboard from '@/pages-COMMERCIAL-MANAGER/dashboard/CommercialDashboard'
import ImmeublesList from '@/pages-COMMERCIAL-MANAGER/immeubles/ImmeublesList'
import Historique from '@/pages-COMMERCIAL-MANAGER/historique/Historique'
import PortesGestion from '@/pages-COMMERCIAL-MANAGER/portes/PortesGestion'
import PortesLecture from '@/pages-COMMERCIAL-MANAGER/portes/PortesLecture'
import TeamManagement from '@/pages-COMMERCIAL-MANAGER/team/TeamManagement'
// Layout pour Admin/Directeur/Manager (avec sidebar)
function AdminLayout() {
  return (
    <DetailsSectionsProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="overflow-x-hidden">
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <h1 className="font-semibold truncate">Tableau de bord</h1>
            </div>
            <div className="flex items-center gap-2 px-4">
              <ThemeSelector />
              <ThemeToggle />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-6 pt-6 overflow-x-hidden mx-auto w-11/12 max-w-[1400px]">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/commerciaux" element={<Commerciaux />} />
              <Route path="/commerciaux/:id" element={<CommercialDetails />} />
              <Route path="/managers" element={<Managers />} />
              <Route path="/managers/:id" element={<ManagerDetails />} />
              <Route path="/directeurs" element={<Directeurs />} />
              <Route path="/directeurs/:id" element={<DirecteurDetails />} />
              <Route path="/immeubles" element={<Immeubles />} />
              <Route path="/immeubles/:id" element={<ImmeubleDetails />} />
              <Route path="/zones" element={<Zones />} />
              <Route path="/zones/historique" element={<HistoriqueZones />} />
              <Route path="/zones/assignations" element={<AssignationsEnCours />} />
              <Route path="/zones/:id" element={<ZoneDetails />} />
              <Route path="/gestion" element={<Gestion />} />
              <Route path="/gps-tracking" element={<GPSTracking />} />
              <Route path="/ecoutes" element={<Navigate to="/ecoutes/live" replace />} />
              <Route path="/ecoutes/live" element={<EcouteLive />} />
              <Route path="/ecoutes/enregistrement" element={<Enregistrement />} />
              <Route path="/statistiques" element={<Statistiques />} />
            </Routes>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </DetailsSectionsProvider>
  )
}
// Layout pour Commercial (sans sidebar, interface mobile) && light mode pour les pages commerciales
function CommercialLayout() {
  return (
    <div className="light" data-theme="light">
      <Routes>
        {/* Toutes les routes sous CommercialLayout pour éviter les déconnexions LiveKit */}
        <Route element={<CommercialLayoutComponent />}>
          <Route path="/" element={<CommercialDashboard />} />
          <Route path="/immeubles" element={<ImmeublesList />} />
          <Route path="/historique" element={<Historique />} />
          <Route path="/equipe" element={<TeamManagement />} />
          <Route path="/portes/:immeubleId" element={<PortesGestion />} />
          <Route path="/portes/lecture/:immeubleId" element={<PortesLecture />} />
        </Route>

        {/* Fallback */}
        <Route path="/*" element={<CommercialDashboard />} />
      </Routes>
    </div>
  )
}

// Composant principal qui route selon le rôle
function AppRouter() {
  const { isCommercial, isManager } = useRole()

  // Si l'utilisateur est commercial, afficher l'interface dédiée
  if (isCommercial || isManager) {
    return <CommercialLayout />
  }

  // Sinon, afficher l'interface admin/manager/directeur
  return <AdminLayout />
}

function App() {
  return (
    <ToastProvider>
      <RoleProvider>
        <Routes>
          {/* Route publique pour la page de login */}
          <Route path="/login" element={<Login />} />

          {/* Routes protégées */}
          <Route path="/*" element={<AppRouter />} />
        </Routes>
      </RoleProvider>
    </ToastProvider>
  )
}

export default App
