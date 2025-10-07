import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, TrendingUp, Users, Building2 } from 'lucide-react'

/**
 * Composant de page de détails réutilisable
 * @param {Object} props
 * @param {string} props.title - Titre principal de la page
 * @param {string} props.subtitle - Sous-titre ou description
 * @param {Object} props.data - Données de l'entité à afficher
 * @param {Object} props.personalInfo - Section d'informations personnelles
 * @param {Array} props.statsCards - Cartes de statistiques
 * @param {Array} props.additionalSections - Sections supplémentaires personnalisées
 * @param {string} props.backUrl - URL de retour
 * @param {string} props.status - Status de l'entité (actif, inactif, etc.)
 */
export default function DetailsPage({
  title,
  subtitle,
  data,
  personalInfo = [],
  statsCards = [],
  additionalSections = [],
  backUrl = '/',
  status,
}) {
  const navigate = useNavigate()

  const getStatusBadge = status => {
    const variants = {
      actif: 'default',
      inactif: 'secondary',
      suspendu: 'destructive',
      en_conge: 'outline',
      en_renovation: 'outline',
      en_maintenance: 'outline',
      complet: 'default',
      en_developpement: 'secondary',
      saisonnier: 'outline',
    }

    const labels = {
      actif: 'Actif',
      inactif: 'Inactif',
      suspendu: 'Suspendu',
      en_conge: 'En congé',
      en_renovation: 'En rénovation',
      en_maintenance: 'En maintenance',
      complet: 'Complet',
      en_developpement: 'En développement',
      saisonnier: 'Saisonnier',
    }

    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
  }

  const getIcon = iconName => {
    const icons = {
      mail: Mail,
      phone: Phone,
      mapPin: MapPin,
      calendar: Calendar,
      trendingUp: TrendingUp,
      users: Users,
      building: Building2,
    }
    const Icon = icons[iconName] || Mail
    return <Icon className="h-4 w-4" />
  }

  return (
    <div className="space-y-8">
      {/* Header avec bouton retour */}
      <div className="flex items-center gap-4 pb-6 border-b">
        <Button variant="outline" size="icon" onClick={() => navigate(backUrl)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {status && getStatusBadge(status)}
          </div>
          {subtitle && <p className="text-muted-foreground text-base">{subtitle}</p>}
        </div>
      </div>
      {/* Informations personnelles */}
      {personalInfo.length > 0 && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-1">Informations personnelles</h2>
            <p className="text-sm text-muted-foreground">Détails et coordonnées</p>
          </div>
          <Separator className="mb-6" />
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-2">
                {personalInfo.map((info, index) => (
                  <div key={index} className="flex items-start gap-3">
                    {info.icon && (
                      <div className="mt-1 text-muted-foreground">{getIcon(info.icon)}</div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {info.label}
                      </p>
                      <p className="text-base font-semibold mt-1.5">{info.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}


      {/* Statistiques */}
      {statsCards.length > 0 && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-1">Statistiques</h2>
            <p className="text-sm text-muted-foreground">Indicateurs de performance clés</p>
          </div>
          <Separator className="mb-6" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {statsCards.map((stat, index) => (
              <Card key={index} className="border-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  {stat.icon && (
                    <div className="h-4 w-4 text-muted-foreground">{getIcon(stat.icon)}</div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                  {stat.description && (
                    <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
                  )}
                  {stat.trend && (
                    <div className="mt-3 pt-3 border-t">
                      <div
                        className={`text-xs font-medium flex items-center gap-1 ${
                          stat.trend.type === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        <TrendingUp className="h-3 w-3" />
                        {stat.trend.value}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}


      {/* Sections additionnelles personnalisées */}
      {additionalSections.map((section, index) => (
        <div key={index}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-1">{section.title}</h2>
            {section.description && (
              <p className="text-sm text-muted-foreground">{section.description}</p>
            )}
          </div>
          <Separator className="mb-6" />
          <Card className="border-2">
            <CardContent className="pt-6">
              {section.type === 'grid' && (
                <div className="grid gap-6 md:grid-cols-2">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {item.label}
                      </p>
                      <p className="text-base font-semibold mt-1.5">{item.value}</p>
                    </div>
                  ))}
                </div>
              )}
              {section.type === 'list' && (
                <div className="divide-y">
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-sm font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
              {section.type === 'custom' && section.render && section.render(data)}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}

