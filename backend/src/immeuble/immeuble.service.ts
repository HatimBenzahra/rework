import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateImmeubleInput, UpdateImmeubleInput } from './immeuble.dto';

@Injectable()
export class ImmeubleService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateImmeubleInput) {
    return this.prisma.immeuble.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.immeuble.findMany();
  }

  async findOne(id: number) {
    return this.prisma.immeuble.findUnique({
      where: { id },
    });
  }

  async update(data: UpdateImmeubleInput) {
    const { id, ...updateData } = data;
    return this.prisma.immeuble.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number) {
    return this.prisma.immeuble.delete({
      where: { id },
    });
  }
}