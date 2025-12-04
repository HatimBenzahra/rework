import { Module } from '@nestjs/common';
import { RecordingService } from './recording.service';
import { RecordingResolver } from './recording.resolver';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [RecordingService, RecordingResolver, PrismaService],
  exports: [RecordingService],
})
export class RecordingModule {}
