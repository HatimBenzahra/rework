import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import {
  RecordingResult,
  StartRecordingInput,
  StopRecordingInput,
  RecordingItem,
  EgressState,
} from './recording.dto';
import { RecordingService } from './recording.service';

@Resolver()
export class RecordingResolver {
  constructor(private readonly svc: RecordingService) {}

  @Mutation(() => RecordingResult)
  async startRecording(
    @Args('input') input: StartRecordingInput,
  ): Promise<RecordingResult> {
    return this.svc.startRecording(input);
  }

  @Mutation(() => Boolean)
  async stopRecording(
    @Args('input') input: StopRecordingInput,
  ): Promise<boolean> {
    return this.svc.stopRecording(input.egressId);
  }

  @Query(() => [RecordingItem])
  async listRecordings(
    @Args('roomName') roomName: string,
  ): Promise<RecordingItem[]> {
    return this.svc.listRecordings(roomName);
  }


  @Query(() => EgressState)
  async egressState(@Args('egressId') egressId: string): Promise<EgressState> {
    return this.svc.egressState(egressId);
  }

  @Query(() => String)
  async getStreamingUrl(@Args('key') key: string): Promise<string> {
    return this.svc.getStreamingUrl(key);
  }
}
