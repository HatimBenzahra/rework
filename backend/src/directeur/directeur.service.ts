import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateDirecteurInput, UpdateDirecteurInput } from './directeur.dto';

@Injectable()
export class DirecteurService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateDirecteurInput) {
    return this.prisma.directeur.create({
      data,
      include: {
        managers: true,
        commercials: true,
      },
    });
  }

  async findAll(userId?: number, userRole?: string) {
    if (!userId || !userRole) {
      return this.prisma.directeur.findMany({
        include: {
          managers: true,
          commercials: true,
        },
      });
    }

    switch (userRole) {
      case 'admin':
        return this.prisma.directeur.findMany({
          include: {
            managers: true,
            commercials: true,
          },
        });

      case 'directeur':
        return this.prisma.directeur.findMany({
          where: {
            id: userId,
          },
          include: {
            managers: true,
            commercials: true,
          },
        });

      case 'manager':
        return this.prisma.directeur.findMany({
          where: {
            managers: {
              some: {
                id: userId,
              },
            },
          },
          include: {
            managers: true,
            commercials: true,
          },
        });

      default:
        return [];
    }
  }

  async findOne(id: number) {
    return this.prisma.directeur.findUnique({
      where: { id },
      include: {
        managers: true,
        commercials: true,
      },
    });
  }

  async update(data: UpdateDirecteurInput) {
    const { id, ...updateData } = data;
    return this.prisma.directeur.update({
      where: { id },
      data: updateData,
      include: {
        managers: true,
        commercials: true,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.directeur.delete({
      where: { id },
      include: {
        managers: true,
        commercials: true,
      },
    });
  }
}
