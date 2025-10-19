import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateStatisticInput, UpdateStatisticInput } from './statistic.dto';

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
}
