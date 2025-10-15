import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Building2, Plus, Search, ArrowUp, Key, MapPin, DoorOpen } from 'lucide-react'
import { useRole } from '@/contexts/RoleContext'
import { useCommercialFull } from '@/hooks/use-api'
import { immeubleApi } from '@/services/api-service'
import AddImmeubleModal from '@/components/AddImmeubleModal'
import { useNavigate } from 'react-router-dom'
import { useCommercialTheme } from '@/hooks/use-commercial-theme'

export default function ImmeublesList() {
  const { currentUserId } = useRole()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  // Hook pour le thème commercial - centralise TOUS les styles
  const { base, components, getButtonClasses, getInputClasses } = useCommercialTheme()

  const {
    data: commercial,
    loading: commercialLoading,
    refetch,
  } = useCommercialFull(parseInt(currentUserId))

  // Filter immeubles based on search query
  const filteredImmeubles =
    commercial?.immeubles?.filter(immeuble =>
      immeuble.adresse.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

  const handleAddImmeuble = async immeubleData => {
    try {
      // Add the current commercial ID to the data
      const dataWithCommercial = {
        ...immeubleData,
        commercialId: parseInt(currentUserId),
      }

      // Call the GraphQL mutation to create the immeuble
      await immeubleApi.create(dataWithCommercial)

      // Refetch data after successful creation
      await refetch()
    } catch (error) {
      console.error('Error creating immeuble:', error)
      // You might want to show a toast notification here
    }
  }

  if (commercialLoading) {
    return (
      <div className={components.loading.container}>
        <div className="text-center">
          <div className={`${components.loading.spinner} mx-auto mb-4`}></div>
          <p className={components.loading.text}>Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${base.text.primary}`}>Mes Immeubles</h1>
            <p className={base.text.muted}>Gérez vos immeubles assignés</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => setShowAddModal(true)}
            className={`flex items-center space-x-2 ${getButtonClasses('primary')}`}
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter</span>
          </Button>
        </div>

        {/* Stats summary - Responsive grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <Card className={`${base.bg.card} ${base.border.card}`}>
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${base.text.muted} mb-1`}>Immeubles</p>
                  <p className={`text-xl md:text-2xl font-bold ${base.text.primary}`}>
                    {filteredImmeubles.length}
                  </p>
                </div>
                <div className="p-2 md:p-2.5 rounded-lg border border-gray-200 bg-gray-50 flex-shrink-0">
                  <Building2 className={`h-4 w-4 md:h-5 md:w-5 ${base.icon.default}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${base.bg.card} ${base.border.card} `}>
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${base.text.muted} mb-1`}>Total portes</p>
                  <p className={`text-xl md:text-2xl font-bold ${base.text.primary}`}>
                    {filteredImmeubles.reduce(
                      (total, i) => total + i.nbEtages * i.nbPortesParEtage,
                      0
                    )}
                  </p>
                </div>
                <div className="p-2 md:p-2.5 rounded-lg border border-gray-200 bg-gray-50 flex-shrink-0">
                  <Key className={`h-4 w-4 md:h-5 md:w-5 ${base.icon.default}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${base.icon.muted}`}
          />
          <Input
            placeholder="Rechercher une adresse..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={getInputClasses(true)}
          />
        </div>
      </div>

      {/* Immeubles grid */}
      <div>
        {filteredImmeubles.length === 0 ? (
          <Card className={`p-8 ${base.bg.card} ${base.border.card}`}>
            <div className="text-center">
              <div
                className={`inline-flex p-4 rounded-lg border ${base.border.default} ${base.bg.muted} mb-4`}
              >
                <Building2 className={`h-12 w-12 ${base.icon.default}`} />
              </div>
              <h3 className={`text-lg font-medium ${base.text.primary} mb-2`}>
                {searchQuery ? 'Aucun résultat' : 'Aucun immeuble'}
              </h3>
              <p className={`${base.text.muted} mb-4`}>
                {searchQuery
                  ? 'Aucun immeuble ne correspond à votre recherche'
                  : "Vous n'avez pas encore d'immeubles assignés"}
              </p>
              {!searchQuery && (
                <Button
                  variant="ghost"
                  onClick={() => setShowAddModal(true)}
                  className={getButtonClasses('primary')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter votre premier immeuble
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredImmeubles.map(immeuble => (
              <Card
                key={immeuble.id}
                className={`${components.card.base} ${components.card.hover}`}
              >
                <CardContent className="p-5">
                  <div className="space-y-4">
                    {/* Address header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div
                          className={`p-2 rounded-lg border ${base.border.default} ${base.bg.muted} flex-shrink-0`}
                        >
                          <MapPin className={`h-4 w-4 ${base.icon.default}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`font-semibold text-base leading-tight mb-1 ${base.text.primary}`}
                            title={immeuble.adresse}
                          >
                            {immeuble.adresse}
                          </h3>
                          <p className={`text-xs ${base.text.muted}`}>
                            {new Date(immeuble.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Building info grid */}
                    <div className={`grid grid-cols-2 gap-4 pt-2 border-t ${base.border.default}`}>
                      <div className="space-y-1">
                        <p className={`text-xs ${base.text.muted}`}>Étages</p>
                        <div className="flex items-center space-x-2">
                          <Building2 className={`h-4 w-4 ${base.icon.default}`} />
                          <span className={`font-semibold text-sm ${base.text.primary}`}>
                            {immeuble.nbEtages}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className={`text-xs ${base.text.muted}`}>Portes/étage</p>
                        <div className="flex items-center space-x-2">
                          <Key className={`h-4 w-4 ${base.icon.default}`} />
                          <span className={`font-semibold text-sm ${base.text.primary}`}>
                            {immeuble.nbPortesParEtage}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Badges row */}
                    <div className={`flex flex-wrap gap-2 pt-2 border-t ${base.border.default}`}>
                      <Badge
                        variant={immeuble.ascenseurPresent ? 'default' : 'secondary'}
                        className={components.badge.default}
                      >
                        <ArrowUp className="h-3 w-3 mr-1" />
                        {immeuble.ascenseurPresent ? 'Ascenseur' : 'Sans ascenseur'}
                      </Badge>

                      {immeuble.digitalCode && (
                        <Badge variant="outline" className={components.badge.outline}>
                          <Key className="h-3 w-3 mr-1" />
                          Code: {immeuble.digitalCode}
                        </Badge>
                      )}
                    </div>

                    {/* Total doors */}
                    <div
                      className={`p-3 rounded-lg border ${base.border.default} ${base.bg.muted}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${base.text.muted}`}>Total des portes</span>
                        <span className={`text-xl font-bold ${base.text.primary}`}>
                          {immeuble.nbEtages * immeuble.nbPortesParEtage}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <Button
                      variant="ghost"
                      onClick={e => {
                        e.stopPropagation()
                        navigate(`/portes/${immeuble.id}`)
                      }}
                      className={`w-full ${getButtonClasses('primary')}`}
                      size="sm"
                    >
                      <DoorOpen className="h-4 w-4 mr-2" />
                      Gérer les portes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Immeuble Modal */}
      <AddImmeubleModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSave={handleAddImmeuble}
      />
    </div>
  )
}
