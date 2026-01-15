import { AdvancedDataTable } from '@/components/tableau'
import { TableSkeleton } from '@/components/LoadingSkeletons'
import AssignedZoneCard from '@/components/AssignedZoneCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { LayoutList, Map, Info, Building, FileText, Percent } from 'lucide-react'
import { useImmeublesLogic } from './useImmeublesLogic'

export default function Immeubles() {
  const {
    viewMode,
    setViewMode,
    immeublesLoading,
    description,
    tableData,
    immeublesColumns,
    getImmeublesEditFields,
    permissions,
    handleEditImmeuble,
    handleDeleteImmeuble,
    filteredImmeubles,
    stats,
  } = useImmeublesLogic()

  if (immeublesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Immeubles</h1>
          <p className="text-muted-foreground text-base">
            Gestion du patrimoine immobilier et suivi des propriétés
          </p>
        </div>
        <TableSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Banner Explicatif */}
      <Alert className="bg-primary/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-primary/10 rounded-full mt-1">
            <Info className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1">
            <AlertTitle className="text-primary font-semibold">
              Organisation des Immeubles
            </AlertTitle>
            <AlertDescription className="text-muted-foreground text-sm leading-relaxed">
              Les immeubles sont le cœur de votre patrimoine. Ils sont organisés par adresse et peuvent
              être assignés à des commerciaux ou des managers. Utilisez la vue carte pour visualiser
              leur répartition géographique.
            </AlertDescription>
          </div>
        </div>
      </Alert>

      {/* Cartes de Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="transition-all duration-300 hover:shadow-lg hover:border-primary/20 dark:hover:border-primary/20 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Immeubles
            </CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <Building className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {stats.totalImmeubles}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Dans votre parc immobilier</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:border-primary/20 dark:hover:border-primary/20 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contrats Signés
            </CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-full">
              <FileText className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {stats.totalContrats}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total cumulé des signatures</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:border-primary/20 dark:hover:border-primary/20 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Couverture Moy.
            </CardTitle>
            <div className="p-2 bg-violet-500/10 rounded-full">
              <Percent className="h-4 w-4 text-violet-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {stats.avgCouverture}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Portes prospectées</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        {/* Toggle entre vue liste et vue carte */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
            className="gap-2"
          >
            <LayoutList className="h-4 w-4" />
            Vue Liste
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            onClick={() => setViewMode('map')}
            className="gap-2"
          >
            <Map className="h-4 w-4" />
            Vue Carte
          </Button>
        </div>
      </div>

      {/* Affichage conditionnel basé sur viewMode */}
      {viewMode === 'list' ? (
        <AdvancedDataTable
          showStatusColumn={false}
          title="Liste des Immeubles"
          description={description}
          data={tableData}
          columns={immeublesColumns}
          searchKey="address"
          detailsPath="/immeubles"
          editFields={getImmeublesEditFields}
          onEdit={permissions.canEdit ? handleEditImmeuble : undefined}
          onDelete={permissions.canDelete ? handleDeleteImmeuble : undefined}
        />
      ) : (
        <AssignedZoneCard
          showAllImmeubles={true}
          allImmeubles={filteredImmeubles}
          fullWidth={true}
        />
      )}
    </div>
  )
}
