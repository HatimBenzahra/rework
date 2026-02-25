import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateOffrePointsInput, UpdateOffreBadgeProductKeyInput } from './gamification.dto';
import { WinleadPlusApiService } from './winleadplus-api.service';

@Injectable()
export class OffreService {
  private readonly logger = new Logger(OffreService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly winleadPlusApi: WinleadPlusApiService,
  ) {}

  // ============================================================================
  // SYNCHRO — Upsert offres depuis WinLead+ (ne touche jamais aux points)
  // ============================================================================

  async syncOffres(
    token: string,
  ): Promise<{ created: number; updated: number; total: number }> {
    const items = await this.winleadPlusApi.getOffres(token);

    let created = 0;
    let updated = 0;

    for (const item of items) {
      if (!item.id || !item.nom || !item.categorie || !item.fournisseur) {
        this.logger.warn(`Offre ignorée (champs manquants): ${JSON.stringify(item).slice(0, 100)}`);
        continue;
      }

      const existing = await this.prisma.offre.findUnique({
        where: { externalId: item.id },
        select: { id: true },
      });

      const syncData = {
        nom: (item.nom || '').trim(),
        description: item.description ?? null,
        categorie: (item.categorie || '').trim(),
        fournisseur: (item.fournisseur || '').trim(),
        logoUrl: item.logo_url ?? null,
        prixBase: item.prix_base ?? null,
        features: item.features ?? null,
        popular: item.popular ?? false,
        rating: item.rating ?? null,
        isActive: item.isActive ?? true,
        syncedAt: new Date(),
      };

      await this.prisma.offre.upsert({
        where: { externalId: item.id },
        create: {
          externalId: item.id,
          ...syncData,
          points: 0, // L'admin configurera les points
        },
        update: syncData, // points: PAS touché — c'est l'admin qui les gère
      });

      if (existing) {
        updated++;
      } else {
        created++;
      }
    }

    this.logger.log(
      `Synchro offres terminée: ${created} créées, ${updated} mises à jour (${items.length} total API)`,
    );

    return { created, updated, total: items.length };
  }

  // ============================================================================
  // CRUD — Lecture et modification des points
  // ============================================================================

  async getOffres(activeOnly: boolean) {
    return this.prisma.offre.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ categorie: 'asc' }, { nom: 'asc' }],
    });
  }

  async updateOffrePoints(offreId: number, points: number) {
    return this.prisma.offre.update({
      where: { id: offreId },
      data: { points },
    });
  }

  async batchUpdateOffrePoints(offres: UpdateOffrePointsInput[]) {
    let updated = 0;
    for (const entry of offres) {
      try {
        await this.prisma.offre.update({
          where: { id: entry.offreId },
          data: { points: entry.points },
        });
        updated++;
      } catch (error: any) {
        this.logger.warn(
          `Points update échoué pour offre #${entry.offreId}: ${error.message}`,
        );
      }
    }
    return { updated, total: offres.length };
  }

  // ============================================================================
  // BADGE PRODUCT KEY — Mapping offre → catégorie de badge
  // ============================================================================

  async updateOffreBadgeProductKey(offreId: number, badgeProductKey: string | null) {
    return this.prisma.offre.update({
      where: { id: offreId },
      data: { badgeProductKey },
    });
  }

  async batchUpdateOffreBadgeProductKey(offres: UpdateOffreBadgeProductKeyInput[]) {
    let updated = 0;
    for (const entry of offres) {
      try {
        await this.prisma.offre.update({
          where: { id: entry.offreId },
          data: { badgeProductKey: entry.badgeProductKey ?? null },
        });
        updated++;
      } catch (error: any) {
        this.logger.warn(
          `BadgeProductKey update échoué pour offre #${entry.offreId}: ${error.message}`,
        );
      }
    }
    return { updated, total: offres.length };
  }
}
