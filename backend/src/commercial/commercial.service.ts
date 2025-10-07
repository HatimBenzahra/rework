import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCommercialInput, UpdateCommercialInput } from './commercial.dto';

@Injectable()
export class CommercialService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCommercialInput) {
    return this.prisma.commercial.create({
      data,
      include: {
        manager: true,
        directeur: true,
      },
    });
  }

  async findAll() {
    return this.prisma.commercial.findMany({
      include: {
        manager: true,
        directeur: true,
        immeubles: true,
        zones: {
          include: {
            zone: true,
          },
        },
        statistics: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.commercial.findUnique({
      where: { id },
      include: {
        manager: true,
        directeur: true,
        immeubles: true,
        zones: {
          include: {
            zone: true,
          },
        },
        statistics: true,
      },
    });
  }

  async update(data: UpdateCommercialInput) {
    const { id, ...updateData } = data;
    return this.prisma.commercial.update({
      where: { id },
      data: updateData,
      include: {
        manager: true,
        directeur: true,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.commercial.delete({
      where: { id },
      include: {
        manager: true,
        directeur: true,
      },
    });
  }
}
