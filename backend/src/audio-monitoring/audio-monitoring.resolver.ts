import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AudioMonitoringService } from './audio-monitoring.service';
import {
  MonitoringSession,
  LiveKitConnectionDetails,
  StartMonitoringInput,
  StopMonitoringInput,
  ActiveRoom,
} from './audio-monitoring.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AudioMonitoringResolver {
  constructor(private audioMonitoringService: AudioMonitoringService) {}

  @Mutation(() => LiveKitConnectionDetails)
  @Roles('admin', 'directeur', 'manager')
  async startMonitoring(@Args('input') input: StartMonitoringInput) {
    return this.audioMonitoringService.startMonitoring(input);
  }

  @Mutation(() => Boolean)
  @Roles('admin', 'directeur', 'manager')
  async stopMonitoring(@Args('input') input: StopMonitoringInput) {
    return this.audioMonitoringService.stopMonitoring(input.sessionId);
  }

  @Query(() => [MonitoringSession])
  @Roles('admin', 'directeur', 'manager')
  async getActiveSessions() {
    return this.audioMonitoringService.getActiveSessions();
  }

  @Query(() => [ActiveRoom])
  @Roles('admin', 'directeur', 'manager')
  async getActiveRooms() {
    return this.audioMonitoringService.getActiveRooms();
  }

  @Mutation(() => LiveKitConnectionDetails)
  @Roles('commercial')
  async generateCommercialToken(
    @Args('commercialId', { type: () => Int }) commercialId: number,
    @Args('roomName', { nullable: true }) roomName?: string,
  ) {
    return this.audioMonitoringService.generateCommercialToken(
      commercialId,
      roomName,
    );
  }

  @Mutation(() => LiveKitConnectionDetails)
  @Roles('manager')
  async generateManagerToken(
    @Args('managerId', { type: () => Int }) managerId: number,
    @Args('roomName', { nullable: true }) roomName?: string,
  ) {
    return this.audioMonitoringService.generateManagerToken(
      managerId,
      roomName,
    );
  }
}
