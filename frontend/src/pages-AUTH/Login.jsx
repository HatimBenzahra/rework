import { useState } from 'react'
import { Link } from 'react-router-dom'
import { User2, Lock, Mail } from 'lucide-react'
import ThemeToggle from '@/components/ThemeSwitchDarklight'
import ThemeSelector from '@/components/Theme'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = e => {
    e.preventDefault()
    // Pas de logique ici - juste l'interface
    console.log('Login attempt:', { email, password })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Boutons de thème en haut à droite */}
      <div className="fixed top-4 right-4 flex items-center gap-2">
        <ThemeSelector />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <User2 className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Pro-Win</h1>
          <p className="text-muted-foreground">Bienvenue dans votre espace de prospection</p>
        </div>

        {/* Formulaire de connexion */}
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Connexion</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Champ Email/Username */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email ou nom d'utilisateur
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                  placeholder="exemple@email.com"
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition shadow-lg"
            >
              Se connecter
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
