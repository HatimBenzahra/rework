import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RankPeriod } from '@prisma/client';

@Injectable()
export class RankingService {
  private readonly logger = new Logger(RankingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // COMPUTE — Calculer le classement pour une période donnée
  // ============================================================================

  /**
   * Calcule le classement de tous les commerciaux actifs pour une période.
   *
   * Points = somme des prix (prixBase) des contrats validés sur la période.
   * Contrat à 10€ = 10 points de plus pour le commercial.
   *
   * Le calcul est idempotent: upsert par (commercialId, period, periodKey).
   */
  async computeRanking(
    period: RankPeriod,
    periodKey: string,
  ): Promise<{ computed: number }> {
    // 1. Récupérer tous les commerciaux actifs
    const commercials = await this.prisma.commercial.findMany({
      where: {
        status: 'ACTIF',
        winleadPlusId: { not: null },
      },
      select: { id: true },
    });

    // 2. Pour chaque commercial, calculer les points et contrats de la période
    const scores: Array<{
      commercialId: number;
      points: number;
      contratsSignes: number;
    }> = [];

    const periodField = this.getPeriodField(period);

    for (const commercial of commercials) {
      const { points, contratsSignes } = await this.computeCommercialScore(
        commercial.id,
        periodField,
        periodKey,
      );
      scores.push({ commercialId: commercial.id, points, contratsSignes });
    }

    // 3. Trier par points décroissants, puis par contrats signés en cas d'égalité
    scores.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.contratsSignes - a.contratsSignes;
    });

    // 4. Attribuer les rangs (ex aequo supporté)
    let currentRank = 1;
    for (let i = 0; i < scores.length; i++) {
      if (i > 0 && scores[i].points < scores[i - 1].points) {
        currentRank = i + 1;
      }

      // Récupérer le rang précédent pour le metadata
      const previousSnapshot = await this.prisma.rankSnapshot.findUnique({
        where: {
          commercialId_period_periodKey: {
            commercialId: scores[i].commercialId,
            period,
            periodKey,
          },
        },
        select: { rank: true },
      });

      const previousRank = previousSnapshot?.rank ?? null;
      const delta = previousRank !== null ? previousRank - currentRank : null;

      await this.prisma.rankSnapshot.upsert({
        where: {
          commercialId_period_periodKey: {
            commercialId: scores[i].commercialId,
            period,
            periodKey,
          },
        },
        create: {
          commercialId: scores[i].commercialId,
          period,
          periodKey,
          rank: currentRank,
          points: scores[i].points,
          contratsSignes: scores[i].contratsSignes,
          metadata: { previousRank, delta },
        },
        update: {
          rank: currentRank,
          points: scores[i].points,
          contratsSignes: scores[i].contratsSignes,
          metadata: { previousRank, delta },
          computedAt: new Date(),
        },
      });
    }

    this.logger.log(
      `Classement ${period}/${periodKey}: ${scores.length} commerciaux classés`,
    );
    return { computed: scores.length };
  }

  // ============================================================================
  // READ — Récupérer le classement d'une période
  // ============================================================================

  /** Récupérer le classement complet d'une période */
  async getRanking(period: RankPeriod, periodKey: string) {
    return this.prisma.rankSnapshot.findMany({
      where: {
        period,
        periodKey,
        commercial: {
          winleadPlusId: { not: null },
        },
      },
      include: {
        commercial: {
          select: { id: true, nom: true, prenom: true },
        },
      },
      orderBy: { rank: 'asc' },
    });
  }

  /** Récupérer le classement d'un commercial spécifique sur toutes les périodes */
  async getCommercialRankings(commercialId: number) {
    return this.prisma.rankSnapshot.findMany({
      where: { commercialId },
      orderBy: [{ period: 'asc' }, { computedAt: 'desc' }],
    });
  }

  // ============================================================================
  // HELPERS — Calcul du score d'un commercial
  // ============================================================================

  /**
   * Calcule le score d'un commercial pour une période.
   *
   * Points = somme des Offre.prixBase des contrats validés sur la période.
   * Contrat à 10€ → 10 points. Contrat sans prix → 0 points.
   * ContratsSignes = nombre de contrats validés sur la période.
   */
  private async computeCommercialScore(
    commercialId: number,
    periodField: string,
    periodKey: string,
  ): Promise<{ points: number; contratsSignes: number }> {
    // Récupérer les contrats validés de ce commercial pour cette période
    const contrats = await this.prisma.contratValide.findMany({
      where: {
        commercialId,
        [periodField]: periodKey,
      },
      include: {
        offre: {
          select: { prixBase: true },
        },
      },
    });

    // Points = somme des prix des contrats (arrondi à l'entier)
    const points = Math.round(
      contrats.reduce((sum, c) => sum + (c.offre?.prixBase ?? 0), 0),
    );

    return { points, contratsSignes: contrats.length };
  }

  /**
   * Mappe un RankPeriod vers le champ ContratValide correspondant.
   */
  private getPeriodField(period: RankPeriod): string {
    switch (period) {
      case 'DAILY':
        return 'periodDay';
      case 'WEEKLY':
        return 'periodWeek';
      case 'MONTHLY':
        return 'periodMonth';
      case 'QUARTERLY':
        return 'periodQuarter';
      case 'YEARLY':
        return 'periodYear';
      default:
        return 'periodMonth';
    }
  }
}
