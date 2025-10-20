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
    // Construire les conditions de filtrage selon le rôle
    let whereConditions: any = {};

    if (userId && userRole) {
      switch (userRole) {
        case 'admin':
          // Pas de filtrage pour admin
          break;

        case 'directeur':
          whereConditions.commercial = {
            directeurId: userId,
          };
          break;

        case 'manager':
          whereConditions.commercial = {
            managerId: userId,
          };
          break;

        case 'commercial':
          whereConditions.commercialId = userId;
          break;

        default:
          return [];
      }
    }

    // Récupérer toutes les statistiques avec les informations de zone
    const statistics = await this.prisma.statistic.findMany({
      where: whereConditions,
      include: {
        commercial: true,
      },
    });

    // Récupérer les informations des zones
    const zones = await this.prisma.zone.findMany({
      include: {
        commercials: {
          include: {
            commercial: true,
          },
        },
      },
    });

    // Grouper les statistiques par zone
    const zoneStatsMap = new Map<number, {
      zoneId: number;
      zoneName: string;
      stats: typeof statistics;
      commerciaux: Set<number>;
    }>();

    // Initialiser avec toutes les zones
    zones.forEach(zone => {
      zoneStatsMap.set(zone.id, {
        zoneId: zone.id,
        zoneName: zone.nom,
        stats: [],
        commerciaux: new Set(),
      });
    });

    // Ajouter les statistiques à leurs zones respectives
    statistics.forEach(stat => {
      if (stat.zoneId) {
        const zoneData = zoneStatsMap.get(stat.zoneId);
        if (zoneData) {
          zoneData.stats.push(stat);
          if (stat.commercialId) {
            zoneData.commerciaux.add(stat.commercialId);
          }
        }
      }
    });

    // Calculer les statistiques agrégées pour chaque zone
    const zoneStatistics: ZoneStatistic[] = Array.from(zoneStatsMap.values()).map(zoneData => {
      const totalContratsSignes = zoneData.stats.reduce((sum, stat) => sum + stat.contratsSignes, 0);
      const totalImmeublesVisites = zoneData.stats.reduce((sum, stat) => sum + stat.immeublesVisites, 0);
      const totalRendezVousPris = zoneData.stats.reduce((sum, stat) => sum + stat.rendezVousPris, 0);
      const totalRefus = zoneData.stats.reduce((sum, stat) => sum + stat.refus, 0);
      const totalImmeublesProspectes = zoneData.stats.reduce((sum, stat) => sum + stat.nbImmeublesProspectes, 0);
      const totalPortesProspectes = zoneData.stats.reduce((sum, stat) => sum + stat.nbPortesProspectes, 0);

      // Calculs des taux
      const tauxConversion = totalPortesProspectes > 0 
        ? (totalContratsSignes / totalPortesProspectes) * 100 
        : 0;
      
      const tauxSuccesRdv = totalImmeublesVisites > 0 
        ? (totalRendezVousPris / totalImmeublesVisites) * 100 
        : 0;

      // Performance globale (score composite)
      const performanceGlobale = (tauxConversion * 0.4) + (tauxSuccesRdv * 0.3) + 
        ((totalContratsSignes / Math.max(1, zoneData.commerciaux.size)) * 0.3);

      return {
        zoneId: zoneData.zoneId,
        zoneName: zoneData.zoneName,
        totalContratsSignes,
        totalImmeublesVisites,
        totalRendezVousPris,
        totalRefus,
        totalImmeublesProspectes,
        totalPortesProspectes,
        tauxConversion: Math.round(tauxConversion * 100) / 100,
        tauxSuccesRdv: Math.round(tauxSuccesRdv * 100) / 100,
        nombreCommerciaux: zoneData.commerciaux.size,
        performanceGlobale: Math.round(performanceGlobale * 100) / 100,
      };
    });

    // Trier par performance globale décroissante
    return zoneStatistics.sort((a, b) => b.performanceGlobale - a.performanceGlobale);
  }
}
