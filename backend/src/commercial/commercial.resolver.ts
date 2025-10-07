import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { CommercialService } from './commercial.service';
import {
  Commercial,
  CreateCommercialInput,
  UpdateCommercialInput,
} from './commercial.dto';
import { Zone } from '../zone/zone.dto';
import { Immeuble } from '../immeuble/immeuble.dto';
import { Statistic } from '../statistic/statistic.dto';

// Types pour les relations Prisma
interface CommercialWithRelations {
  id: number;
  zones?: Array<{ zone: Zone }>;
  immeubles?: Immeuble[];
  statistics?: Statistic[];
}

@Resolver(() => Commercial)
export class CommercialResolver {
  constructor(private readonly commercialService: CommercialService) {}

  @Mutation(() => Commercial)
  createCommercial(
    @Args('createCommercialInput') createCommercialInput: CreateCommercialInput,
  ) {
    return this.commercialService.create(createCommercialInput);
  }

  @Query(() => [Commercial], { name: 'commercials' })
  findAll() {
    return this.commercialService.findAll();
  }

  @Query(() => Commercial, { name: 'commercial' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.commercialService.findOne(id);
  }

  @Mutation(() => Commercial)
  updateCommercial(
    @Args('updateCommercialInput') updateCommercialInput: UpdateCommercialInput,
  ) {
    return this.commercialService.update(updateCommercialInput);
  }

  @Mutation(() => Commercial)
  removeCommercial(@Args('id', { type: () => Int }) id: number) {
    return this.commercialService.remove(id);
  }

  @ResolveField(() => [Zone])
  zones(@Parent() commercial: CommercialWithRelations): Zone[] {
    // Mapper les relations CommercialZone vers Zone
    return commercial.zones?.map((cz) => cz.zone) || [];
  }

  @ResolveField(() => [Immeuble])
  immeubles(@Parent() commercial: CommercialWithRelations): Immeuble[] {
    return commercial.immeubles || [];
  }

  @ResolveField(() => [Statistic])
  statistics(@Parent() commercial: CommercialWithRelations): Statistic[] {
    return commercial.statistics || [];
  }
}
