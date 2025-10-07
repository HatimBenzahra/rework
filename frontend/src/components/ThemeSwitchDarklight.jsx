import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

/**
 * Composant de bouton pour basculer entre le mode clair et sombre
 *
 * Exemple d'utilisation:
 * ```jsx
 * import ThemeToggle from '@/components/ThemeToggle'
 *
 * function Header() {
 *   return (
 *     <header>
 *       <h1>Mon App</h1>
 *       <ThemeToggle />
 *     </header>
 *   )
 * }
 * ```
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Basculer le thème</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
