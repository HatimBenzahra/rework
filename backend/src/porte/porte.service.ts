import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePorteInput, UpdatePorteInput, StatutPorte } from './porte.dto';
import { StatisticSyncService } from '../statistic/statistic-sync.service';

@Injectable()
export class PorteService {
  constructor(
    private prisma: PrismaService,
    private statisticSyncService: StatisticSyncService
  ) {}

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

    // 1. Récupérer l'état actuel pour détecter les changements
    const currentPorte = await this.prisma.porte.findUnique({
      where: { id },
      include: { immeuble: true }
    });

    if (!currentPorte) {
      throw new Error(`Porte avec id ${id} non trouvée`);
    }

    const oldStatut = currentPorte.statut;

    // 2. Si le statut change vers NECESSITE_REPASSAGE, incrémenter le nombre de repassages
    if (data.statut === StatutPorte.NECESSITE_REPASSAGE) {
      if (currentPorte.statut !== StatutPorte.NECESSITE_REPASSAGE) {
        data.nbRepassages = (currentPorte.nbRepassages || 0) + 1;
      }
    }

    // 3. Mettre à jour la porte
    const updatedPorte = await this.prisma.porte.update({
      where: { id },
      data,
      include: {
        immeuble: true,
      },
    });

    // 4. Mettre à jour le timestamp de l'immeuble (tri du plus récent au plus ancien)
    await this.prisma.immeuble.update({
      where: { id: updatedPorte.immeubleId },
      data: { updatedAt: new Date() },
    });

    // 5. 🎯 NOUVELLE LOGIQUE : Synchroniser les statistiques si le statut a changé
    if (data.statut && data.statut !== oldStatut) {
      try {
        await this.statisticSyncService.syncCommercialStats(updatedPorte.immeubleId);
      } catch (error) {
        // Log l'erreur mais ne fait pas échouer la mise à jour de la porte
        console.error('Erreur sync statistiques:', error);
      }
    }

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

  async findModifiedToday(immeubleId?: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const whereClause: any = {
      updatedAt: {
        gte: today,
        lt: tomorrow,
      },
      statut: {
        not: StatutPorte.NON_VISITE, // Exclure les portes non visitées
      },
    };

    if (immeubleId) {
      whereClause.immeubleId = immeubleId;
    }

    return this.prisma.porte.findMany({
      where: whereClause,
      include: {
        immeuble: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findRdvToday() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // Format YYYY-MM-DD

    return this.prisma.porte.findMany({
      where: {
        statut: StatutPorte.RENDEZ_VOUS_PRIS,
        rdvDate: {
          gte: new Date(todayStr),
          lt: new Date(new Date(todayStr).getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: {
        immeuble: {
          include: {
            zone: true,
          },
        },
      },
      orderBy: {
        rdvTime: 'asc',
      },
    });
  }
}
