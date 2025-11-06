import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Immeuble } from '../immeuble/immeuble.dto';
import { Zone } from '../zone/zone.dto';
import { Statistic } from '../statistic/statistic.dto';

@ObjectType()
export class Commercial {
  @Field(() => Int)
  id: number;

  @Field()
  nom: string;

  @Field()
  prenom: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  numTel?: string;

  @Field(() => Int, { nullable: true })
  age?: number;

  @Field(() => Int, { nullable: true })
  managerId?: number;

  @Field(() => Int, { nullable: true })
  directeurId?: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [Immeuble])
  immeubles: Immeuble[];

  @Field(() => [Zone])
  zones: Zone[];

  @Field(() => [Statistic])
  statistics: Statistic[];
}

@InputType()
export class CreateCommercialInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  nom: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  prenom: string;

  @Field()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  numTel: string;

  @Field(() => Int)
  @IsInt()
  @Min(16)
  @Max(70)
  age: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  managerId?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  directeurId?: number;
}

@InputType()
export class UpdateCommercialInput {
  @Field(() => Int)
  id: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  nom?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  prenom?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  numTel?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(16)
  @Max(70)
  age?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  managerId?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  directeurId?: number;
}
