import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { StatisticService } from './statistic.service';
import { StatisticSyncService } from './statistic-sync.service';
import {
  Statistic,
  CreateStatisticInput,
  UpdateStatisticInput,
  ZoneStatistic,
} from './statistic.dto';

@Resolver(() => Statistic)
export class StatisticResolver {
  constructor(
    private readonly statisticService: StatisticService,
    private readonly statisticSyncService: StatisticSyncService
  ) {}

  @Mutation(() => Statistic)
  createStatistic(
    @Args('createStatisticInput') createStatisticInput: CreateStatisticInput,
  ) {
    return this.statisticService.create(createStatisticInput);
  }

  @Query(() => [Statistic], { name: 'statistics' })
  findAll(
    @Args('commercialId', { type: () => Int, nullable: true })
    commercialId?: number,
    @Args('userId', { type: () => Int, nullable: true }) userId?: number,
    @Args('userRole', { type: () => String, nullable: true }) userRole?: string,
  ) {
    return this.statisticService.findAll(commercialId, userId, userRole);
  }

  @Query(() => Statistic, { name: 'statistic' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.statisticService.findOne(id);
  }

  @Mutation(() => Statistic)
  updateStatistic(
    @Args('updateStatisticInput') updateStatisticInput: UpdateStatisticInput,
  ) {
    return this.statisticService.update(updateStatisticInput);
  }

  @Mutation(() => Statistic)
  removeStatistic(@Args('id', { type: () => Int }) id: number) {
    return this.statisticService.remove(id);
  }

  @Query(() => [ZoneStatistic], { name: 'zoneStatistics' })
  getZoneStatistics(
    @Args('userId', { type: () => Int, nullable: true }) userId?: number,
    @Args('userRole', { type: () => String, nullable: true }) userRole?: string,
  ) {
    return this.statisticService.getZoneStatistics(userId, userRole);
  }

  // 🔧 NOUVEAUX ENDPOINTS DE MAINTENANCE
  
  @Mutation(() => String, { name: 'recalculateAllStats' })
  async recalculateAllStats() {
    const result = await this.statisticSyncService.recalculateAllStats();
    return `Recalcul terminé: ${result.updated} mis à jour, ${result.errors} erreurs`;
  }

  @Query(() => String, { name: 'validateStatsCoherence' })
  async validateStatsCoherence() {
    const result = await this.statisticSyncService.validateStatsCoherence();
    if (result.invalid.length === 0) {
      return `✅ Toutes les ${result.valid} statistiques sont cohérentes`;
    } else {
      return `⚠️ ${result.valid} cohérentes, ${result.invalid.length} incohérentes: ${JSON.stringify(result.invalid)}`;
    }
  }

  @Mutation(() => String, { name: 'syncCommercialStats' })
  async syncCommercialStats(
    @Args('immeubleId', { type: () => Int }) immeubleId: number
  ) {
    await this.statisticSyncService.syncCommercialStats(immeubleId);
    return `✅ Statistiques synchronisées pour l'immeuble ${immeubleId}`;
  }
}
