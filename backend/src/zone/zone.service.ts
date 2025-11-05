import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateZoneInput, UpdateZoneInput, UserType } from './zone.dto';

@Injectable()
export class ZoneService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calcule les statistiques d'un utilisateur pour une zone pendant une période donnée
   */
  private async calculateUserStatsForZone(
    userId: number,
    userType: UserType,
    zoneId: number,
    startDate: Date,
    endDate: Date,
  ) {
    // Construire la condition selon le type d'utilisateur
    const whereCondition: any = {
      zoneId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    switch (userType) {
      case UserType.COMMERCIAL:
        whereCondition.commercialId = userId;
        break;

      case UserType.MANAGER:
        whereCondition.OR = [
          { managerId: userId }, // ses propres stats
          {
            commercial: {
              managerId: userId,
            },
          }, // stats de ses commerciaux
        ];
        break;

      case UserType.DIRECTEUR:
        whereCondition.OR = [
          {
            commercial: {
              directeurId: userId,
            },
          }, // commerciaux du directeur
          {
            manager: {
              directeurId: userId,
            },
          }, // managers du directeur
        ];
        break;
    }

    const stats = await this.prisma.statistic.findMany({
      where: whereCondition,
      include: {
        commercial: true,
        manager: true,
      },
    });

    // Calculer les totaux
    return {
      totalContratsSignes: stats.reduce((sum, s) => sum + s.contratsSignes, 0),
      totalImmeublesVisites: stats.reduce(
        (sum, s) => sum + s.immeublesVisites,
        0,
      ),
      totalRendezVousPris: stats.reduce((sum, s) => sum + s.rendezVousPris, 0),
      totalRefus: stats.reduce((sum, s) => sum + s.refus, 0),
      totalImmeublesProspectes: stats.reduce(
        (sum, s) => sum + s.nbImmeublesProspectes,
        0,
      ),
      totalPortesProspectes: stats.reduce(
        (sum, s) => sum + s.nbPortesProspectes,
        0,
      ),
    };
  }

  /**
   * Fonction unifiée pour assigner une zone à un utilisateur (commercial, manager ou directeur)
   * Gère automatiquement l'historique des assignations
   */
  async assignZoneToUser(zoneId: number, userId: number, userType: UserType) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Vérifier que la zone existe
      const zone = await tx.zone.findUnique({ where: { id: zoneId } });
      if (!zone) {
        throw new ForbiddenException('Zone not found');
      }

      // 2. Récupérer l'assignation en cours de cet utilisateur (s'il en a une)
      const currentAssignment = await tx.zoneEnCours.findUnique({
        where: {
          userId_userType: {
            userId,
            userType,
          },
        },
      });

      // 3. Si une assignation existe, la déplacer vers l'historique
      if (currentAssignment) {
        // Calculer les stats pour la période d'assignation
        const stats = await this.calculateUserStatsForZone(
          userId,
          userType,
          currentAssignment.zoneId,
          currentAssignment.assignedAt,
          new Date(),
        );

        // Créer l'entrée historique
        await tx.historiqueZone.create({
          data: {
            zoneId: currentAssignment.zoneId,
            userId,
            userType,
            assignedAt: currentAssignment.assignedAt,
            unassignedAt: new Date(),
            ...stats,
          },
        });

        // Supprimer l'assignation en cours
        await tx.zoneEnCours.delete({
          where: { id: currentAssignment.id },
        });
      }

      // 4. Créer la nouvelle assignation en cours
      const newAssignment = await tx.zoneEnCours.create({
        data: {
          zoneId,
          userId,
          userType,
        },
        include: {
          zone: true,
        },
      });

      return newAssignment;
    });
  }

  async create(data: CreateZoneInput) {
    return this.prisma.zone.create({
      data,
    });
  }

  async findAll(userId?: number, userRole?: string) {
    // Si pas de paramètres de filtrage, retourner toutes les zones
    if (!userId || !userRole) {
      throw new ForbiddenException('UNAUTHORIZED');
    }

    // Filtrage selon le rôle
    switch (userRole) {
      case 'admin':
        return this.prisma.zone.findMany({
          include: {
            commercials: {
              include: {
                commercial: true,
              },
            },
            immeubles: true,
          },
        });

      case 'directeur':
        // Zones assignées directement au directeur ou à ses commerciaux
        return this.prisma.zone.findMany({
          where: {
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
          },
          include: {
            commercials: {
              include: {
                commercial: true,
              },
            },
            immeubles: true,
          },
        });

      case 'manager':
        // Zones assignées directement au manager ou à ses commerciaux
        return this.prisma.zone.findMany({
          where: {
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
          },
          include: {
            commercials: {
              include: {
                commercial: true,
              },
            },
            immeubles: true,
          },
        });

      case 'commercial':
        // Zones assignées au commercial
        return this.prisma.zone.findMany({
          where: {
            commercials: {
              some: {
                commercialId: userId,
              },
            },
          },
          include: {
            commercials: {
              include: {
                commercial: true,
              },
            },
            immeubles: true,
          },
        });

      default:
        return [];
    }
  }

  async findOne(id: number) {
    return this.prisma.zone.findUnique({
      where: { id },
      include: {
        commercials: {
          include: {
            commercial: true,
          },
        },
        immeubles: true,
      },
    });
  }

  async assignToCommercial(zoneId: number, commercialId: number) {
    // Utiliser la nouvelle fonction unifiée
    return this.assignZoneToUser(zoneId, commercialId, UserType.COMMERCIAL);
  }

  async assignToDirecteur(zoneId: number, directeurId: number) {
    // Utiliser la nouvelle fonction unifiée
    return this.assignZoneToUser(zoneId, directeurId, UserType.DIRECTEUR);
  }

  async assignToManager(zoneId: number, managerId: number) {
    // Utiliser la nouvelle fonction unifiée
    return this.assignZoneToUser(zoneId, managerId, UserType.MANAGER);
  }

  /**
   * Désassigne un utilisateur de sa zone actuelle
   * Met l'assignation dans l'historique avec les stats calculées
   */
  async unassignUser(userId: number, userType: UserType) {
    return this.prisma.$transaction(async (tx) => {
      // Récupérer l'assignation en cours
      const currentAssignment = await tx.zoneEnCours.findUnique({
        where: {
          userId_userType: {
            userId,
            userType,
          },
        },
      });

      if (!currentAssignment) {
        throw new ForbiddenException(
          'No active zone assignment found for this user',
        );
      }

      // Calculer les stats pour la période d'assignation
      const stats = await this.calculateUserStatsForZone(
        userId,
        userType,
        currentAssignment.zoneId,
        currentAssignment.assignedAt,
        new Date(),
      );

      // Créer l'entrée historique
      await tx.historiqueZone.create({
        data: {
          zoneId: currentAssignment.zoneId,
          userId,
          userType,
          assignedAt: currentAssignment.assignedAt,
          unassignedAt: new Date(),
          ...stats,
        },
      });

      // Supprimer l'assignation en cours
      await tx.zoneEnCours.delete({
        where: { id: currentAssignment.id },
      });

      return {
        success: true,
        message: 'User unassigned from zone successfully',
      };
    });
  }

  async unassignFromCommercial(zoneId: number, commercialId: number) {
    // Utiliser la nouvelle fonction de désassignation
    return this.unassignUser(commercialId, UserType.COMMERCIAL);
  }

  /**
   * Récupère l'assignation en cours d'un utilisateur
   */
  async getCurrentAssignment(userId: number, userType: UserType) {
    return this.prisma.zoneEnCours.findUnique({
      where: {
        userId_userType: {
          userId,
          userType,
        },
      },
      include: {
        zone: true,
      },
    });
  }

  /**
   * Récupère l'historique des assignations d'un utilisateur
   */
  async getUserZoneHistory(userId: number, userType: UserType) {
    return this.prisma.historiqueZone.findMany({
      where: {
        userId,
        userType,
      },
      include: {
        zone: true,
      },
      orderBy: {
        unassignedAt: 'desc',
      },
    });
  }

  /**
   * Récupère l'historique des assignations d'une zone
   */
  async getZoneHistory(zoneId: number) {
    return this.prisma.historiqueZone.findMany({
      where: {
        zoneId,
      },
      orderBy: {
        unassignedAt: 'desc',
      },
    });
  }

  /**
   * Récupère tous les utilisateurs actuellement assignés à une zone
   */
  async getZoneCurrentAssignments(zoneId: number) {
    return this.prisma.zoneEnCours.findMany({
      where: {
        zoneId,
      },
      include: {
        zone: true,
      },
    });
  }

  /**
   * Récupère TOUT l'historique des assignations de zones
   * Avec filtrage selon le rôle de l'utilisateur
   */
  async getAllZoneHistory(userId?: number, userRole?: string) {
    if (!userId || !userRole) {
      throw new ForbiddenException('UNAUTHORIZED');
    }

    // Filtrage selon le rôle
    switch (userRole) {
      case 'admin':
        return this.prisma.historiqueZone.findMany({
          include: {
            zone: true,
          },
          orderBy: {
            unassignedAt: 'desc',
          },
        });

      case 'directeur':
        // Historique des zones du directeur et de ses commerciaux
        return this.prisma.historiqueZone.findMany({
          where: {
            zone: {
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
            },
          },
          include: {
            zone: true,
          },
          orderBy: {
            unassignedAt: 'desc',
          },
        });

      case 'manager':
        // Historique des zones du manager et de ses commerciaux
        return this.prisma.historiqueZone.findMany({
          where: {
            zone: {
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
            },
          },
          include: {
            zone: true,
          },
          orderBy: {
            unassignedAt: 'desc',
          },
        });

      case 'commercial':
        // Historique des zones du commercial uniquement
        return this.prisma.historiqueZone.findMany({
          where: {
            zone: {
              commercials: {
                some: {
                  commercialId: userId,
                },
              },
            },
          },
          include: {
            zone: true,
          },
          orderBy: {
            unassignedAt: 'desc',
          },
        });

      default:
        return [];
    }
  }

  /**
   * Récupère TOUTES les assignations en cours
   * Avec filtrage selon le rôle de l'utilisateur
   */
  async getAllCurrentAssignments(userId?: number, userRole?: string) {
    if (!userId || !userRole) {
      throw new ForbiddenException('UNAUTHORIZED');
    }

    // Filtrage selon le rôle
    switch (userRole) {
      case 'admin':
        return this.prisma.zoneEnCours.findMany({
          include: {
            zone: true,
          },
          orderBy: {
            assignedAt: 'desc',
          },
        });

      case 'directeur':
        // Assignations des zones du directeur et de ses commerciaux
        return this.prisma.zoneEnCours.findMany({
          where: {
            zone: {
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
            },
          },
          include: {
            zone: true,
          },
          orderBy: {
            assignedAt: 'desc',
          },
        });

      case 'manager':
        // Assignations des zones du manager et de ses commerciaux
        return this.prisma.zoneEnCours.findMany({
          where: {
            zone: {
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
            },
          },
          include: {
            zone: true,
          },
          orderBy: {
            assignedAt: 'desc',
          },
        });

      case 'commercial':
        // Assignations des zones du commercial uniquement
        return this.prisma.zoneEnCours.findMany({
          where: {
            zone: {
              commercials: {
                some: {
                  commercialId: userId,
                },
              },
            },
          },
          include: {
            zone: true,
          },
          orderBy: {
            assignedAt: 'desc',
          },
        });

      default:
        return [];
    }
  }

  async update(data: UpdateZoneInput) {
    const { id, ...updateData } = data;
    return this.prisma.zone.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number) {
    // Use a transaction to ensure all deletions succeed or fail together
    return this.prisma.$transaction(async (prisma) => {
      // First, delete all CommercialZone associations
      await prisma.commercialZone.deleteMany({
        where: { zoneId: id },
      });

      // Delete all statistics related to this zone
      await prisma.statistic.deleteMany({
        where: { zoneId: id },
      });

      // Finally, delete the zone itself
      return prisma.zone.delete({
        where: { id },
      });
    });
  }
}
