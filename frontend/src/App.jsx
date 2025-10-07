import { Routes, Route } from 'react-router-dom'
import { AppSidebar } from '@/components/sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import ThemeToggle from '@/components/ThemeSwitchDarklight'
import ThemeSelector from '@/components/Theme'
import Dashboard from '@/pages/Dashboard'
import Commerciaux from '@/pages/Commerciaux'
import Managers from '@/pages/Managers'
import Directeurs from '@/pages/Directeurs'

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
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/commerciaux" element={<Commerciaux />} />
            <Route path="/managers" element={<Managers />} />
            <Route path="/directeurs" element={<Directeurs />} />
          </Routes>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
