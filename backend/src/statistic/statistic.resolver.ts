import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { StatisticService } from './statistic.service';
import {
  Statistic,
  CreateStatisticInput,
  UpdateStatisticInput,
} from './statistic.dto';

@Resolver(() => Statistic)
export class StatisticResolver {
  constructor(private readonly statisticService: StatisticService) {}

  @Mutation(() => Statistic)
  createStatistic(
    @Args('createStatisticInput') createStatisticInput: CreateStatisticInput,
  ) {
    return this.statisticService.create(createStatisticInput);
  }

  @Query(() => [Statistic], { name: 'statistics' })
  findAll(@Args('commercialId', { type: () => Int, nullable: true }) commercialId?: number) {
    return this.statisticService.findAll(commercialId);
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
}
