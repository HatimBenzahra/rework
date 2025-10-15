import { Module } from '@nestjs/common';
import { PorteService } from './porte.service';
import { PorteResolver } from './porte.resolver';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [PorteResolver, PorteService, PrismaService],
  exports: [PorteService],
})
export class PorteModule {}