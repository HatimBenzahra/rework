import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CommercialService } from './commercial.service';
import {
  Commercial,
  CreateCommercialInput,
  UpdateCommercialInput,
} from './commercial.dto';
import { Zone } from '../zone/zone.dto';
import { Immeuble } from '../immeuble/immeuble.dto';
import { Statistic } from '../statistic/statistic.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// Types pour les relations Prisma
interface CommercialWithRelations {
  id: number;
  zones?: Array<{ zone: Zone }>;
  immeubles?: Immeuble[];
  statistics?: Statistic[];
}

@Resolver(() => Commercial)
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommercialResolver {
  constructor(private readonly commercialService: CommercialService) {}

  @Mutation(() => Commercial)
  @Roles('admin', 'directeur')
  createCommercial(
    @Args('createCommercialInput') createCommercialInput: CreateCommercialInput,
  ) {
    return this.commercialService.create(createCommercialInput);
  }

  @Query(() => [Commercial], { name: 'commercials' })
  @Roles('admin', 'directeur', 'manager', 'commercial')
  findAll(@CurrentUser() user: any) {
    
    return this.commercialService.findAll(user.id, user.role);
  }

  @Query(() => Commercial, { name: 'commercial' })
  @Roles('admin', 'directeur', 'manager', 'commercial')
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.commercialService.findOne(id);
  }

  @Mutation(() => Commercial)
  @Roles('admin', 'directeur')
  updateCommercial(
    @Args('updateCommercialInput') updateCommercialInput: UpdateCommercialInput,
  ) {
    return this.commercialService.update(updateCommercialInput);
  }

  @Mutation(() => Commercial)
  @Roles('admin', 'directeur')
  removeCommercial(@Args('id', { type: () => Int }) id: number) {
    return this.commercialService.remove(id);
  }

  @ResolveField(() => [Zone])
  async zones(@Parent() commercial: CommercialWithRelations): Promise<Zone[]> {
    // Récupérer la zone actuelle du commercial via ZoneEnCours
    const zoneEnCours = await this.commercialService.getCurrentZone(
      commercial.id,
    );
    return zoneEnCours ? [zoneEnCours] : [];
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
