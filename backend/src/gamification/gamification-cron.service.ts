import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { ContratService } from './contrat.service';
import { EvaluationService } from './evaluation.service';
import { RankingService } from './ranking.service';

/**
 * CRON automatique pour la gamification.
 *
 * Pipeline quotidien:
 * 1. Obtenir un token service via Keycloak client_credentials
 * 2. Sync contrats validés depuis WinLead+ /api/prospects
 * 3. Évaluer les badges pour tous les commerciaux
 * 4. Recalculer les classements (jour, semaine, mois, trimestre, année)
 *
 * Fréquence: tous les jours à 2h du matin (hors heures de travail).
 */
@Injectable()
export class GamificationCronService {
  private readonly logger = new Logger(GamificationCronService.name);

  private readonly keycloakBaseUrl = process.env.KEYCLOAK_BASE_URL;
  private readonly keycloakRealm = process.env.KEYCLOAK_REALM;
  private readonly keycloakClientId = process.env.KEYCLOAK_CLIENT_ID;
  private readonly keycloakClientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

  constructor(
    private readonly contratService: ContratService,
    private readonly evaluationService: EvaluationService,
    private readonly rankingService: RankingService,
  ) {}

  // ============================================================================
  // CRON PRINCIPAL — Tous les jours à 2h du matin
  // ============================================================================

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyGamification() {
    this.logger.log('🎮 Début du pipeline gamification quotidien');
    const start = Date.now();

    try {
      // Étape 1: Sync contrats (nécessite un token Keycloak)
      await this.syncContratsWithServiceToken();

      // Étape 2: Évaluer les badges
      const badgeResult = await this.evaluationService.evaluateAll();
      this.logger.log(
        `✅ Badges: ${badgeResult.awarded} attribués, ${badgeResult.skipped} déjà existants`,
      );

      // Étape 3: Recalculer les classements
      await this.computeAllRankings();

      const duration = Math.round((Date.now() - start) / 1000);
      this.logger.log(`🎮 Pipeline gamification terminé en ${duration}s`);
    } catch (error: any) {
      this.logger.error(
        `❌ Pipeline gamification échoué: ${error.message}`,
        error.stack,
      );
    }
  }

  // ============================================================================
  // CRON TROPHÉES — Chaque 1er du mois à 3h (évaluation fin de trimestre)
  // ============================================================================

  @Cron('0 3 1 * *') // 3h du matin, le 1er de chaque mois
  async handleMonthlyTrophees() {
    const now = new Date();
    const month = now.getMonth(); // 0-indexed

    // Évaluer les trophées trimestriels uniquement en début de trimestre
    // (janvier=0, avril=3, juillet=6, octobre=9 → évalue le trimestre précédent)
    if ([0, 3, 6, 9].includes(month)) {
      const previousQuarter = this.getPreviousQuarter(now);
      this.logger.log(`🏆 Évaluation trophées trimestre: ${previousQuarter}`);

      try {
        const result = await this.evaluationService.evaluateTrophees(previousQuarter);
        this.logger.log(
          `✅ Trophées ${previousQuarter}: ${result.awarded} attribués, ${result.skipped} déjà existants`,
        );
      } catch (error: any) {
        this.logger.error(
          `❌ Évaluation trophées échouée: ${error.message}`,
          error.stack,
        );
      }
    }

    // Évaluer les badges de performance ranking du mois précédent
    const previousMonth = this.getPreviousMonth(now);
    this.logger.log(`🥇 Évaluation performance ranking: ${previousMonth}`);

    try {
      const result = await this.evaluationService.evaluatePerformanceRanking(previousMonth);
      this.logger.log(
        `✅ Performance ${previousMonth}: ${result.awarded} attribués, ${result.skipped} déjà existants`,
      );
    } catch (error: any) {
      this.logger.error(
        `❌ Évaluation performance ranking échouée: ${error.message}`,
        error.stack,
      );
    }
  }

  // ============================================================================
  // SYNC — Obtenir un token service et synchroniser les contrats
  // ============================================================================

  private async syncContratsWithServiceToken() {
    if (!this.keycloakBaseUrl || !this.keycloakClientId || !this.keycloakClientSecret) {
      this.logger.warn(
        '⚠️ Variables Keycloak manquantes (KEYCLOAK_BASE_URL, KEYCLOAK_CLIENT_ID, KEYCLOAK_CLIENT_SECRET). Sync contrats ignorée.',
      );
      return;
    }

    try {
      const token = await this.getServiceToken();

      const result = await this.contratService.syncContrats(token);
      this.logger.log(
        `✅ Sync contrats: ${result.created} créés, ${result.updated} mis à jour, ${result.skipped} ignorés`,
      );
    } catch (error: any) {
      this.logger.error(
        `❌ Sync contrats échouée: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Obtient un token d'accès via Keycloak client_credentials grant.
   * Utilisé pour l'authentification service-to-service (pas de contexte utilisateur).
   */
  private async getServiceToken(): Promise<string> {
    const params = new URLSearchParams();
    params.append('client_id', this.keycloakClientId!);
    params.append('client_secret', this.keycloakClientSecret!);
    params.append('grant_type', 'client_credentials');

    const response = await axios.post(
      `${this.keycloakBaseUrl}/realms/${this.keycloakRealm}/protocol/openid-connect/token`,
      params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    return response.data.access_token;
  }

  // ============================================================================
  // RANKING — Recalculer tous les classements
  // ============================================================================

  private async computeAllRankings() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');

    const periodDay = `${y}-${m}-${d}`;
    const periodWeek = `${y}-W${this.getISOWeek(now)}`;
    const periodMonth = `${y}-${m}`;
    const periodQuarter = `${y}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;
    const periodYear = `${y}`;

    const periods: Array<{ period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'; key: string }> = [
      { period: 'DAILY', key: periodDay },
      { period: 'WEEKLY', key: periodWeek },
      { period: 'MONTHLY', key: periodMonth },
      { period: 'QUARTERLY', key: periodQuarter },
      { period: 'YEARLY', key: periodYear },
    ];

    for (const { period, key } of periods) {
      const result = await this.rankingService.computeRanking(period, key);
      this.logger.log(`✅ Classement ${period}/${key}: ${result.computed} commerciaux`);
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private getISOWeek(date: Date): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return String(weekNo).padStart(2, '0');
  }

  private getPreviousQuarter(date: Date): string {
    const month = date.getMonth(); // 0-indexed
    const year = date.getFullYear();

    // Trimestre précédent
    if (month < 3) return `${year - 1}-Q4`;
    if (month < 6) return `${year}-Q1`;
    if (month < 9) return `${year}-Q2`;
    return `${year}-Q3`;
  }

  private getPreviousMonth(date: Date): string {
    const prev = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  }
}
