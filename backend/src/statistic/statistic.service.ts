import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CreateStatisticInput,
  UpdateStatisticInput,
  ZoneStatistic,
} from './statistic.dto';

@Injectable()
export class StatisticService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateStatisticInput) {
    return this.prisma.statistic.create({
      data,
      include: {
        commercial: true,
        manager: true,
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
          // Statistiques des commerciaux du manager ET ses propres statistiques
          whereConditions.OR = [
            {
              commercial: {
                managerId: userId,
              },
            },
            {
              managerId: userId,
            },
          ];
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
        manager: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.statistic.findUnique({
      where: { id },
      include: {
        commercial: true,
        manager: true,
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
        manager: true,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.statistic.delete({
      where: { id },
      include: {
        commercial: true,
        manager: true,
      },
    });
  }

  async getZoneStatistics(
    userId?: number,
    userRole?: string,
  ): Promise<ZoneStatistic[]> {
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

    // =====================================================
    // Nouvelle logique: Utiliser ZoneEnCours + HistoriqueZone
    // =====================================================

    // 1. Récupérer toutes les assignations en cours
    const currentAssignments = await this.prisma.zoneEnCours.findMany({
      include: {
        zone: true,
      },
    });

    // 2. Récupérer tout l'historique des assignations
    const historyAssignments = await this.prisma.historiqueZone.findMany({
      include: {
        zone: true,
      },
    });

    // 3. Créer un Set de toutes les zones qui ont été prospectées
    const allZoneIds = new Set<number>();
    currentAssignments.forEach((a) => allZoneIds.add(a.zoneId));
    historyAssignments.forEach((h) => allZoneIds.add(h.zoneId));

    // 4. Récupérer les détails des zones
    const zones = await this.prisma.zone.findMany({
      where: {
        id: { in: Array.from(allZoneIds) },
      },
    });

    // 5. Calculer les statistiques agrégées pour chaque zone
    const zoneStatistics: ZoneStatistic[] = await Promise.all(
      zones.map(async (zone) => {
        // Récupérer les assignations EN COURS pour cette zone
        const zoneCurrentAssignments = currentAssignments.filter(
          (a) => a.zoneId === zone.id,
        );

        let currentStats = {
          contratsSignes: 0,
          immeublesVisites: 0,
          rendezVousPris: 0,
          refus: 0,
          immeublesProspectes: 0,
          portesProspectes: 0,
        };

        const usersInZone = new Set<number>();

        // Calculer les stats pour chaque assignation EN COURS
        for (const assignment of zoneCurrentAssignments) {
          usersInZone.add(assignment.userId);

          // Construire la condition selon le type d'utilisateur
          let statsWhere: any = {
            zoneId: zone.id,
            createdAt: {
              gte: assignment.assignedAt,
            },
          };

          // Respecter la hiérarchie des rôles
          switch (assignment.userType) {
            case 'COMMERCIAL':
              statsWhere.commercialId = assignment.userId;
              break;
            case 'MANAGER':
              statsWhere.OR = [
                { managerId: assignment.userId },
                { commercial: { managerId: assignment.userId } },
              ];
              break;
            case 'DIRECTEUR':
              statsWhere.OR = [
                { commercial: { directeurId: assignment.userId } },
                { manager: { directeurId: assignment.userId } },
              ];
              break;
          }

          const stats = await this.prisma.statistic.findMany({
            where: statsWhere,
            include: {
              commercial: true,
              manager: true,
            },
          });

          stats.forEach((stat) => {
            currentStats.contratsSignes += stat.contratsSignes || 0;
            currentStats.immeublesVisites += stat.immeublesVisites || 0;
            currentStats.rendezVousPris += stat.rendezVousPris || 0;
            currentStats.refus += stat.refus || 0;
            currentStats.immeublesProspectes += stat.nbImmeublesProspectes || 0;
            currentStats.portesProspectes += stat.nbPortesProspectes || 0;
          });
        }

        // Récupérer les stats HISTORIQUES (déjà calculées)
        const zoneHistory = historyAssignments.filter(
          (h) => h.zoneId === zone.id,
        );

        let historicalStats = {
          contratsSignes: 0,
          immeublesVisites: 0,
          rendezVousPris: 0,
          refus: 0,
          immeublesProspectes: 0,
          portesProspectes: 0,
        };

        zoneHistory.forEach((history) => {
          usersInZone.add(history.userId);
          historicalStats.contratsSignes += history.totalContratsSignes || 0;
          historicalStats.immeublesVisites +=
            history.totalImmeublesVisites || 0;
          historicalStats.rendezVousPris += history.totalRendezVousPris || 0;
          historicalStats.refus += history.totalRefus || 0;
          historicalStats.immeublesProspectes +=
            history.totalImmeublesProspectes || 0;
          historicalStats.portesProspectes +=
            history.totalPortesProspectes || 0;
        });

        // Combiner les stats actuelles + historiques
        const totalContratsSignes =
          currentStats.contratsSignes + historicalStats.contratsSignes;
        const totalImmeublesVisites =
          currentStats.immeublesVisites + historicalStats.immeublesVisites;
        const totalRendezVousPris =
          currentStats.rendezVousPris + historicalStats.rendezVousPris;
        const totalRefus = currentStats.refus + historicalStats.refus;
        const totalImmeublesProspectes =
          currentStats.immeublesProspectes +
          historicalStats.immeublesProspectes;
        const totalPortesProspectes =
          currentStats.portesProspectes + historicalStats.portesProspectes;

        // Calculs des taux
        const tauxConversion =
          totalPortesProspectes > 0
            ? (totalContratsSignes / totalPortesProspectes) * 100
            : 0;

        const tauxSuccesRdv =
          totalImmeublesVisites > 0
            ? (totalRendezVousPris / totalImmeublesVisites) * 100
            : 0;

        // Performance globale (score composite)
        const performanceGlobale =
          tauxConversion * 0.4 +
          tauxSuccesRdv * 0.3 +
          (totalContratsSignes / Math.max(1, usersInZone.size)) * 0.3;

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
          nombreCommerciaux: usersInZone.size,
          performanceGlobale: Math.round(performanceGlobale * 100) / 100,
        };
      }),
    );

    // Trier par performance globale décroissante
    return zoneStatistics.sort(
      (a, b) => b.performanceGlobale - a.performanceGlobale,
    );
  }
}
