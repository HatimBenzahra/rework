import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateZoneInput, UpdateZoneInput } from './zone.dto';

@Injectable()
export class ZoneService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateZoneInput) {
    return this.prisma.zone.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.zone.findMany({
      include: {
        commercials: {
          include: {
            commercial: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.zone.findUnique({
      where: { id },
      include: {
        commercials: {
          include: {
            commercial: true,
          },
        },
      },
    });
  }

  async assignToCommercial(zoneId: number, commercialId: number) {
    return this.prisma.commercialZone.create({
      data: {
        zoneId,
        commercialId,
      },
      include: {
        zone: true,
        commercial: true,
      },
    });
  }

  async unassignFromCommercial(zoneId: number, commercialId: number) {
    return this.prisma.commercialZone.delete({
      where: {
        commercialId_zoneId: {
          commercialId,
          zoneId,
        },
      },
    });
  }

  async update(data: UpdateZoneInput) {
    const { id, ...updateData } = data;
    return this.prisma.zone.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number) {
    return this.prisma.zone.delete({
      where: { id },
    });
  }
}
