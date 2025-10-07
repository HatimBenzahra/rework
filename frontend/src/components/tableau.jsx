import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, Search, Filter, MoreHorizontal, Plus } from "lucide-react"

export function AdvancedDataTable({ 
  title, 
  description, 
  data, 
  columns,
  searchKey = "name",
  onAdd,
  addButtonText = "Ajouter"
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [statusFilter, setStatusFilter] = useState("all")

  // Filtrage et tri des données
  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => {
      const searchMatch = item[searchKey]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const statusMatch = statusFilter === "all" || 
        item.status?.toLowerCase() === statusFilter.toLowerCase()
      
      return searchMatch && statusMatch
    })

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }

    return filtered
  }, [data, searchTerm, sortConfig, statusFilter, searchKey])

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getStatusBadge = (status) => {
    const variants = {
      'actif': 'default',
      'inactif': 'secondary',
      'suspendu': 'destructive',
      'en_conge': 'outline'
    }
    
    const labels = {
      'actif': 'Actif',
      'inactif': 'Inactif', 
      'suspendu': 'Suspendu',
      'en_conge': 'En congé'
    }

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {onAdd && (
            <Button onClick={onAdd}>
              <Plus className="mr-2 h-4 w-4" />
              {addButtonText}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Barre de filtres */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Status
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrer par status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                Tous
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("actif")}>
                Actif
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("inactif")}>
                Inactif
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("suspendu")}>
                Suspendu
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("en_conge")}>
                En congé
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{data.length}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {data.filter(item => item.status === 'actif').length}
            </div>
            <div className="text-sm text-muted-foreground">Actifs</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {data.filter(item => item.status === 'inactif').length}
            </div>
            <div className="text-sm text-muted-foreground">Inactifs</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {filteredAndSortedData.length}
            </div>
            <div className="text-sm text-muted-foreground">Filtrés</div>
          </div>
        </div>

        {/* Tableau */}
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableHead 
                      key={index} 
                      className={`${column.className || ''} ${column.sortable ? 'cursor-pointer hover:bg-muted' : ''}`}
                      onClick={() => column.sortable && handleSort(column.accessor)}
                    >
                      <div className="flex items-center">
                        {column.header}
                        {column.sortable && sortConfig.key === column.accessor && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedData.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={columns.length + 1} 
                      className="h-24 text-center"
                    >
                      Aucun résultat trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedData.map((row, rowIndex) => (
                    <TableRow key={rowIndex} className="hover:bg-muted/50">
                      {columns.map((column, colIndex) => (
                        <TableCell key={colIndex} className={column.className}>
                          {column.accessor === 'status' ? (
                            getStatusBadge(row[column.accessor])
                          ) : column.accessor ? (
                            row[column.accessor]
                          ) : (
                            column.cell?.(row)
                          )}
                        </TableCell>
                      ))}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Voir détails</DropdownMenuItem>
                            <DropdownMenuItem>Modifier</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer avec pagination info */}
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <div>
            Affichage de {filteredAndSortedData.length} sur {data.length} résultats
          </div>
        </div>
      </CardContent>
    </Card>
  )
}