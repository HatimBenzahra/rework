import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';

@ObjectType()
export class Immeuble {
  @Field(() => Int)
  id: number;

  @Field()
  adresse: string;

  @Field(() => Int)
  nbEtages: number;

  @Field(() => Int)
  nbPortesParEtage: number;

  @Field(() => Int)
  commercialId: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class CreateImmeubleInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  adresse: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  nbEtages: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  nbPortesParEtage: number;

  @Field(() => Int)
  @IsInt()
  commercialId: number;
}

@InputType()
export class UpdateImmeubleInput {
  @Field(() => Int)
  id: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  adresse?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  nbEtages?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  nbPortesParEtage?: number;
}