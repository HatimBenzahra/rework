import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StatutPorte } from '../porte/porte.dto';

/**
 * Service de synchronisation automatique des statistiques
 * Maintient la cohérence entre les actions sur les portes et les stats
 */
@Injectable()
export class StatisticSyncService {
  private readonly logger = new Logger(StatisticSyncService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Met à jour les statistiques d'un commercial après modification d'une porte
   */
  async syncCommercialStats(immeubleId: number): Promise<void> {
    try {
      // 1. Récupérer l'immeuble et son commercial
      const immeuble = await this.prisma.immeuble.findUnique({
        where: { id: immeubleId },
        include: { commercial: true }
      });

      if (!immeuble?.commercial) {
        this.logger.warn(`Immeuble ${immeubleId} n'a pas de commercial associé`);
        return;
      }

      const commercialId = immeuble.commercial.id;

      // 2. Calculer les nouvelles statistiques basées sur toutes les portes du commercial
      const realStats = await this.calculateRealStats(commercialId);

      // 3. Mettre à jour ou créer la statistique
      await this.upsertStatistic(commercialId, realStats);

      this.logger.debug(`Stats mises à jour pour commercial ${commercialId}:`, realStats);

    } catch (error) {
      this.logger.error(`Erreur sync stats pour immeuble ${immeubleId}:`, error);
      throw error;
    }
  }

  /**
   * Calcule les statistiques réelles d'un commercial basées sur ses portes
   */
  private async calculateRealStats(commercialId: number) {
    // Récupérer toutes les portes des immeubles du commercial
    const result = await this.prisma.porte.groupBy({
      by: ['statut'],
      where: {
        immeuble: {
          commercialId: commercialId
        }
      },
      _count: {
        statut: true
      }
    });

    // Calculer aussi le nombre d'immeubles visités (au moins une porte non NON_VISITE)
    const immeublesVisites = await this.prisma.immeuble.count({
      where: {
        commercialId: commercialId,
        portes: {
          some: {
            statut: {
              not: StatutPorte.NON_VISITE
            }
          }
        }
      }
    });

    // Transformer en stats
    const stats = {
      contratsSignes: 0,
      rendezVousPris: 0,
      refus: 0,
      immeublesVisites: immeublesVisites,
      nbImmeublesProspectes: immeublesVisites, // Pour l'instant identique
      nbPortesProspectes: 0
    };

    result.forEach(group => {
      const count = group._count.statut;
      
      switch (group.statut) {
        case StatutPorte.CONTRAT_SIGNE:
          stats.contratsSignes += count;
          stats.nbPortesProspectes += count;
          break;
        case StatutPorte.RENDEZ_VOUS_PRIS:
          stats.rendezVousPris += count;
          stats.nbPortesProspectes += count;
          break;
        case StatutPorte.REFUS:
          stats.refus += count;
          stats.nbPortesProspectes += count;
          break;
        case StatutPorte.CURIEUX:
        case StatutPorte.NECESSITE_REPASSAGE:
          stats.nbPortesProspectes += count;
          break;
      }
    });

    return stats;
  }

  /**
   * Met à jour ou crée une statistique pour un commercial
   */
  private async upsertStatistic(commercialId: number, stats: any) {
    // Récupérer la zone assignée au commercial
    const commercialZone = await this.prisma.commercialZone.findFirst({
      where: { commercialId }
    });

    const zoneId = commercialZone?.zoneId || null;

    // Chercher d'abord s'il existe une stat pour ce commercial
    const existingStat = await this.prisma.statistic.findFirst({
      where: { commercialId: commercialId }
    });

    if (existingStat) {
      // Mettre à jour (incluant zoneId)
      return this.prisma.statistic.update({
        where: { id: existingStat.id },
        data: {
          ...stats,
          zoneId, // Synchroniser avec la zone du commercial
          updatedAt: new Date()
        }
      });
    } else {
      // Créer (incluant zoneId)
      return this.prisma.statistic.create({
        data: {
          commercialId: commercialId,
          zoneId, // Assigner automatiquement la zone du commercial
          ...stats
        }
      });
    }
  }

  /**
   * Recalcule toutes les statistiques (job de maintenance)
   */
  async recalculateAllStats(): Promise<{ updated: number; errors: number }> {
    let updated = 0;
    let errors = 0;

    try {
      // Récupérer tous les commerciaux
      const commerciaux = await this.prisma.commercial.findMany({
        select: { id: true }
      });

      for (const commercial of commerciaux) {
        try {
          const stats = await this.calculateRealStats(commercial.id);
          await this.upsertStatistic(commercial.id, stats);
          updated++;
        } catch (error) {
          this.logger.error(`Erreur recalcul stats commercial ${commercial.id}:`, error);
          errors++;
        }
      }

      this.logger.log(`Recalcul terminé: ${updated} mis à jour, ${errors} erreurs`);
      return { updated, errors };

    } catch (error) {
      this.logger.error('Erreur générale recalcul stats:', error);
      throw error;
    }
  }

  /**
   * Valide la cohérence entre portes et stats
   */
  async validateStatsCoherence(): Promise<{ valid: number; invalid: any[] }> {
    const invalid: Array<{
      commercialId: number;
      commercial: string;
      current: any;
      real: any;
    }> = [];
    let valid = 0;

    try {
      const statistics = await this.prisma.statistic.findMany({
        include: { commercial: true }
      });

      for (const stat of statistics) {
        if (!stat.commercialId) continue; // Skip si pas de commercial associé
        
        const realStats = await this.calculateRealStats(stat.commercialId);
        
        const isValid = (
          stat.contratsSignes === realStats.contratsSignes &&
          stat.rendezVousPris === realStats.rendezVousPris &&
          stat.refus === realStats.refus &&
          stat.immeublesVisites === realStats.immeublesVisites
        );

        if (isValid) {
          valid++;
        } else {
          invalid.push({
            commercialId: stat.commercialId,
            commercial: stat.commercial?.nom + ' ' + stat.commercial?.prenom,
            current: {
              contratsSignes: stat.contratsSignes,
              rendezVousPris: stat.rendezVousPris,
              refus: stat.refus,
              immeublesVisites: stat.immeublesVisites
            },
            real: realStats
          });
        }
      }

      return { valid, invalid };

    } catch (error) {
      this.logger.error('Erreur validation cohérence:', error);
      throw error;
    }
  }
}