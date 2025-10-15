import { Injectable } from '@nestjs/common';
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

  async findAll() {
    return this.prisma.immeuble.findMany();
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
