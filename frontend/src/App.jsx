import { Routes, Route } from 'react-router-dom'
import { AppSidebar } from '@/components/sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import ThemeToggle from '@/components/ThemeSwitchDarklight'
import ThemeSelector from '@/components/Theme'
import Dashboard from '@/pages/dashboard/Dashboard'
import Commerciaux from '@/pages/commercial/Commerciaux'
import Managers from '@/pages/managers/Managers'
import Directeurs from '@/pages/directeurs/Directeurs'
import Immeubles from '@/pages/immeubles/Immeubles'
import Zones from '@/pages/zones/Zones'
import CommercialDetails from '@/pages/commercial/CommercialDetails'
import ManagerDetails from '@/pages/managers/ManagerDetails'
import DirecteurDetails from '@/pages/directeurs/DirecteurDetails'
import ImmeubleDetails from '@/pages/immeubles/ImmeubleDetails'
import ZoneDetails from '@/pages/zones/ZoneDetails'

function App() {
  return (
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
        <div className="flex flex-1 flex-col gap-4 p-6 pt-6 overflow-x-hidden">
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
            <Route path="/zones/:id" element={<ZoneDetails />} />
          </Routes>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
