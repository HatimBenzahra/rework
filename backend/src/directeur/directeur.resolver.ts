import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { DirecteurService } from './directeur.service';
import { Directeur, CreateDirecteurInput, UpdateDirecteurInput } from './directeur.dto';

@Resolver(() => Directeur)
export class DirecteurResolver {
  constructor(private readonly directeurService: DirecteurService) {}

  @Mutation(() => Directeur)
  createDirecteur(@Args('createDirecteurInput') createDirecteurInput: CreateDirecteurInput) {
    return this.directeurService.create(createDirecteurInput);
  }

  @Query(() => [Directeur], { name: 'directeurs' })
  findAll() {
    return this.directeurService.findAll();
  }

  @Query(() => Directeur, { name: 'directeur' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.directeurService.findOne(id);
  }

  @Mutation(() => Directeur)
  updateDirecteur(@Args('updateDirecteurInput') updateDirecteurInput: UpdateDirecteurInput) {
    return this.directeurService.update(updateDirecteurInput);
  }

  @Mutation(() => Directeur)
  removeDirecteur(@Args('id', { type: () => Int }) id: number) {
    return this.directeurService.remove(id);
  }
}