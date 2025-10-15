import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { PorteService } from './porte.service';
import { Porte, CreatePorteInput, UpdatePorteInput } from './porte.dto';

@Resolver(() => Porte)
export class PorteResolver {
  constructor(private readonly porteService: PorteService) {}

  @Mutation(() => Porte)
  createPorte(@Args('createPorteInput') createPorteInput: CreatePorteInput) {
    return this.porteService.create(createPorteInput);
  }

  @Query(() => [Porte], { name: 'portes' })
  findAll() {
    return this.porteService.findAll();
  }

  @Query(() => Porte, { name: 'porte' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.porteService.findOne(id);
  }

  @Query(() => [Porte], { name: 'portesByImmeuble' })
  findByImmeuble(@Args('immeubleId', { type: () => Int }) immeubleId: number) {
    return this.porteService.findByImmeuble(immeubleId);
  }

  @Mutation(() => Porte)
  updatePorte(@Args('updatePorteInput') updatePorteInput: UpdatePorteInput) {
    return this.porteService.update(updatePorteInput);
  }

  @Mutation(() => Porte)
  removePorte(@Args('id', { type: () => Int }) id: number) {
    return this.porteService.remove(id);
  }

  @Mutation(() => Boolean)
  async createPortesForImmeuble(
    @Args('immeubleId', { type: () => Int }) immeubleId: number,
    @Args('nbEtages', { type: () => Int }) nbEtages: number,
    @Args('nbPortesParEtage', { type: () => Int }) nbPortesParEtage: number,
  ) {
    await this.porteService.createPortesForImmeuble(immeubleId, nbEtages, nbPortesParEtage);
    return true;
  }
}