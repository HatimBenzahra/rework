import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';

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
  @IsString()
  numTelephone?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  directeurId?: number;
}
