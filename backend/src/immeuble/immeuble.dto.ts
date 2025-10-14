import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';

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

  @Field()
  ascenseurPresent: boolean;

  @Field({ nullable: true })
  digitalCode?: string;

  @Field(() => Int, { nullable: true })
  commercialId?: number;

  @Field(() => Int, { nullable: true })
  zoneId?: number;

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

  @Field()
  @IsBoolean()
  ascenseurPresent: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  digitalCode?: string;

  @Field(() => Int)
  @IsInt()
  commercialId: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  zoneId?: number;
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

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  ascenseurPresent?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  digitalCode?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  commercialId?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  zoneId?: number;
}
