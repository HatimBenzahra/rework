export default function Dashboard() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenue dans votre espace de gestion.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Sélectionnez une section</h2>
          <p className="text-muted-foreground">
            Utilisez la navigation à gauche pour accéder aux différentes sections.
          </p>
        </div>
      </div>
    </div>
  )
}