import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateImmeubleInput, UpdateImmeubleInput } from './immeuble.dto';

@Injectable()
export class ImmeubleService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateImmeubleInput) {
    // Créer l'immeuble
    const immeuble = await this.prisma.immeuble.create({
      data,
    });

    // Créer automatiquement toutes les portes pour cet immeuble
    const portes: any[] = [];
    for (let etage = 1; etage <= data.nbEtages; etage++) {
      for (let porte = 1; porte <= data.nbPortesParEtage; porte++) {
        portes.push({
          numero: `${etage}${porte.toString().padStart(2, '0')}`,
          etage,
          immeubleId: immeuble.id,
          statut: 'NON_VISITE',
          nbRepassages: 0,
        });
      }
    }

    // Créer toutes les portes en une fois
    if (portes.length > 0) {
      await this.prisma.porte.createMany({
        data: portes,
      });
    }

    return immeuble;
  }

  async findAll(userId?: number, userRole?: string) {
    // Si pas de paramètres de filtrage, retourner tous les immeubles
    if (!userId || !userRole) {
      throw new ForbiddenException('UNAUTHORIZED');
    }

    // Filtrage selon le rôle
    switch (userRole) {
      case 'admin':
        return this.prisma.immeuble.findMany();

      case 'directeur':
        // Immeubles des commerciaux du directeur
        return this.prisma.immeuble.findMany({
          where: {
            commercial: {
              directeurId: userId,
            },
          },
        });

      case 'manager':
        // Immeubles des commerciaux du manager
        return this.prisma.immeuble.findMany({
          where: {
            commercial: {
              managerId: userId,
            },
          },
        });

      case 'commercial':
        // Immeubles du commercial
        return this.prisma.immeuble.findMany({
          where: {
            commercialId: userId,
          },
        });

      default:
        return [];
    }
  }

  async findOne(id: number) {
    return this.prisma.immeuble.findUnique({
      where: { id },
    });
  }

  async update(data: UpdateImmeubleInput) {
    const { id, ...updateData } = data;
    return this.prisma.immeuble.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number) {
    return this.prisma.immeuble.delete({
      where: { id },
    });
  }
}
