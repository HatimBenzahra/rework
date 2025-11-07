import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { StatisticSyncService } from './statistic-sync.service';
import {
  Statistic,
  CreateStatisticInput,
  UpdateStatisticInput,
  ZoneStatistic,
} from './statistic.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Resolver(() => Statistic)
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatisticResolver {
  constructor(
    private readonly statisticService: StatisticService,
    private readonly statisticSyncService: StatisticSyncService,
  ) {}

  @Mutation(() => Statistic)
  @Roles('admin', 'directeur', 'manager', 'commercial')
  createStatistic(
    @Args('createStatisticInput') createStatisticInput: CreateStatisticInput,
  ) {
    return this.statisticService.create(createStatisticInput);
  }

  @Query(() => [Statistic], { name: 'statistics' })
  @Roles('admin', 'directeur', 'manager', 'commercial')
  findAll(
    @Args('commercialId', { type: () => Int, nullable: true })
    commercialId?: number,
    @Args('userId', { type: () => Int, nullable: true }) userId?: number,
    @Args('userRole', { type: () => String, nullable: true }) userRole?: string,
  ) {
    return this.statisticService.findAll(commercialId, userId, userRole);
  }

  @Query(() => Statistic, { name: 'statistic' })
  @Roles('admin', 'directeur', 'manager', 'commercial')
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.statisticService.findOne(id);
  }

  @Mutation(() => Statistic)
  @Roles('admin', 'directeur', 'manager', 'commercial')
  updateStatistic(
    @Args('updateStatisticInput') updateStatisticInput: UpdateStatisticInput,
  ) {
    return this.statisticService.update(updateStatisticInput);
  }

  @Mutation(() => Statistic)
  @Roles('admin', 'directeur')
  removeStatistic(@Args('id', { type: () => Int }) id: number) {
    return this.statisticService.remove(id);
  }

  @Query(() => [ZoneStatistic], { name: 'zoneStatistics' })
  @Roles('admin', 'directeur', 'manager', 'commercial')
  getZoneStatistics(
    @Args('userId', { type: () => Int, nullable: true }) userId?: number,
    @Args('userRole', { type: () => String, nullable: true }) userRole?: string,
  ) {
    return this.statisticService.getZoneStatistics(userId, userRole);
  }

  @Mutation(() => String, { name: 'recalculateAllStats' })
  @Roles('admin', 'directeur')
  async recalculateAllStats() {
    const result = await this.statisticSyncService.recalculateAllStats();
    return `Recalcul terminé: ${result.updated} mis à jour, ${result.errors} erreurs`;
  }

  @Query(() => String, { name: 'validateStatsCoherence' })
  @Roles('admin', 'directeur', 'manager')
  async validateStatsCoherence() {
    const result = await this.statisticSyncService.validateStatsCoherence();
    if (result.invalid.length === 0) {
      return `✅ Toutes les ${result.valid} statistiques sont cohérentes`;
    } else {
      return `⚠️ ${result.valid} cohérentes, ${result.invalid.length} incohérentes: ${JSON.stringify(result.invalid)}`;
    }
  }

  @Mutation(() => String, { name: 'syncCommercialStats' })
  @Roles('admin', 'directeur', 'manager')
  async syncCommercialStats(
    @Args('immeubleId', { type: () => Int }) immeubleId: number,
  ) {
    await this.statisticSyncService.syncCommercialStats(immeubleId);
    return `✅ Statistiques synchronisées pour l'immeuble ${immeubleId}`;
  }

  @Mutation(() => String, { name: 'syncManagerStats' })
  @Roles('admin', 'directeur', 'manager')
  async syncManagerStats(
    @Args('managerId', { type: () => Int }) managerId: number,
  ) {
    await this.statisticSyncService.syncManagerStats(managerId);
    return `✅ Statistiques synchronisées pour le manager ${managerId}`;
  }
}
