import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import { initTheme } from './config/theme'

// Initialise le thème avant le rendu de l'application
initTheme()

// Créer une instance de QueryClient avec configuration optimisée
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - données considérées fraîches
      cacheTime: 10 * 60 * 1000, // 10 minutes - garde en cache
      refetchOnWindowFocus: false, // Ne pas refetch au focus
      retry: 1, // 1 retry en cas d'erreur
    },
    mutations: {
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)
