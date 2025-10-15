import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateStatisticInput, UpdateStatisticInput } from './statistic.dto';

@Injectable()
export class StatisticService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateStatisticInput) {
    return this.prisma.statistic.create({
      data,
      include: {
        commercial: true,
      },
    });
  }

  async findAll(commercialId?: number) {
    return this.prisma.statistic.findMany({
      where: commercialId ? { commercialId } : undefined,
      include: {
        commercial: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.statistic.findUnique({
      where: { id },
      include: {
        commercial: true,
      },
    });
  }

  async update(data: UpdateStatisticInput) {
    const { id, ...updateData } = data;
    return this.prisma.statistic.update({
      where: { id },
      data: updateData,
      include: {
        commercial: true,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.statistic.delete({
      where: { id },
      include: {
        commercial: true,
      },
    });
  }
}
