import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ImmeubleService } from './immeuble.service';
import {
  Immeuble,
  CreateImmeubleInput,
  UpdateImmeubleInput,
} from './immeuble.dto';

@Resolver(() => Immeuble)
export class ImmeubleResolver {
  constructor(private readonly immeubleService: ImmeubleService) {}

  @Mutation(() => Immeuble)
  createImmeuble(
    @Args('createImmeubleInput') createImmeubleInput: CreateImmeubleInput,
  ) {
    return this.immeubleService.create(createImmeubleInput);
  }

  @Query(() => [Immeuble], { name: 'immeubles' })
  findAll(
    @Args('userId', { type: () => Int, nullable: true }) userId?: number,
    @Args('userRole', { type: () => String, nullable: true }) userRole?: string,
  ) {
    return this.immeubleService.findAll(userId, userRole);
  }

  @Query(() => Immeuble, { name: 'immeuble' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.immeubleService.findOne(id);
  }

  @Mutation(() => Immeuble)
  updateImmeuble(
    @Args('updateImmeubleInput') updateImmeubleInput: UpdateImmeubleInput,
  ) {
    return this.immeubleService.update(updateImmeubleInput);
  }

  @Mutation(() => Immeuble)
  removeImmeuble(@Args('id', { type: () => Int }) id: number) {
    return this.immeubleService.remove(id);
  }


  @Mutation(() => Immeuble)
  addPorteToEtage(
    @Args('immeubleId', { type: () => Int }) immeubleId: number,
    @Args('etage', { type: () => Int }) etage: number
  ) {
    return this.immeubleService.addPorteToEtage(immeubleId, etage);
  }

  @Mutation(() => Immeuble)
  removePorteFromEtage(
    @Args('immeubleId', { type: () => Int }) immeubleId: number,
    @Args('etage', { type: () => Int }) etage: number
  ) {
    return this.immeubleService.removePorteFromEtage(immeubleId, etage);
  }

  @Mutation(() => Immeuble)
  addEtageToImmeuble(@Args('id', { type: () => Int }) id: number) {
    return this.immeubleService.addEtage(id);
  }

  @Mutation(() => Immeuble)
  removeEtageFromImmeuble(@Args('id', { type: () => Int }) id: number) {
    return this.immeubleService.removeEtage(id);
  }
}
