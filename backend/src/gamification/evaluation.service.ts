import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BadgeService } from './badge.service';

/**
 * Moteur d'évaluation automatique des badges.
 *
 * Lit les contrats validés (ContratValide) et les données de prospection (Statistic, StatusHistorique)
 * pour évaluer et attribuer les badges selon les 4 catégories:
 * - PROGRESSION: paliers tous produits confondus
 * - PRODUIT: paliers par badgeProductKey de l'offre
 * - PERFORMANCE: achievements individuels (timing, volumes, records, conversion, progression)
 * - TROPHEE: trophées trimestriels (top producteur par catégorie)
 */
@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly badgeService: BadgeService,
  ) {}

  // ============================================================================
  // ENTRY POINT — Évaluer tous les badges pour tous les commerciaux mappés
  // ============================================================================

  async evaluateAll(): Promise<{ evaluated: number; awarded: number; skipped: number }> {
    const commercials = await this.prisma.commercial.findMany({
      where: { status: 'ACTIF', winleadPlusId: { not: null } },
      select: { id: true, winleadPlusId: true },
    });

    const badges = await this.prisma.badgeDefinition.findMany({
      where: { isActive: true },
    });

    let totalAwarded = 0;
    let totalSkipped = 0;

    for (const commercial of commercials) {
      const result = await this.evaluateCommercial(commercial.id, badges);
      totalAwarded += result.awarded;
      totalSkipped += result.skipped;
    }

    this.logger.log(
      `Évaluation terminée: ${commercials.length} commerciaux évalués, ${totalAwarded} badges attribués, ${totalSkipped} déjà existants`,
    );

    return {
      evaluated: commercials.length,
      awarded: totalAwarded,
      skipped: totalSkipped,
    };
  }

  // ============================================================================
  // EVALUATION PAR COMMERCIAL
  // ============================================================================

  private async evaluateCommercial(
    commercialId: number,
    badges: any[],
  ): Promise<{ awarded: number; skipped: number }> {
    // Pré-charger toutes les données nécessaires pour ce commercial
    const context = await this.buildEvaluationContext(commercialId);

    let awarded = 0;
    let skipped = 0;

    for (const badge of badges) {
      const condition = badge.condition as any;
      if (!condition?.metric) continue;

      const shouldAward = this.evaluateBadge(badge, condition, context);
      if (!shouldAward) continue;

      const periodKey = this.getPeriodKeyForBadge(badge, condition, context);

      const result = await this.badgeService.awardBadge({
        commercialId,
        badgeDefinitionId: badge.id,
        periodKey,
        metadata: JSON.stringify({ evaluatedAt: new Date().toISOString(), auto: true }),
      });

      if (result.awarded) awarded++;
      else skipped++;
    }

    return { awarded, skipped };
  }

  // ============================================================================
  // CONTEXTE D'ÉVALUATION — Données pré-chargées pour un commercial
  // ============================================================================

  private async buildEvaluationContext(commercialId: number) {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentQuarter = `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;
    const currentYear = `${now.getFullYear()}`;
    const currentDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Tous les contrats validés de ce commercial
    const allContrats = await this.prisma.contratValide.findMany({
      where: { commercialId },
      include: { offre: true },
      orderBy: { dateValidation: 'asc' },
    });

    // Contrats groupés par produit (via offre.badgeProductKey)
    const contratsByProduct = new Map<string, number>();
    for (const c of allContrats) {
      const key = c.offre?.badgeProductKey;
      if (key) {
        contratsByProduct.set(key, (contratsByProduct.get(key) ?? 0) + 1);
      }
    }

    // Contrats par jour (pour multi-signatures/jour)
    const contratsByDay = new Map<string, number>();
    for (const c of allContrats) {
      contratsByDay.set(c.periodDay, (contratsByDay.get(c.periodDay) ?? 0) + 1);
    }

    // Contrats par semaine (pour records hebdo)
    const contratsByWeek = new Map<string, number>();
    for (const c of allContrats) {
      contratsByWeek.set(c.periodWeek, (contratsByWeek.get(c.periodWeek) ?? 0) + 1);
    }

    // Contrats par mois (pour progression)
    const contratsByMonth = new Map<string, number>();
    for (const c of allContrats) {
      contratsByMonth.set(c.periodMonth, (contratsByMonth.get(c.periodMonth) ?? 0) + 1);
    }

    // Contrats par trimestre par catégorie produit (pour trophées)
    const contratsByQuarterProduct = new Map<string, number>();
    for (const c of allContrats) {
      const prodKey = c.offre?.badgeProductKey;
      if (prodKey) {
        const key = `${c.periodQuarter}:${prodKey}`;
        contratsByQuarterProduct.set(key, (contratsByQuarterProduct.get(key) ?? 0) + 1);
      }
    }

    // Contrats du mois en cours (pour ranking mensuel)
    const contratsThisMonth = allContrats.filter((c) => c.periodMonth === currentMonth).length;

    // Contrats du trimestre en cours
    const contratsThisQuarter = allContrats.filter((c) => c.periodQuarter === currentQuarter).length;

    // Badges déjà obtenus (pour meta-badge Grand Chelem)
    const existingBadges = await this.prisma.commercialBadge.findMany({
      where: { commercialId },
      select: { badgeDefinitionId: true },
    });
    const distinctBadgeCount = new Set(existingBadges.map((b) => b.badgeDefinitionId)).size;

    // Timing: heures des contrats validés aujourd'hui
    const todayContrats = allContrats.filter((c) => c.periodDay === currentDay);
    const todayHours = todayContrats.map((c) => c.dateValidation.getHours());

    // Portes tapées par jour (pour record et badge Marathon)
    const portesParJour = await this.getPortesParJour(commercialId);

    // Stats de conversion (contrats validés / argumentés)
    const stats = await this.prisma.statistic.aggregate({
      where: { commercialId },
      _sum: { argumentes: true, nbPortesProspectes: true },
    });
    const totalArgumentes = stats._sum.argumentes ?? 0;
    const totalPortesProspectes = stats._sum.nbPortesProspectes ?? 0;

    // Repassages (Porte avec nbRepassages > 0 et CONTRAT_SIGNE)
    const repassageContrats = await this.prisma.porte.count({
      where: {
        immeuble: { commercialId },
        statut: 'CONTRAT_SIGNE',
        nbRepassages: { gt: 0 },
      },
    });

    return {
      now,
      currentDay,
      currentMonth,
      currentQuarter,
      currentYear,
      totalContrats: allContrats.length,
      contratsByProduct,
      contratsByDay,
      contratsByWeek,
      contratsByMonth,
      contratsByQuarterProduct,
      contratsThisMonth,
      contratsThisQuarter,
      distinctBadgeCount,
      todayHours,
      portesParJour,
      totalArgumentes,
      totalPortesProspectes,
      repassageContrats,
      allContrats,
      commercialId,
    };
  }

  // ============================================================================
  // ÉVALUATION D'UN BADGE — Dispatch par métrique
  // ============================================================================

  private evaluateBadge(badge: any, condition: any, ctx: any): boolean {
    switch (condition.metric) {
      // --- PROGRESSION ---
      case 'contratsSignes':
        return this.evalContratsSignes(condition, ctx);

      // --- PRODUIT ---
      case 'contratsProduit':
        return this.evalContratsProduit(condition, ctx);

      // --- PERFORMANCE: Timing ---
      case 'signatureTiming':
        return this.evalSignatureTiming(condition, ctx);

      // --- PERFORMANCE: Repassage ---
      case 'signatureRepassage':
        return ctx.repassageContrats > 0;

      // --- PERFORMANCE: Volume portes ---
      case 'portesParJour':
        return this.evalPortesParJour(condition, ctx);

      // --- PERFORMANCE: Multi-signatures/jour ---
      case 'signaturesParJour':
        return this.evalSignaturesParJour(condition, ctx);

      // --- PERFORMANCE: Records hebdo ---
      case 'signaturesParSemaine':
        return this.evalSignaturesParSemaine(condition, ctx);

      // --- PERFORMANCE: Conversion ---
      case 'tauxConversion':
        // Nécessite un classement comparatif — évalué via computeRanking
        return false;

      // --- PERFORMANCE: Ratio portes/signatures ---
      case 'ratioPortesSignatures':
        // Nécessite un classement comparatif — évalué via computeRanking
        return false;

      // --- PERFORMANCE: Progression ---
      case 'progressionHebdo':
        return this.evalProgressionHebdo(condition, ctx);

      case 'progressionMensuelle':
        return this.evalProgressionMensuelle(condition, ctx);

      // --- PERFORMANCE: Badge consécutif ---
      case 'badgeConsecutif':
        // Complexe — nécessite analyse temporelle des attributions
        return false;

      // --- PERFORMANCE: Meta-badge ---
      case 'badgesDistincts':
        return ctx.distinctBadgeCount >= (condition.threshold ?? 5);

      default:
        return false;
    }
  }

  // ============================================================================
  // ÉVALUATEURS SPÉCIFIQUES
  // ============================================================================

  /** PROGRESSION: nombre total de contrats validés >= threshold */
  private evalContratsSignes(condition: any, ctx: any): boolean {
    // Pour les badges avec ranking (top1, top2, top3) — évalués séparément
    if (condition.ranking) return false;

    return ctx.totalContrats >= (condition.threshold ?? 0);
  }

  /** PRODUIT: nombre de contrats validés pour un produit donné >= threshold */
  private evalContratsProduit(condition: any, ctx: any): boolean {
    // Pour les trophées avec ranking — évalués séparément
    if (condition.ranking) return false;

    const categorie = condition.categorie;
    if (!categorie) return false;

    // Mapper la catégorie du badge vers les badgeProductKey correspondants
    const productKeys = this.mapCategorieToProductKeys(categorie);
    let count = 0;
    for (const key of productKeys) {
      count += ctx.contratsByProduct.get(key) ?? 0;
    }

    return count >= (condition.threshold ?? 0);
  }

  /** TIMING: contrat validé à des heures spécifiques */
  private evalSignatureTiming(condition: any, ctx: any): boolean {
    if (ctx.todayHours.length === 0) return false;

    switch (condition.scope) {
      case 'derniere_heure':
        // Contrat validé dans la dernière heure de la journée (entre 23h et minuit)
        return ctx.todayHours.some((h: number) => h >= 23);

      case 'apres_19h':
        // Contrat validé après 19h
        return ctx.todayHours.some((h: number) => h >= 19);

      default:
        return false;
    }
  }

  /** VOLUME PORTES: record de portes tapées en un jour */
  private evalPortesParJour(condition: any, ctx: any): boolean {
    if (condition.scope !== 'record') return false;
    // Le record est un badge « snapshot » — attribué si le commercial a un historique
    return ctx.portesParJour > 0;
  }

  /** MULTI-SIGNATURES: N contrats validés dans une même journée */
  private evalSignaturesParJour(condition: any, ctx: any): boolean {
    const threshold = condition.threshold ?? 3;
    for (const count of ctx.contratsByDay.values()) {
      if (count >= threshold) return true;
    }
    return false;
  }

  /** RECORDS HEBDO: record de contrats validés sur une semaine */
  private evalSignaturesParSemaine(condition: any, ctx: any): boolean {
    if (condition.scope !== 'record') return false;
    // Attribué si le commercial a au moins une semaine avec des contrats
    for (const count of ctx.contratsByWeek.values()) {
      if (count > 0) return true;
    }
    return false;
  }

  /** PROGRESSION HEBDO: a progressé chaque semaine du mois en cours */
  private evalProgressionHebdo(condition: any, ctx: any): boolean {
    if (condition.scope !== 'mois' || condition.type !== 'constante') return false;

    // Récupérer les semaines du mois en cours et vérifier progression constante
    const currentMonth = ctx.currentMonth;
    const weeksInMonth: string[] = [];

    for (const c of ctx.allContrats) {
      if (c.periodMonth === currentMonth && !weeksInMonth.includes(c.periodWeek)) {
        weeksInMonth.push(c.periodWeek);
      }
    }

    if (weeksInMonth.length < 2) return false;

    weeksInMonth.sort();
    for (let i = 1; i < weeksInMonth.length; i++) {
      const prev = ctx.contratsByWeek.get(weeksInMonth[i - 1]) ?? 0;
      const curr = ctx.contratsByWeek.get(weeksInMonth[i]) ?? 0;
      if (curr <= prev) return false;
    }

    return true;
  }

  /** PROGRESSION MENSUELLE: amélioration de plus de X% d'un mois à l'autre */
  private evalProgressionMensuelle(condition: any, ctx: any): boolean {
    const threshold = condition.threshold ?? 50; // % d'amélioration requis

    const months = Array.from(ctx.contratsByMonth.keys()).sort();
    if (months.length < 2) return false;

    const lastMonth = months[months.length - 1];
    const prevMonth = months[months.length - 2];
    const lastCount = ctx.contratsByMonth.get(lastMonth) ?? 0;
    const prevCount = ctx.contratsByMonth.get(prevMonth) ?? 0;

    if (prevCount === 0) return lastCount > 0;

    const improvement = ((lastCount - prevCount) / prevCount) * 100;
    return improvement >= threshold;
  }

  // ============================================================================
  // TROPHÉES — Évaluation comparative (top1 par catégorie sur le trimestre)
  // ============================================================================

  /**
   * Évalue les trophées trimestriels pour tous les commerciaux.
   * Appelé séparément car nécessite un classement comparatif.
   */
  async evaluateTrophees(
    quarter: string,
  ): Promise<{ awarded: number; skipped: number }> {
    const trophees = await this.prisma.badgeDefinition.findMany({
      where: { category: 'TROPHEE', isActive: true },
    });

    let awarded = 0;
    let skipped = 0;

    for (const trophee of trophees) {
      const condition = trophee.condition as any;
      if (!condition?.ranking || !condition?.scope) continue;

      const winnerId = await this.findTropheeWinner(condition, quarter);
      if (!winnerId) continue;

      const result = await this.badgeService.awardBadge({
        commercialId: winnerId,
        badgeDefinitionId: trophee.id,
        periodKey: quarter,
        metadata: JSON.stringify({ quarter, auto: true }),
      });

      if (result.awarded) awarded++;
      else skipped++;
    }

    return { awarded, skipped };
  }

  /**
   * Trouve le gagnant d'un trophée pour un trimestre donné.
   */
  private async findTropheeWinner(
    condition: any,
    quarter: string,
  ): Promise<number | null> {
    if (condition.metric === 'contratsSignes') {
      // Top producteur global — plus de contrats validés sur le trimestre
      const topCommercial = await this.prisma.contratValide.groupBy({
        by: ['commercialId'],
        where: { periodQuarter: quarter, commercialId: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 1,
      });

      return topCommercial[0]?.commercialId ?? null;
    }

    if (condition.metric === 'contratsProduit' && condition.categorie) {
      // Top producteur par catégorie
      const productKeys = this.mapCategorieToProductKeys(condition.categorie);
      if (productKeys.length === 0) return null;

      // Récupérer les contrats du trimestre pour ces produits
      const topCommercial = await this.prisma.contratValide.groupBy({
        by: ['commercialId'],
        where: {
          periodQuarter: quarter,
          commercialId: { not: null },
          offre: { badgeProductKey: { in: productKeys } },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 1,
      });

      return topCommercial[0]?.commercialId ?? null;
    }

    return null;
  }

  // ============================================================================
  // PERFORMANCE RANKING — Badges basés sur le classement mensuel
  // ============================================================================

  /**
   * Évalue les badges de performance basés sur le ranking (top1/2/3 mensuel).
   */
  async evaluatePerformanceRanking(
    month: string,
  ): Promise<{ awarded: number; skipped: number }> {
    const rankingBadges = await this.prisma.badgeDefinition.findMany({
      where: {
        category: 'PERFORMANCE',
        isActive: true,
      },
    });

    // Filtrer ceux qui ont un ranking dans leur condition
    const rankedBadges = rankingBadges.filter((b) => {
      const cond = b.condition as any;
      return cond?.ranking && cond?.scope === 'mois';
    });

    if (rankedBadges.length === 0) return { awarded: 0, skipped: 0 };

    // Calculer le classement du mois par contrats validés
    const ranking = await this.prisma.contratValide.groupBy({
      by: ['commercialId'],
      where: { periodMonth: month, commercialId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    let awarded = 0;
    let skipped = 0;

    for (const badge of rankedBadges) {
      const condition = badge.condition as any;
      const rankPosition = this.parseRankPosition(condition.ranking);
      if (rankPosition === null || rankPosition > ranking.length) continue;

      const winnerId = ranking[rankPosition - 1]?.commercialId;
      if (!winnerId) continue;

      const result = await this.badgeService.awardBadge({
        commercialId: winnerId,
        badgeDefinitionId: badge.id,
        periodKey: month,
        metadata: JSON.stringify({
          month,
          rank: rankPosition,
          contrats: ranking[rankPosition - 1]._count.id,
          auto: true,
        }),
      });

      if (result.awarded) awarded++;
      else skipped++;
    }

    return { awarded, skipped };
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Mappe les catégories de badges (ex: "Télécom – Mobile") vers les badgeProductKey
   * correspondants dans la table Offre.
   */
  private mapCategorieToProductKeys(categorie: string): string[] {
    const mapping: Record<string, string[]> = {
      'Télécom – Mobile': ['MOBILE'],
      'Télécom – Fibre': ['FIBRE'],
      'Énergie – Dépanssur': ['DEPANSSUR'],
      'Énergie – Électricité/Gaz': ['ELEC_GAZ'],
      'Conciergerie Privée': ['CONCIERGERIE'],
      'Mondial TV': ['MONDIAL_TV'],
      'Assurance – Mutuelle/Prévoyance/MRH': ['ASSURANCE'],
      // Catégories trophées (plus larges)
      'Énergie': ['DEPANSSUR', 'ELEC_GAZ'],
      'Télécom': ['MOBILE', 'FIBRE'],
      'Assurance': ['ASSURANCE'],
    };

    return mapping[categorie] ?? [];
  }

  /** Parse "top1" → 1, "top2" → 2, "top3" → 3 */
  private parseRankPosition(ranking: string): number | null {
    const match = ranking?.match(/^top(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  }

  /** Nombre maximum de portes tapées en un jour par ce commercial */
  private async getPortesParJour(commercialId: number): Promise<number> {
    // Utilise StatusHistorique pour compter les portes visitées par jour
    const result = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "StatusHistorique"
      WHERE "commercialId" = ${commercialId}
      GROUP BY DATE("createdAt")
      ORDER BY count DESC
      LIMIT 1
    `;

    return result.length > 0 ? Number(result[0].count) : 0;
  }

  /**
   * Détermine la periodKey appropriée pour l'attribution d'un badge.
   * Les badges de progression sont « lifetime » (clé = "lifetime"),
   * les badges de produit aussi.
   * Les badges de performance dépendent de leur scope.
   */
  private getPeriodKeyForBadge(badge: any, condition: any, ctx: any): string {
    switch (badge.category) {
      case 'PROGRESSION':
        return 'lifetime';

      case 'PRODUIT':
        return 'lifetime';

      case 'PERFORMANCE':
        if (condition.scope === 'mois') return ctx.currentMonth;
        if (condition.scope === 'semaine') return this.getCurrentWeek(ctx.now);
        if (condition.scope === 'record') return 'lifetime';
        return ctx.currentDay;

      case 'TROPHEE':
        return ctx.currentQuarter;

      default:
        return ctx.currentDay;
    }
  }

  private getCurrentWeek(date: Date): string {
    const y = date.getFullYear();
    const d = new Date(Date.UTC(y, date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${y}-W${String(weekNo).padStart(2, '0')}`;
  }
}
