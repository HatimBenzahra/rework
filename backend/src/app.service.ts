import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World! NestJS + Prisma + PostgreSQL is ready!';
  }

  async getUsers() {
    return this.prisma.user.findMany();
  }

  async createUser(data: { email: string; name?: string }) {
    return this.prisma.user.create({
      data,
    });
  }
}
