import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Building2, Plus, Search, ArrowUp, Key, MapPin } from 'lucide-react'
import { useRole } from '@/contexts/RoleContext'
import { useCommercialFull } from '@/hooks/use-api'
import { useCommercialTheme } from '@/hooks/use-commercial-theme'
import { immeubleApi } from '@/services/api-service'
import AddImmeubleModal from '@/components/AddImmeubleModal'

export default function ImmeublesList() {
  const { currentUserId } = useRole()
  const { getCardClasses } = useCommercialTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

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
      <div className="flex-1 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-0 flex-1">
      {/* Content */}
      <div className="px-6 py-6">
        <div className="space-y-6">
          {/* Page header */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Mes Immeubles</h1>
                <p className="text-muted-foreground">Gérez vos immeubles assignés</p>
              </div>
              <Button
                onClick={() => setShowAddModal(true)}
                className={`flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white`}
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter</span>
              </Button>
            </div>

            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-lg ${getCardClasses('visits')}`}>
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{filteredImmeubles.length}</p>
                      <p className="text-xs text-muted-foreground">Immeubles</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-lg ${getCardClasses('contracts')}`}>
                      <ArrowUp className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {filteredImmeubles.filter(i => i.ascenseurPresent).length}
                      </p>
                      <p className="text-xs text-muted-foreground">Avec ascenseur</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-lg ${getCardClasses('appointments')}`}>
                      <Key className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {filteredImmeubles.reduce(
                          (total, i) => total + i.nbEtages * i.nbPortesParEtage,
                          0
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">Total portes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une adresse..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Immeubles grid */}
          <div>
            {filteredImmeubles.length === 0 ? (
              <Card className="p-8">
                <div className="text-center">
                  <div className={`inline-flex p-4 rounded-full ${getCardClasses('visits')} mb-4`}>
                    <Building2 className="h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    {searchQuery ? 'Aucun résultat' : 'Aucun immeuble'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery
                      ? 'Aucun immeuble ne correspond à votre recherche'
                      : "Vous n'avez pas encore d'immeubles assignés"}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => setShowAddModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
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
                    className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 border-l-blue-500"
                  >
                    <CardContent className="p-5">
                      <div className="space-y-4">
                        {/* Address header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2 flex-1">
                            <div
                              className={`p-2 rounded-lg ${getCardClasses('visits')} flex-shrink-0 mt-0.5`}
                            >
                              <MapPin className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3
                                className="font-semibold text-base leading-tight mb-1 truncate"
                                title={immeuble.adresse}
                              >
                                {immeuble.adresse}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {new Date(immeuble.createdAt).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Building info grid */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="flex items-center space-x-2 text-sm">
                            <div className={`p-1.5 rounded ${getCardClasses('visits')}`}>
                              <Building2 className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-medium">
                              {immeuble.nbEtages} étage{immeuble.nbEtages > 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm">
                            <div className={`p-1.5 rounded ${getCardClasses('appointments')}`}>
                              <Key className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-medium">
                              {immeuble.nbPortesParEtage} porte
                              {immeuble.nbPortesParEtage > 1 ? 's' : ''}/ét.
                            </span>
                          </div>
                        </div>

                        {/* Badges row */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          <Badge
                            variant={immeuble.ascenseurPresent ? 'default' : 'secondary'}
                            className={
                              immeuble.ascenseurPresent ? 'bg-green-600 hover:bg-green-700' : ''
                            }
                          >
                            <ArrowUp className="h-3 w-3 mr-1" />
                            {immeuble.ascenseurPresent ? 'Ascenseur' : 'Sans ascenseur'}
                          </Badge>

                          {immeuble.digitalCode && (
                            <Badge variant="outline" className="border-blue-300 text-blue-700">
                              <Key className="h-3 w-3 mr-1" />
                              Code: {immeuble.digitalCode}
                            </Badge>
                          )}
                        </div>

                        {/* Total doors - highlighted */}
                        <div className={`p-3 rounded-lg ${getCardClasses('visits')} border-t`}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">Total des portes</span>
                            <span className="text-lg font-bold">
                              {immeuble.nbEtages * immeuble.nbPortesParEtage}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
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
