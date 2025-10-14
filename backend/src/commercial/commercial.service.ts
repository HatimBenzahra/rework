import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCommercialInput, UpdateCommercialInput } from './commercial.dto';

@Injectable()
export class CommercialService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCommercialInput) {
    // Si un managerId est fourni, récupérer automatiquement le directeurId du manager
    let directeurId = data.directeurId;

    if (data.managerId && !directeurId) {
      const manager = await this.prisma.manager.findUnique({
        where: { id: data.managerId },
        select: { directeurId: true },
      });

      if (manager?.directeurId) {
        directeurId = manager.directeurId;
      }
    }

    return this.prisma.commercial.create({
      data: {
        ...data,
        directeurId,
      },
      include: {
        manager: true,
        directeur: true,
      },
    });
  }

  async findAll() {
    return this.prisma.commercial.findMany({
      include: {
        manager: true,
        directeur: true,
        immeubles: true,
        zones: {
          include: {
            zone: {
              include: {
                commercials: true,
              },
            },
          },
        },
        statistics: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.commercial.findUnique({
      where: { id },
      include: {
        manager: true,
        directeur: true,
        immeubles: true,
        zones: {
          include: {
            zone: {
              include: {
                commercials: true,
              },
            },
          },
        },
        statistics: true,
      },
    });
  }

  async update(data: UpdateCommercialInput) {
    const { id, ...updateData } = data;

    // Si le managerId est modifié, mettre à jour automatiquement le directeurId
    let directeurId = updateData.directeurId;

    if (updateData.managerId !== undefined && !directeurId) {
      const manager = await this.prisma.manager.findUnique({
        where: { id: updateData.managerId },
        select: { directeurId: true },
      });

      if (manager?.directeurId) {
        directeurId = manager.directeurId;
      }
    }

    return this.prisma.commercial.update({
      where: { id },
      data: {
        ...updateData,
        ...(directeurId !== undefined && { directeurId }),
      },
      include: {
        manager: true,
        directeur: true,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.commercial.delete({
      where: { id },
      include: {
        manager: true,
        directeur: true,
      },
    });
  }
}
