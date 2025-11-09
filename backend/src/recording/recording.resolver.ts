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
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecordingResolver {
  constructor(private readonly svc: RecordingService) {}

  @Mutation(() => RecordingResult)
  @Roles('admin', 'directeur', 'manager')
  async startRecording(
    @Args('input') input: StartRecordingInput,
    @CurrentUser() user: any,
  ): Promise<RecordingResult> {
    return this.svc.startRecording(input, user);
  }

  @Mutation(() => Boolean)
  @Roles('admin', 'directeur', 'manager')
  async stopRecording(
    @Args('input') input: StopRecordingInput,
    @CurrentUser() user: any,
  ): Promise<boolean> {
    return this.svc.stopRecording(input.egressId, user);
  }

  @Query(() => [RecordingItem])
  @Roles('admin', 'directeur', 'manager')
  async listRecordings(
    @Args('roomName') roomName: string,
    @CurrentUser() user: any,
  ): Promise<RecordingItem[]> {
    return this.svc.listRecordings(roomName, user);
  }

  @Query(() => EgressState)
  @Roles('admin', 'directeur', 'manager')
  async egressState(
    @Args('egressId') egressId: string,
    @CurrentUser() user: any,
  ): Promise<EgressState> {
    return this.svc.egressState(egressId, user);
  }

  @Query(() => String)
  @Roles('admin', 'directeur')
  async getStreamingUrl(
    @Args('key') key: string,
    @CurrentUser() user: any,
  ): Promise<string> {
    return this.svc.getStreamingUrl(key, user);
  }
}
