import React from 'react'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-[9999]">
      <div className="flex flex-col items-center justify-center gap-12">
        {/* Texte Pro-Win avec animation d'écriture */}
        <div className="relative flex items-center justify-center">
          <h1 className="text-7xl md:text-9xl font-bold tracking-tight relative">
            {/* Conteneur avec overflow hidden pour l'effet d'écriture */}
            <span className="relative inline-block">
              {/* Texte avec gradient animé qui passe dessus */}
              <span className="relative inline-block animate-write-text">
                <span className="bg-gradient-to-r from-primary via-primary/70 to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient">
                  Pro-Win
                </span>
              </span>

              {/* Curseur clignotant qui suit l'écriture */}
              <span className="absolute -right-1 md:-right-2 top-0 bottom-0 w-0.5 md:w-1 bg-primary animate-blink animation-delay-1000"></span>
            </span>
          </h1>
        </div>

        {/* Sous-titre avec fade-in */}
        <p className="text-center text-muted-foreground text-base md:text-xl font-medium animate-fade-in-up opacity-0 animation-delay-1000">
          Module prospection
        </p>

        {/* Points de chargement animés */}
        <div className="flex gap-2 animate-fade-in opacity-0 animation-delay-1000">
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce"></div>
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce animation-delay-200"></div>
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce animation-delay-400"></div>
        </div>
      </div>
    </div>
  )
}
