import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PorteService } from './porte.service';
import { Porte, CreatePorteInput, UpdatePorteInput } from './porte.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Resolver(() => Porte)
@UseGuards(JwtAuthGuard, RolesGuard)
export class PorteResolver {
  constructor(private readonly porteService: PorteService) {}

  @Mutation(() => Porte)
  @Roles('admin', 'directeur', 'manager', 'commercial')
  createPorte(@Args('createPorteInput') createPorteInput: CreatePorteInput) {
    return this.porteService.create(createPorteInput);
  }

  @Query(() => [Porte], { name: 'portes' })
  @Roles('admin', 'directeur', 'manager', 'commercial')
  findAll() {
    return this.porteService.findAll();
  }

  @Query(() => Porte, { name: 'porte' })
  @Roles('admin', 'directeur', 'manager', 'commercial')
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.porteService.findOne(id);
  }

  @Query(() => [Porte], { name: 'portesByImmeuble' })
  @Roles('admin', 'directeur', 'manager', 'commercial')
  findByImmeuble(@Args('immeubleId', { type: () => Int }) immeubleId: number) {
    return this.porteService.findByImmeuble(immeubleId);
  }

  @Mutation(() => Porte)
  @Roles('admin', 'directeur', 'manager', 'commercial')
  updatePorte(@Args('updatePorteInput') updatePorteInput: UpdatePorteInput) {
    return this.porteService.update(updatePorteInput);
  }

  @Mutation(() => Porte)
  @Roles('admin', 'directeur')
  removePorte(@Args('id', { type: () => Int }) id: number) {
    return this.porteService.remove(id);
  }

  @Mutation(() => Boolean)
  @Roles('admin', 'directeur', 'manager', 'commercial')
  async createPortesForImmeuble(
    @Args('immeubleId', { type: () => Int }) immeubleId: number,
    @Args('nbEtages', { type: () => Int }) nbEtages: number,
    @Args('nbPortesParEtage', { type: () => Int }) nbPortesParEtage: number,
  ) {
    await this.porteService.createPortesForImmeuble(
      immeubleId,
      nbEtages,
      nbPortesParEtage,
    );
    return true;
  }
  /* affichage du tableau de bord */
  @Query(() => [Porte], { name: 'portesModifiedToday' })
  @Roles('admin', 'directeur', 'manager', 'commercial')
  findModifiedToday(
    @Args('immeubleId', { type: () => Int, nullable: true })
    immeubleId?: number,
  ) {
    return this.porteService.findModifiedToday(immeubleId);
  }

  @Query(() => [Porte], { name: 'portesRdvToday' })
  @Roles('admin', 'directeur', 'manager', 'commercial')
  findRdvToday() {
    return this.porteService.findRdvToday();
  }
}
