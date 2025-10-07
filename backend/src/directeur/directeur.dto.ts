import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

@ObjectType()
export class Directeur {
  @Field(() => Int)
  id: number;

  @Field()
  nom: string;

  @Field()
  prenom: string;

  @Field()
  adresse: string;

  @Field()
  email: string;

  @Field()
  numTelephone: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

}

@InputType()
export class CreateDirecteurInput {
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
  @IsString()
  adresse: string;

  @Field()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  numTelephone: string;
}

@InputType()
export class UpdateDirecteurInput {
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
  adresse?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  numTelephone?: string;
}