import {
  ObjectType,
  Field,
  Int,
  InputType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsDateString,
} from 'class-validator';

export enum StatutPorte {
  NON_VISITE = 'NON_VISITE',
  CONTRAT_SIGNE = 'CONTRAT_SIGNE',
  REFUS = 'REFUS',
  RENDEZ_VOUS_PRIS = 'RENDEZ_VOUS_PRIS',
  CURIEUX = 'CURIEUX',
  NECESSITE_REPASSAGE = 'NECESSITE_REPASSAGE',
}

registerEnumType(StatutPorte, {
  name: 'StatutPorte',
  description: 'Statut possible pour une porte',
});

@ObjectType()
export class Porte {
  @Field(() => Int)
  id: number;

  @Field()
  numero: string;

  @Field({ nullable: true })
  nomPersonnalise?: string;

  @Field(() => Int)
  etage: number;

  @Field(() => Int)
  immeubleId: number;

  @Field(() => StatutPorte)
  statut: StatutPorte;

  @Field(() => Int)
  nbRepassages: number;

  @Field({ nullable: true })
  rdvDate?: Date;

  @Field({ nullable: true })
  rdvTime?: string;

  @Field({ nullable: true })
  commentaire?: string;

  @Field({ nullable: true })
  derniereVisite?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class CreatePorteInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  numero: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  nomPersonnalise?: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  etage: number;

  @Field(() => Int)
  @IsInt()
  immeubleId: number;

  @Field(() => StatutPorte, { defaultValue: StatutPorte.NON_VISITE })
  @IsOptional()
  @IsEnum(StatutPorte)
  statut?: StatutPorte;

  @Field(() => Int, { defaultValue: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  nbRepassages?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  rdvDate?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  rdvTime?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  commentaire?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  derniereVisite?: Date;
}

@InputType()
export class UpdatePorteInput {
  @Field(() => Int)
  id: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  numero?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  nomPersonnalise?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  etage?: number;

  @Field(() => StatutPorte, { nullable: true })
  @IsOptional()
  @IsEnum(StatutPorte)
  statut?: StatutPorte;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  nbRepassages?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  rdvDate?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  rdvTime?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  commentaire?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  derniereVisite?: Date;
}
