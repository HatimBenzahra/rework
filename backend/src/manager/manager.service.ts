import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateManagerInput, UpdateManagerInput } from './manager.dto';

@Injectable()
export class ManagerService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateManagerInput) {
    return this.prisma.manager.create({
      data,
      include: {
        directeur: true,
        commercials: true,
      },
    });
  }

  async findAll(userId?: number, userRole?: string) {
    // Si pas de filtrage explicite, retourner tous les managers
    if (!userId || !userRole) {
      return this.prisma.manager.findMany({
        include: {
          directeur: true,
          commercials: true,
        },
      });
    }

    switch (userRole) {
      case 'admin':
        return this.prisma.manager.findMany({
          include: {
            directeur: true,
            commercials: true,
            statistics: true,
          },
        });

      case 'directeur':
        return this.prisma.manager.findMany({
          where: {
            directeurId: userId,
          },
          include: {
            directeur: true,
            commercials: true,
            statistics: true,
          },
        });

      case 'manager':
        return this.prisma.manager.findMany({
          where: {
            id: userId,
          },
          include: {
            directeur: true,
            commercials: true,
          },
        });

      default:
        return [];
    }
  }

  async findOne(id: number) {
    return this.prisma.manager.findUnique({
      where: { id },
      include: {
        directeur: true,
        commercials: true,
        zones: true,
      },
    });
  }

  /**
   * Récupère les données personnelles du manager (pour son espace commercial personnel)
   * Retourne UNIQUEMENT ses propres immeubles et statistiques
   */
  async findPersonal(id: number) {
    const manager = await this.prisma.manager.findUnique({
      where: { id },
      include: {
        directeur: true,
      },
    });

    if (!manager) {
      return null;
    }

    // Récupérer UNIQUEMENT les propres immeubles du manager
    const immeubles = await this.prisma.immeuble.findMany({
      where: { managerId: id },
      include: {
        portes: true,
      },
    });

    // Récupérer UNIQUEMENT les propres statistiques du manager
    const statistics = await this.prisma.statistic.findMany({
      where: { managerId: id },
    });

    // Récupérer les zones assignées au manager
    const zones = await this.prisma.zone.findMany({
      where: { managerId: id },
      include: {
        commercials: true,
        immeubles: true,
      },
    });

    return {
      ...manager,
      immeubles,
      statistics,
      zones,
    };
  }

  /**
   * Récupère toutes les données du manager pour la page équipe
   * Retourne ses commerciaux avec leurs immeubles et statistiques
   */
  async findFull(id: number) {
    // Récupérer le manager avec ses relations
    const managerData = await this.prisma.manager.findUnique({
      where: { id },
      include: {
        directeur: false,
        zones: {
          include: {
            commercials: {
              include: {
                commercial: {
                  include: {
                    statistics: true,
                    immeubles: {
                      include: {
                        portes: true,
                      },
                    },
                    zones: {
                      include: {
                        zone: {
                          include: {
                            commercials: true,
                            immeubles: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            immeubles: {
              include: {
                portes: true,
              },
            },
            statistics: true,
          },
        },
        commercials: {
          include: {
            statistics: true,
            immeubles: {
              include: {
                portes: true,
              },
            },
            zones: {
              include: {
                zone: {
                  include: {
                    commercials: true,
                    immeubles: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!managerData) {
      return null;
    }

    // Récupérer les propres immeubles et statistiques du manager séparément
    const managerImmeubles = await this.prisma.immeuble.findMany({
      where: { managerId: id },
      include: {
        portes: true,
      },
    });

    const managerStatistics = await this.prisma.statistic.findMany({
      where: { managerId: id },
    });

    // Agréger les immeubles des commerciaux + les propres immeubles du manager
    const commercialImmeubles =
      managerData.commercials?.flatMap(
        (commercial: any) => commercial.immeubles || [],
      ) || [];
    const aggregatedImmeubles = [...managerImmeubles, ...commercialImmeubles];

    // Agréger les statistiques des commerciaux + les propres statistiques du manager
    const commercialStatistics =
      managerData.commercials?.flatMap(
        (commercial: any) => commercial.statistics || [],
      ) || [];
    const aggregatedStatistics = [
      ...managerStatistics,
      ...commercialStatistics,
    ];

    return {
      ...managerData,
      immeubles: aggregatedImmeubles,
      statistics: aggregatedStatistics,
    };
  }

  async update(data: UpdateManagerInput) {
    const { id, ...updateData } = data;
    return this.prisma.manager.update({
      where: { id },
      data: updateData,
      include: {
        directeur: true,
        commercials: true,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.manager.delete({
      where: { id },
      include: {
        directeur: true,
        commercials: true,
      },
    });
  }
}
