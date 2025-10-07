import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateManagerInput, UpdateManagerInput } from './manager.dto';

@Injectable()
export class ManagerService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateManagerInput) {
    return this.prisma.manager.create({
      data,
      include: {
        directeur: true,
        commercials: true,
      },
    });
  }

  async findAll() {
    return this.prisma.manager.findMany({
      include: {
        directeur: true,
        commercials: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.manager.findUnique({
      where: { id },
      include: {
        directeur: true,
        commercials: true,
      },
    });
  }

  async update(data: UpdateManagerInput) {
    const { id, ...updateData } = data;
    return this.prisma.manager.update({
      where: { id },
      data: updateData,
      include: {
        directeur: true,
        commercials: true,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.manager.delete({
      where: { id },
      include: {
        directeur: true,
        commercials: true,
      },
    });
  }
}
