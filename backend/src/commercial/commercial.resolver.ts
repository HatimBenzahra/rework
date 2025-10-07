import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { CommercialService } from './commercial.service';
import { Commercial, CreateCommercialInput, UpdateCommercialInput } from './commercial.dto';

@Resolver(() => Commercial)
export class CommercialResolver {
  constructor(private readonly commercialService: CommercialService) {}

  @Mutation(() => Commercial)
  createCommercial(@Args('createCommercialInput') createCommercialInput: CreateCommercialInput) {
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
  updateCommercial(@Args('updateCommercialInput') updateCommercialInput: UpdateCommercialInput) {
    return this.commercialService.update(updateCommercialInput);
  }

  @Mutation(() => Commercial)
  removeCommercial(@Args('id', { type: () => Int }) id: number) {
    return this.commercialService.remove(id);
  }
}