import { ObjectType, Field, Int, InputType, PartialType } from '@nestjs/graphql';

@ObjectType()
export class Statistic {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  commercialId: number;

  @Field(() => Int)
  portesVisitees: number;

  @Field(() => Int)
  contratsSignes: number;

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
  portesVisitees: number;

  @Field(() => Int)
  contratsSignes: number;
}

@InputType()
export class UpdateStatisticInput extends PartialType(CreateStatisticInput) {
  @Field(() => Int)
  id: number;
}