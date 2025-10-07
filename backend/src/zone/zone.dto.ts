import { ObjectType, Field, Int, InputType, Float } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

@ObjectType()
export class Zone {
  @Field(() => Int)
  id: number;

  @Field()
  nom: string;

  @Field(() => Float)
  xOrigin: number;

  @Field(() => Float)
  yOrigin: number;

  @Field(() => Float)
  rayon: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class CreateZoneInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  nom: string;

  @Field(() => Float)
  @IsNumber()
  xOrigin: number;

  @Field(() => Float)
  @IsNumber()
  yOrigin: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  rayon: number;
}

@InputType()
export class UpdateZoneInput {
  @Field(() => Int)
  id: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  nom?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  xOrigin?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  yOrigin?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rayon?: number;
}
