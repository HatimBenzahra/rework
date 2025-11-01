import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Building2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useDndContext } from '@dnd-kit/core'
import { useState, useEffect } from 'react'
import UserCard from './UserCard'
import DropZone from './DropZone'

/**
 * Composant d'arbre hiérarchique de l'organisation
 * Affiche la structure en colonnes: Directeurs | Managers | Commerciaux
 * Chaque directeur a son propre arbre vertical
 */
export default function OrganizationTree({ data, onAddUser, isAdmin, isDirecteur, currentUserId }) {
  // Filtrer les directeurs selon les permissions
  const visibleDirecteurs = isDirecteur ? data.filter(d => d.id === currentUserId) : data

  // État pour le carousel
  const [currentIndex, setCurrentIndex] = useState(0)

  // Hook pour détecter la taille de l'écran
  const [directeursPerSlide, setDirecteursPerSlide] = useState(1)

  useEffect(() => {
    const updateDirecteursPerSlide = () => {
      // 2 directeurs sur écran >= 1280px, sinon 1
      setDirecteursPerSlide(window.innerWidth >= 1280 ? 2 : 1)
    }

    // Initialiser
    updateDirecteursPerSlide()

    // Écouter les changements de taille
    window.addEventListener('resize', updateDirecteursPerSlide)
    return () => window.removeEventListener('resize', updateDirecteursPerSlide)
  }, [])

  // Réinitialiser l'index si le nombre de slides change
  useEffect(() => {
    const newTotalSlides = Math.ceil(visibleDirecteurs.length / directeursPerSlide)
    if (currentIndex >= newTotalSlides) {
      setCurrentIndex(Math.max(0, newTotalSlides - 1))
    }
  }, [directeursPerSlide, visibleDirecteurs.length, currentIndex])

  // Calculer le nombre total de slides
  const totalSlides = Math.ceil(visibleDirecteurs.length / directeursPerSlide)

  // Obtenir les directeurs pour le slide actuel
  const getCurrentDirecteurs = () => {
    const start = currentIndex * directeursPerSlide
    const end = start + directeursPerSlide
    return visibleDirecteurs.slice(start, end)
  }

  // Navigation
  const goToPrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : totalSlides - 1))
  }

  const goToNext = () => {
    setCurrentIndex(prev => (prev < totalSlides - 1 ? prev + 1 : 0))
  }

  const goToSlide = index => {
    setCurrentIndex(index)
  }

  if (!visibleDirecteurs || visibleDirecteurs.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground text-lg mb-4">Aucun directeur dans l'organisation</p>
        {isAdmin && (
          <Button onClick={() => onAddUser('directeur')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un directeur
          </Button>
        )}
      </Card>
    )
  }

  // Si un seul directeur, pas besoin de carousel
  if (visibleDirecteurs.length === 1) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1">
          <DirecteurTree directeur={visibleDirecteurs[0]} onAddUser={onAddUser} isAdmin={isAdmin} />
        </div>
      </div>
    )
  }

  // En mode mobile (< 768px) avec 2 directeurs ou moins, afficher tous en vertical sans carousel
  if (typeof window !== 'undefined' && window.innerWidth < 768 && visibleDirecteurs.length <= 2) {
    return (
      <div className="space-y-6">
        <div className="text-sm text-muted-foreground">
          {visibleDirecteurs.length} directeur{visibleDirecteurs.length > 1 ? 's' : ''} dans
          l'organisation
        </div>
        <div className="space-y-6">
          {visibleDirecteurs.map(directeur => (
            <DirecteurTree
              key={directeur.id}
              directeur={directeur}
              onAddUser={onAddUser}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Directeurs {currentIndex * directeursPerSlide + 1}-
            {Math.min((currentIndex + 1) * directeursPerSlide, visibleDirecteurs.length)} sur{' '}
            {visibleDirecteurs.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton Précédent */}
          <Button
            onClick={goToPrevious}
            variant="outline"
            size="icon"
            disabled={currentIndex === 0}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Indicateurs de pagination */}
          <div className="flex gap-1">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-6 bg-primary'
                    : 'w-2 bg-primary/20 hover:bg-primary/40'
                }`}
                aria-label={`Aller au slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Bouton Suivant */}
          <Button
            onClick={goToNext}
            variant="outline"
            size="icon"
            disabled={currentIndex === totalSlides - 1}
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contenu du carousel */}
      <div className="overflow-hidden">
        <div className={`grid gap-6 ${directeursPerSlide === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {getCurrentDirecteurs().map(directeur => (
            <DirecteurTree
              key={directeur.id}
              directeur={directeur}
              onAddUser={onAddUser}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Arbre vertical pour un directeur avec ses managers et commerciaux
 */
function DirecteurTree({ directeur, onAddUser, isAdmin }) {
  const hasManagers = directeur.managers && directeur.managers.length > 0
  const hasDirectCommercials = directeur.directCommercials && directeur.directCommercials.length > 0

  // Récupérer le contexte du drag pour savoir ce qui est en cours de drag
  const { active } = useDndContext()
  const draggedType = active?.id?.split('-')[0]

  return (
    <Card className="p-6 space-y-6 border-2">
      {/* Niveau 1: Directeur - Zone droppable pour les managers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Directeur</h3>
        </div>
        <div className="relative">
          <UserCard user={directeur} type="directeur" showGrip={false} />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Glissez un manager ici pour l'assigner à ce directeur
          </p>
        </div>
      </div>

      {/* Ligne de séparation */}
      <div className="border-t-2 border-dashed" />

      {/* Niveau 2 & 3: Managers et leurs Commerciaux */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-muted-foreground">
            Managers ({hasManagers ? directeur.managers.length : 0})
          </h4>
        </div>

        {/* Drop zone pour les managers */}
        <DropZone
          id={`dropzone-manager-${directeur.id}`}
          acceptedType="manager"
          emptyMessage="Glissez un manager ici"
          isDraggingWrongType={draggedType && draggedType !== 'manager'}
        >
          {hasManagers ? (
            <div className="space-y-4">
              {directeur.managers.map(manager => (
                <ManagerNode
                  key={manager.id}
                  manager={manager}
                  onAddUser={onAddUser}
                  isAdmin={isAdmin}
                  draggedType={draggedType}
                  directeurId={directeur.id}
                />
              ))}
            </div>
          ) : null}
        </DropZone>
      </div>

      {/* Commerciaux directs */}
      {hasDirectCommercials && (
        <>
          <div className="border-t-2 border-dashed" />
          <div className="space-y-3">
            <div className="space-y-1">
              <h4 className="font-semibold text-muted-foreground">
                Commerciaux directs ({directeur.directCommercials.length})
              </h4>
              <p className="text-xs text-muted-foreground">
                Commerciaux rattachés directement au directeur, sans manager intermédiaire
              </p>
            </div>
            <DropZone
              id={`dropzone-direct-commercial-${directeur.id}`}
              acceptedType="commercial"
              emptyMessage="Glissez un commercial ici"
              isDraggingWrongType={draggedType && draggedType !== 'commercial'}
            >
              <div className="space-y-2 pl-4 border-l-2">
                {directeur.directCommercials.map(commercial => (
                  <div key={commercial.id} className="flex items-center gap-2 min-w-0">
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <UserCard user={commercial} type="commercial" />
                    </div>
                    {isAdmin && (
                      <Button
                        onClick={() => onAddUser('commercial', directeur.id)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 flex-shrink-0"
                        title="Ajouter un commercial"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </DropZone>
          </div>
        </>
      )}
    </Card>
  )
}

/**
 * Nœud pour un manager avec ses commerciaux
 */
function ManagerNode({ manager, onAddUser, isAdmin, draggedType, directeurId }) {
  const hasCommercials = manager.commercials && manager.commercials.length > 0

  return (
    <Card className="p-4 space-y-3 bg-card/50 border-l-4 border-l-primary/30">
      {/* Manager */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <UserCard user={manager} type="manager" />
          </div>
          {isAdmin && (
            <Button
              onClick={() => onAddUser('manager', directeurId)}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              title="Ajouter un manager"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Commerciaux du manager avec drop zone */}
      <div className="space-y-2 pl-4 border-l-2 border-dashed">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">
            Commerciaux ({hasCommercials ? manager.commercials.length : 0})
          </p>
        </div>

        {/* Drop zone pour les commerciaux */}
        <DropZone
          id={`dropzone-commercial-${manager.id}`}
          acceptedType="commercial"
          emptyMessage="Glissez un commercial ici"
          isDraggingWrongType={draggedType && draggedType !== 'commercial'}
          className="min-h-[60px]"
        >
          {hasCommercials ? (
            <div className="space-y-2">
              {manager.commercials.map(commercial => (
                <div key={commercial.id} className="flex items-center gap-2">
                  <div className="flex-1">
                    <UserCard user={commercial} type="commercial" />
                  </div>
                  {isAdmin && (
                    <Button
                      onClick={() => onAddUser('commercial', manager.id)}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      title="Ajouter un commercial"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </DropZone>
      </div>
    </Card>
  )
}
