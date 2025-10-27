import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateStatisticInput, UpdateStatisticInput, ZoneStatistic } from './statistic.dto';

@Injectable()
export class StatisticService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateStatisticInput) {
    return this.prisma.statistic.create({
      data,
      include: {
        commercial: true,
      },
    });
  }

  async findAll(commercialId?: number, userId?: number, userRole?: string) {
    // Construire les conditions de filtrage
    let whereConditions: any = {};

    // Si commercialId est spécifié, filtrer par commercial
    if (commercialId) {
      whereConditions.commercialId = commercialId;
    }

    // Si userId et userRole sont fournis, appliquer la filtration par rôle
    if (userId && userRole) {
      switch (userRole) {
        case 'admin':
          // Pas de filtrage supplémentaire pour admin
          break;

        case 'directeur':
          // Statistiques des commerciaux du directeur
          whereConditions.commercial = {
            directeurId: userId,
          };
          break;

        case 'manager':
          // Statistiques des commerciaux du manager
          whereConditions.commercial = {
            managerId: userId,
          };
          break;

        case 'commercial':
          // Statistiques du commercial lui-même
          whereConditions.commercialId = userId;
          break;

        default:
          return [];
      }
    }

    return this.prisma.statistic.findMany({
      where: whereConditions,
      include: {
        commercial: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.statistic.findUnique({
      where: { id },
      include: {
        commercial: true,
      },
    });
  }

  async update(data: UpdateStatisticInput) {
    const { id, ...updateData } = data;
    return this.prisma.statistic.update({
      where: { id },
      data: updateData,
      include: {
        commercial: true,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.statistic.delete({
      where: { id },
      include: {
        commercial: true,
      },
    });
  }

  async getZoneStatistics(userId?: number, userRole?: string): Promise<ZoneStatistic[]> {
    // Construire les conditions de filtrage selon le rôle pour les zones
    let zoneWhereConditions: any = {};

    if (userId && userRole) {
      switch (userRole) {
        case 'admin':
          // Pas de filtrage pour admin
          break;

        case 'directeur':
          // Zones assignées directement au directeur ou à ses commerciaux
          zoneWhereConditions = {
            OR: [
              { directeurId: userId },
              {
                commercials: {
                  some: {
                    commercial: {
                      directeurId: userId,
                    },
                  },
                },
              },
            ],
          };
          break;

        case 'manager':
          // Zones assignées directement au manager ou à ses commerciaux
          zoneWhereConditions = {
            OR: [
              { managerId: userId },
              {
                commercials: {
                  some: {
                    commercial: {
                      managerId: userId,
                    },
                  },
                },
              },
            ],
          };
          break;

        case 'commercial':
          // Zones assignées au commercial
          zoneWhereConditions = {
            commercials: {
              some: {
                commercialId: userId,
              },
            },
          };
          break;

        default:
          return [];
      }
    }

    // Récupérer les zones avec leurs commerciaux et statistiques
    const zones = await this.prisma.zone.findMany({
      where: zoneWhereConditions,
      include: {
        commercials: {
          include: {
            commercial: {
              include: {
                statistics: true, // Récupérer toutes les statistiques des commerciaux
              },
            },
          },
        },
      },
    });

    // Calculer les statistiques agrégées pour chaque zone
    const zoneStatistics: ZoneStatistic[] = zones.map(zone => {
      // Collecter toutes les statistiques des commerciaux de cette zone
      const allStats: any[] = [];
      const commerciauxIds = new Set<number>();

      zone.commercials.forEach(cz => {
        if (cz.commercial) {
          commerciauxIds.add(cz.commercial.id);
          // Ajouter toutes les statistiques de ce commercial
          cz.commercial.statistics.forEach(stat => {
            allStats.push(stat);
          });
        }
      });

      // Calculer les totaux
      const totalContratsSignes = allStats.reduce((sum, stat) => sum + (stat.contratsSignes || 0), 0);
      const totalImmeublesVisites = allStats.reduce((sum, stat) => sum + (stat.immeublesVisites || 0), 0);
      const totalRendezVousPris = allStats.reduce((sum, stat) => sum + (stat.rendezVousPris || 0), 0);
      const totalRefus = allStats.reduce((sum, stat) => sum + (stat.refus || 0), 0);
      const totalImmeublesProspectes = allStats.reduce((sum, stat) => sum + (stat.nbImmeublesProspectes || 0), 0);
      const totalPortesProspectes = allStats.reduce((sum, stat) => sum + (stat.nbPortesProspectes || 0), 0);

      // Calculs des taux
      const tauxConversion = totalPortesProspectes > 0 
        ? (totalContratsSignes / totalPortesProspectes) * 100 
        : 0;
      
      const tauxSuccesRdv = totalImmeublesVisites > 0 
        ? (totalRendezVousPris / totalImmeublesVisites) * 100 
        : 0;

      // Performance globale (score composite)
      const performanceGlobale = (tauxConversion * 0.4) + (tauxSuccesRdv * 0.3) + 
        ((totalContratsSignes / Math.max(1, commerciauxIds.size)) * 0.3);

      return {
        zoneId: zone.id,
        zoneName: zone.nom,
        totalContratsSignes,
        totalImmeublesVisites,
        totalRendezVousPris,
        totalRefus,
        totalImmeublesProspectes,
        totalPortesProspectes,
        tauxConversion: Math.round(tauxConversion * 100) / 100,
        tauxSuccesRdv: Math.round(tauxSuccesRdv * 100) / 100,
        nombreCommerciaux: commerciauxIds.size,
        performanceGlobale: Math.round(performanceGlobale * 100) / 100,
      };
    });

    // Trier par performance globale décroissante
    return zoneStatistics.sort((a, b) => b.performanceGlobale - a.performanceGlobale);
  }
}
