import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { AudioMonitoringService } from './audio-monitoring.service';
import {
  MonitoringSession,
  LiveKitConnectionDetails,
  StartMonitoringInput,
  StopMonitoringInput,
  ActiveRoom,
} from './audio-monitoring.dto';

@Resolver()
export class AudioMonitoringResolver {
  constructor(private audioMonitoringService: AudioMonitoringService) {}

  @Mutation(() => LiveKitConnectionDetails)
  async startMonitoring(@Args('input') input: StartMonitoringInput) {
    return this.audioMonitoringService.startMonitoring(input);
  }

  @Mutation(() => Boolean)
  async stopMonitoring(@Args('input') input: StopMonitoringInput) {
    return this.audioMonitoringService.stopMonitoring(input.sessionId);
  }

  @Query(() => [MonitoringSession])
  async getActiveSessions() {
    return this.audioMonitoringService.getActiveSessions();
  }

  @Query(() => [ActiveRoom])
  async getActiveRooms() {
    return this.audioMonitoringService.getActiveRooms();
  }

  @Mutation(() => LiveKitConnectionDetails)
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
