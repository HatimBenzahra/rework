import { Module } from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { StatisticResolver } from './statistic.resolver';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [StatisticResolver, StatisticService, PrismaService],
})
export class StatisticModule {}