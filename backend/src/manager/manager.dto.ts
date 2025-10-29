import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsPhoneNumber,
} from 'class-validator';
import { Directeur } from '../directeur/directeur.dto';
import { Commercial } from '../commercial/commercial.dto';
import { Zone } from '../zone/zone.dto';
import { Immeuble } from '../immeuble/immeuble.dto';
import { Statistic } from '../statistic/statistic.dto';

@ObjectType()
export class Manager {
  @Field(() => Int)
  id: number;

  @Field()
  nom: string;

  @Field()
  prenom: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  numTelephone?: string;

  @Field(() => Int, { nullable: true })
  directeurId?: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => Directeur, { nullable: true })
  directeur?: Directeur | null;

  @Field(() => [Commercial], { nullable: true })
  commercials?: Commercial[];

  @Field(() => [Zone], { nullable: true })
  zones?: Zone[];

  @Field(() => [Immeuble], { nullable: true })
  immeubles?: Immeuble[];

  @Field(() => [Statistic], { nullable: true })
  statistics?: Statistic[];
}

@InputType()
export class CreateManagerInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  nom: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  prenom: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  numTelephone?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  directeurId?: number;
}

@InputType()
export class UpdateManagerInput {
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
  @IsString()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsPhoneNumber('TN')
  numTelephone?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  directeurId?: number;
}
