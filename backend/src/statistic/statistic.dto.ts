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

  @Field(() => Int)
  commercialId: number;

  @Field(() => Int)
  contratsSignes: number;

  @Field(() => Int)
  immeublesVisites: number;

  @Field(() => Int)
  rendezVousPris: number;

  @Field(() => Int)
  refus: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class CreateStatisticInput {
  @Field(() => Int)
  commercialId: number;

  @Field(() => Int)
  contratsSignes: number;

  @Field(() => Int)
  immeublesVisites: number;

  @Field(() => Int)
  rendezVousPris: number;

  @Field(() => Int)
  refus: number;
}

@InputType()
export class UpdateStatisticInput extends PartialType(CreateStatisticInput) {
  @Field(() => Int)
  id: number;
}
