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
        immeubles: true,
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
        immeubles: true,
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
    // Use a transaction to ensure all deletions succeed or fail together
    return this.prisma.$transaction(async (prisma) => {
      // First, delete all CommercialZone associations
      await prisma.commercialZone.deleteMany({
        where: { zoneId: id },
      });

      // Delete all statistics related to this zone
      await prisma.statistic.deleteMany({
        where: { zoneId: id },
      });

      // Finally, delete the zone itself
      return prisma.zone.delete({
        where: { id },
      });
    });
  }
}
