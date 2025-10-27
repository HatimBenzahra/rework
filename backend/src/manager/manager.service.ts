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

  async findFull(id: number) {
    const manager = await this.prisma.manager.findUnique({
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

    if (!manager) {
      return null;
    }

    const aggregatedImmeubles =
      manager.commercials?.flatMap(
        (commercial) => commercial.immeubles || [],
      ) || [];
    const aggregatedStatistics =
      manager.commercials?.flatMap(
        (commercial) => commercial.statistics || [],
      ) || [];

    return {
      ...manager,
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
