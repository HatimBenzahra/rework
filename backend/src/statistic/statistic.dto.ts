import {
  ObjectType,
  Field,
  Int,
  InputType,
  PartialType,
} from '@nestjs/graphql';

@ObjectType()
export class Statistic {
  @Field(() => Int)
  id: number;

  @Field(() => Int, { nullable: true })
  commercialId?: number;

  @Field(() => Int, { nullable: true })
  immeubleId?: number;

  @Field(() => Int, { nullable: true })
  zoneId?: number;

  @Field(() => Int)
  contratsSignes: number;

  @Field(() => Int)
  immeublesVisites: number;

  @Field(() => Int)
  rendezVousPris: number;

  @Field(() => Int)
  refus: number;

  @Field(() => Int)
  nbImmeublesProspectes: number;

  @Field(() => Int)
  nbPortesProspectes: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class CreateStatisticInput {
  @Field(() => Int, { nullable: true })
  commercialId?: number;

  @Field(() => Int, { nullable: true })
  immeubleId?: number;

  @Field(() => Int, { nullable: true })
  zoneId?: number;

  @Field(() => Int)
  contratsSignes: number;

  @Field(() => Int)
  immeublesVisites: number;

  @Field(() => Int)
  rendezVousPris: number;

  @Field(() => Int)
  refus: number;

  @Field(() => Int)
  nbImmeublesProspectes: number;

  @Field(() => Int)
  nbPortesProspectes: number;
}

@InputType()
export class UpdateStatisticInput extends PartialType(CreateStatisticInput) {
  @Field(() => Int)
  id: number;
}
