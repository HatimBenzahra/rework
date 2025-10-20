import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateZoneInput, UpdateZoneInput } from './zone.dto';

@Injectable()
export class ZoneService {
  constructor(private prisma: PrismaService) {}

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
    // Utiliser une transaction pour garantir l'atomicité
    return this.prisma.$transaction(async (prisma) => {
      // D'abord, supprimer toutes les assignations existantes de ce commercial
      await prisma.commercialZone.deleteMany({
        where: {
          commercialId,
        },
      });

      // Ensuite, créer la nouvelle assignation
      return prisma.commercialZone.create({
        data: {
          zoneId,
          commercialId,
        },
        include: {
          zone: true,
          commercial: true,
        },
      });
    });
  }

  async assignToDirecteur(zoneId: number, directeurId: number) {
    // Utiliser une transaction pour garantir l'atomicité
    return this.prisma.$transaction(async (prisma) => {
      // D'abord, retirer ce directeur de toutes les autres zones
      await prisma.zone.updateMany({
        where: {
          directeurId,
        },
        data: {
          directeurId: null,
        },
      });

      // Ensuite, l'assigner à cette zone
      return prisma.zone.update({
        where: { id: zoneId },
        data: { directeurId },
        include: {
          directeur: true,
          commercials: {
            include: {
              commercial: true,
            },
          },
          immeubles: true,
        },
      });
    });
  }

  async assignToManager(zoneId: number, managerId: number) {
    // Utiliser une transaction pour garantir l'atomicité
    return this.prisma.$transaction(async (prisma) => {
      // D'abord, retirer ce manager de toutes les autres zones
      await prisma.zone.updateMany({
        where: {
          managerId,
        },
        data: {
          managerId: null,
        },
      });

      // Ensuite, l'assigner à cette zone
      return prisma.zone.update({
        where: { id: zoneId },
        data: { managerId },
        include: {
          manager: true,
          commercials: {
            include: {
              commercial: true,
            },
          },
          immeubles: true,
        },
      });
    });
  }

  async unassignFromCommercial(zoneId: number, commercialId: number) {
    return this.prisma.commercialZone.delete({
      where: {
        commercialId_zoneId: {
          commercialId,
          zoneId,
        },
      },
    });
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
