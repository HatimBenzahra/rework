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
// Import centralisé de l'enum et des helpers
import { StatutPorte } from './porte-status.constants';

// Re-export pour compatibilité avec les imports existants
export { StatutPorte } from './porte-status.constants';

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

@ObjectType()
export class EtageInStatistics {
  @Field(() => Int)
  etage: number;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class PorteStatistics {
  @Field(() => Int)
  totalPortes: number;

  @Field(() => Int)
  contratsSigne: number;

  @Field(() => Int)
  rdvPris: number;

  @Field(() => Int)
  absent: number;

  @Field(() => Int)
  argumente: number;

  @Field(() => Int)
  refus: number;

  @Field(() => Int)
  nonVisitees: number;

  @Field(() => Int)
  necessiteRepassage: number;

  @Field(() => Int)
  portesVisitees: number;

  @Field()
  tauxConversion: string;

  @Field(() => [EtageInStatistics])
  portesParEtage: EtageInStatistics[];
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
