import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ImmeubleService } from './immeuble.service';
import {
  Immeuble,
  CreateImmeubleInput,
  UpdateImmeubleInput,
} from './immeuble.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Resolver(() => Immeuble)
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImmeubleResolver {
  constructor(private readonly immeubleService: ImmeubleService) {}

  @Mutation(() => Immeuble)
  @Roles('admin', 'directeur', 'manager', 'commercial')
  createImmeuble(
    @Args('createImmeubleInput') createImmeubleInput: CreateImmeubleInput,
  ) {
    return this.immeubleService.create(createImmeubleInput);
  }

  @Query(() => [Immeuble], { name: 'immeubles' })
  @Roles('admin', 'directeur', 'manager', 'commercial')
  findAll(
    @Args('userId', { type: () => Int, nullable: true }) userId?: number,
    @Args('userRole', { type: () => String, nullable: true }) userRole?: string,
  ) {
    return this.immeubleService.findAll(userId, userRole);
  }

  @Query(() => Immeuble, { name: 'immeuble' })
  @Roles('admin', 'directeur', 'manager', 'commercial')
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.immeubleService.findOne(id);
  }

  @Mutation(() => Immeuble)
  @Roles('admin', 'directeur', 'manager', 'commercial')
  updateImmeuble(
    @Args('updateImmeubleInput') updateImmeubleInput: UpdateImmeubleInput,
  ) {
    return this.immeubleService.update(updateImmeubleInput);
  }

  @Mutation(() => Immeuble)
  @Roles('admin', 'directeur')
  removeImmeuble(@Args('id', { type: () => Int }) id: number) {
    return this.immeubleService.remove(id);
  }


  @Mutation(() => Immeuble)
  @Roles('admin', 'directeur', 'manager', 'commercial')
  addPorteToEtage(
    @Args('immeubleId', { type: () => Int }) immeubleId: number,
    @Args('etage', { type: () => Int }) etage: number
  ) {
    return this.immeubleService.addPorteToEtage(immeubleId, etage);
  }

  @Mutation(() => Immeuble)
  @Roles('admin', 'directeur', 'manager', 'commercial')
  removePorteFromEtage(
    @Args('immeubleId', { type: () => Int }) immeubleId: number,
    @Args('etage', { type: () => Int }) etage: number
  ) {
    return this.immeubleService.removePorteFromEtage(immeubleId, etage);
  }

  @Mutation(() => Immeuble)
  @Roles('admin', 'directeur', 'manager', 'commercial')
  addEtageToImmeuble(@Args('id', { type: () => Int }) id: number) {
    return this.immeubleService.addEtage(id);
  }

  @Mutation(() => Immeuble)
  @Roles('admin', 'directeur', 'manager', 'commercial')
  removeEtageFromImmeuble(@Args('id', { type: () => Int }) id: number) {
    return this.immeubleService.removeEtage(id);
  }
}
