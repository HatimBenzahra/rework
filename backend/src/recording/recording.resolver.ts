import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import {
  RecordingResult,
  StartRecordingInput,
  StopRecordingInput,
  RecordingItem,
  EgressState,
} from './recording.dto';
import { RecordingService } from './recording.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecordingResolver {
  constructor(private readonly svc: RecordingService) {}

  @Mutation(() => RecordingResult)
  @Roles('admin', 'directeur', 'manager')
  async startRecording(
    @Args('input') input: StartRecordingInput,
  ): Promise<RecordingResult> {
    return this.svc.startRecording(input);
  }

  @Mutation(() => Boolean)
  @Roles('admin', 'directeur', 'manager')
  async stopRecording(
    @Args('input') input: StopRecordingInput,
  ): Promise<boolean> {
    return this.svc.stopRecording(input.egressId);
  }

  @Query(() => [RecordingItem])
  @Roles('admin', 'directeur', 'manager')
  async listRecordings(
    @Args('roomName') roomName: string,
  ): Promise<RecordingItem[]> {
    return this.svc.listRecordings(roomName);
  }

  @Query(() => EgressState)
  @Roles('admin', 'directeur', 'manager')
  async egressState(@Args('egressId') egressId: string): Promise<EgressState> {
    return this.svc.egressState(egressId);
  }

  @Query(() => String)
  @Roles('admin', 'directeur')
  async getStreamingUrl(@Args('key') key: string): Promise<string> {
    return this.svc.getStreamingUrl(key);
  }
}
