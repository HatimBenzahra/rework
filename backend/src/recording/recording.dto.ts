import { Field, ObjectType, InputType } from '@nestjs/graphql';

@ObjectType()
export class RecordingResult {
  @Field() egressId: string;
  @Field() roomName: string;
  @Field() status: string;
  @Field() s3Key: string;
  @Field({ nullable: true }) url?: string;
}

@ObjectType()
export class RecordingItem {
  @Field() key: string;
  @Field({ nullable: true }) url?: string;
  @Field({ nullable: true }) size?: number;
  @Field({ nullable: true }) lastModified?: Date;
}

@ObjectType()
export class EgressState {
  @Field() egressId: string;
  @Field() status: string;
  @Field({ nullable: true }) roomName?: string;
  @Field({ nullable: true }) error?: string;
}

@InputType()
export class StartRecordingInput {
  @Field() roomName: string;
  @Field({ nullable: true, defaultValue: true })
  audioOnly?: boolean;

  /**
   * Optionnel : si tu veux cibler UNIQUEMENT un participant
   * (ex: "commercial-10"), utilise startParticipantEgress.
   */
  @Field({ nullable: true })
  participantIdentity?: string;
}

@InputType()
export class StopRecordingInput {
  @Field() egressId: string;
}
