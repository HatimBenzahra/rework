import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserX, Plus } from 'lucide-react'
import UserCard from './UserCard'

/**
 * Panneau latéral affichant les utilisateurs non assignés
 */
export default function UnassignedPanel({ managers, commercials, onAddUser, isAdmin }) {
  const hasUnassigned = managers.length > 0 || commercials.length > 0

  if (!hasUnassigned && !isAdmin) {
    return null
  }

  return (
    <Card className="w-full md:w-80 flex-shrink-0 p-4 space-y-4 h-fit md:sticky md:top-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        <UserX className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">Non assignés</h3>
      </div>

      {!hasUnassigned ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <UserX className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Aucun utilisateur non assigné</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Managers non assignés */}
          {managers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Managers ({managers.length})
                </h4>
              </div>
              <div className="space-y-2">
                {managers.map(manager => (
                  <UserCard key={manager.id} user={manager} type="manager" />
                ))}
              </div>
            </div>
          )}

          {/* Commerciaux non assignés */}
          {commercials.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Commerciaux ({commercials.length})
                </h4>
              </div>
              <div className="space-y-2">
                {commercials.map(commercial => (
                  <UserCard key={commercial.id} user={commercial} type="commercial" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Boutons d'ajout */}
      {isAdmin && (
        <div className="space-y-2 pt-2 border-t">
          <Button
            onClick={() => onAddUser('manager')}
            size="sm"
            variant="outline"
            className="w-full"
          >
            <Plus className="h-3 w-3 mr-1" />
            Ajouter un manager
          </Button>
          <Button
            onClick={() => onAddUser('commercial')}
            size="sm"
            variant="outline"
            className="w-full"
          >
            <Plus className="h-3 w-3 mr-1" />
            Ajouter un commercial
          </Button>
        </div>
      )}
    </Card>
  )
}
