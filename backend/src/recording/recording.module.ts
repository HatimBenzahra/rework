import { Module } from '@nestjs/common';
import { RecordingService } from './recording.service';
import { RecordingResolver } from './recording.resolver';

@Module({
  providers: [RecordingService, RecordingResolver],
  exports: [RecordingService],
})
export class RecordingModule {}
