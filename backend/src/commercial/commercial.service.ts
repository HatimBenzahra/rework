import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCommercialInput, UpdateCommercialInput } from './commercial.dto';
import { UserType } from '../zone/zone.dto';

@Injectable()
export class CommercialService {
  constructor(private prisma: PrismaService) {}

  private async ensureAccess(
    commercialId: number,
    userId: number,
    userRole: string,
  ) {
    const commercial = await this.prisma.commercial.findUnique({
      where: { id: commercialId },
      select: {
        id: true,
        managerId: true,
        directeurId: true,
      },
    });

    if (!commercial) {
      throw new NotFoundException('Commercial not found');
    }

    if (userRole === 'admin') {
      return commercial;
    }

    if (userRole === 'directeur' && commercial.directeurId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (userRole === 'manager' && commercial.managerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (userRole === 'commercial' && commercial.id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return commercial;
  }

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

  async findAll(userId?: number, userRole?: string) {
    // Vérifier que les paramètres sont définis (userId peut être 0 pour les admins)
    if (userId === undefined || !userRole) {
      throw new ForbiddenException('UNAUTHORIZED');
    }

    switch (userRole) {
      case 'admin':
        return this.prisma.commercial.findMany({
          include: {
            manager: true,
            directeur: true,
            immeubles: true,
            statistics: true,
          },
        });

      case 'directeur':
        return this.prisma.commercial.findMany({
          where: {
            directeurId: userId,
          },
          include: {
            manager: true,
            directeur: true,
            immeubles: true,
            statistics: true,
          },
        });

      case 'manager':
        // Commerciaux assignés au manager
        return this.prisma.commercial.findMany({
          where: {
            managerId: userId,
          },
          include: {
            manager: true,
            directeur: true,
            immeubles: true,
            statistics: true,
          },
        });

      case 'commercial':
        // Le commercial lui-même
        return this.prisma.commercial.findMany({
          where: {
            id: userId,
          },
          include: {
            manager: true,
            directeur: true,
            immeubles: true,
            statistics: true,
          },
        });

      default:
        return [];
    }
  }

  async findOne(id: number, userId: number, userRole: string) {
    await this.ensureAccess(id, userId, userRole);

    return this.prisma.commercial.findUnique({
      where: { id },
      include: {
        manager: true,
        directeur: true,
        immeubles: {
          include: {
            portes: true,
          },
        },
        statistics: true,
      },
    });
  }

  async update(data: UpdateCommercialInput, userId: number, userRole: string) {
    const { id, ...updateData } = data;

    await this.ensureAccess(id, userId, userRole);

    // Si le managerId est modifié, mettre à jour automatiquement le directeurId
    let directeurId = updateData.directeurId;

    if (
      updateData.managerId !== undefined &&
      updateData.managerId !== null &&
      !directeurId
    ) {
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

  async remove(id: number, userId: number, userRole: string) {
    await this.ensureAccess(id, userId, userRole);

    return this.prisma.commercial.delete({
      where: { id },
      include: {
        manager: true,
        directeur: true,
      },
    });
  }

  async getCurrentZone(commercialId: number) {
    const zoneEnCours = await this.prisma.zoneEnCours.findUnique({
      where: {
        userId_userType: {
          userId: commercialId,
          userType: UserType.COMMERCIAL,
        },
      },
      include: {
        zone: true,
      },
    });

    return zoneEnCours?.zone || null;
  }
}
