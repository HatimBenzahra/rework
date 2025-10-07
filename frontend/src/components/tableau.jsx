import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, Search, Filter, MoreHorizontal, Plus } from 'lucide-react'
import { StatsCard } from './card'

export function AdvancedDataTable({
  title,
  description,
  data,
  columns,
  searchKey = 'name',
  onAdd,
  addButtonText = 'Ajouter',
  itemsPerPage = 10,
  detailsPath,
}) {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Filtrage et tri des données
  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => {
      const searchMatch =
        item[searchKey]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase())

      const statusMatch =
        statusFilter === 'all' || item.status?.toLowerCase() === statusFilter.toLowerCase()

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

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedData.slice(startIndex, endIndex)
  }, [filteredAndSortedData, currentPage, itemsPerPage])

  // Réinitialise la page quand on change de filtre/recherche
  useMemo(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const handleSort = key => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const getStatusBadge = status => {
    const variants = {
      actif: 'default',
      inactif: 'secondary',
      suspendu: 'destructive',
      en_conge: 'outline',
    }

    const labels = {
      actif: 'Actif',
      inactif: 'Inactif',
      suspendu: 'Suspendu',
      en_conge: 'En congé',
    }

    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
  }

  const handleRowClick = (row) => {
    if (detailsPath && row.id) {
      navigate(`${detailsPath}/${row.id}`)
    }
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
              onChange={e => setSearchTerm(e.target.value)}
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
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>Tous</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('actif')}>Actif</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('inactif')}>
                Inactif
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('suspendu')}>
                Suspendu
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('en_conge')}>
                En congé
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                          <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                      Aucun résultat trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((row, rowIndex) => (
                    <TableRow 
                      key={rowIndex} 
                      className={`hover:bg-muted/50 ${detailsPath ? 'cursor-pointer' : ''}`}
                      onClick={() => handleRowClick(row)}
                    >
                      {columns.map((column, colIndex) => (
                        <TableCell key={colIndex} className={column.className}>
                          {column.accessor === 'status'
                            ? getStatusBadge(row[column.accessor])
                            : column.accessor
                              ? row[column.accessor]
                              : column.cell?.(row)}
                        </TableCell>
                      ))}
                      <TableCell onClick={(e) => e.stopPropagation()}>
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
                            <DropdownMenuItem className="text-destructive">
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

        {/* Footer avec pagination */}
        <div className="flex items-center justify-between mt-4 -mx-6 px-6">
          <div className="text-sm text-muted-foreground">
            Affichage de {(currentPage - 1) * itemsPerPage + 1} à{' '}
            {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} sur{' '}
            {filteredAndSortedData.length} résultats
          </div>

          {totalPages > 1 && (
            <div className="-mr-2">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={
                        currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>

                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1
                    // Affiche les 3 premières pages, les 3 dernières, et la page actuelle avec ses voisines
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNumber)}
                            isActive={currentPage === pageNumber}
                            className="cursor-pointer"
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )
                    }
                    return null
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={
                        currentPage === totalPages
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
