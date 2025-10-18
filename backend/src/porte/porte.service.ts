import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePorteInput, UpdatePorteInput, StatutPorte } from './porte.dto';

@Injectable()
export class PorteService {
  constructor(private prisma: PrismaService) {}

  async create(createPorteInput: CreatePorteInput) {
    return this.prisma.porte.create({
      data: createPorteInput,
    });
  }

  async findAll() {
    return this.prisma.porte.findMany({
      include: {
        immeuble: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.porte.findUnique({
      where: { id },
      include: {
        immeuble: true,
      },
    });
  }

  async findByImmeuble(immeubleId: number) {
    return this.prisma.porte.findMany({
      where: { immeubleId },
      orderBy: [{ etage: 'asc' }, { numero: 'asc' }],
    });
  }

  async update(updatePorteInput: UpdatePorteInput) {
    const { id, ...data } = updatePorteInput;

    // Si le statut change vers NECESSITE_REPASSAGE, incrémenter le nombre de repassages
    if (data.statut === StatutPorte.NECESSITE_REPASSAGE) {
      const currentPorte = await this.prisma.porte.findUnique({
        where: { id },
      });
      if (
        currentPorte &&
        currentPorte.statut !== StatutPorte.NECESSITE_REPASSAGE
      ) {
        data.nbRepassages = (currentPorte.nbRepassages || 0) + 1;
      }
    }

    const updatedPorte = await this.prisma.porte.update({
      where: { id },
      data,
      include: {
        immeuble: true,
      },
    });

    // tri du plus récent au plus ancien
    await this.prisma.immeuble.update({
      where: { id: updatedPorte.immeubleId },
      data: { updatedAt: new Date() },
    });

    return updatedPorte;
  }

  async remove(id: number) {
    return this.prisma.porte.delete({
      where: { id },
    });
  }

  async createPortesForImmeuble(
    immeubleId: number,
    nbEtages: number,
    nbPortesParEtage: number,
  ) {
    const portes: any[] = [];

    for (let etage = 1; etage <= nbEtages; etage++) {
      for (let porte = 1; porte <= nbPortesParEtage; porte++) {
        portes.push({
          numero: `${etage}${porte.toString().padStart(2, '0')}`,
          etage,
          immeubleId,
          statut: 'NON_VISITE',
          nbRepassages: 0,
        });
      }
    }

    return this.prisma.porte.createMany({
      data: portes,
      skipDuplicates: true,
    });
  }

  async getStatistiquesPortes(immeubleId?: number) {
    const whereClause = immeubleId ? { immeubleId } : {};

    const [
      totalPortes,
      contratsSigne,
      rdvPris,
      curieux,
      refus,
      nonVisitees,
      necessiteRepassage,
    ] = await Promise.all([
      this.prisma.porte.count({ where: whereClause }),
      this.prisma.porte.count({
        where: { ...whereClause, statut: StatutPorte.CONTRAT_SIGNE },
      }),
      this.prisma.porte.count({
        where: { ...whereClause, statut: StatutPorte.RENDEZ_VOUS_PRIS },
      }),
      this.prisma.porte.count({
        where: { ...whereClause, statut: StatutPorte.CURIEUX },
      }),
      this.prisma.porte.count({
        where: { ...whereClause, statut: StatutPorte.REFUS },
      }),
      this.prisma.porte.count({
        where: { ...whereClause, statut: StatutPorte.NON_VISITE },
      }),
      this.prisma.porte.count({
        where: { ...whereClause, statut: StatutPorte.NECESSITE_REPASSAGE },
      }),
    ]);

    return {
      totalPortes,
      contratsSigne,
      rdvPris,
      curieux,
      refus,
      nonVisitees,
      necessiteRepassage,
      portesVisitees: totalPortes - nonVisitees,
      tauxConversion:
        totalPortes > 0
          ? ((contratsSigne / totalPortes) * 100).toFixed(2)
          : '0',
    };
  }
}
