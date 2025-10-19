import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { DirecteurService } from './directeur.service';
import {
  Directeur,
  CreateDirecteurInput,
  UpdateDirecteurInput,
} from './directeur.dto';

@Resolver(() => Directeur)
export class DirecteurResolver {
  constructor(private readonly directeurService: DirecteurService) {}

  @Mutation(() => Directeur)
  createDirecteur(
    @Args('createDirecteurInput') createDirecteurInput: CreateDirecteurInput,
  ) {
    return this.directeurService.create(createDirecteurInput);
  }

  @Query(() => [Directeur], { name: 'directeurs' })
  findAll(
    @Args('userId', { type: () => Int, nullable: true }) userId?: number,
    @Args('userRole', { type: () => String, nullable: true }) userRole?: string,
  ) {
    return this.directeurService.findAll(userId, userRole);
  }

  @Query(() => Directeur, { name: 'directeur' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.directeurService.findOne(id);
  }

  @Mutation(() => Directeur)
  updateDirecteur(
    @Args('updateDirecteurInput') updateDirecteurInput: UpdateDirecteurInput,
  ) {
    return this.directeurService.update(updateDirecteurInput);
  }

  @Mutation(() => Directeur)
  removeDirecteur(@Args('id', { type: () => Int }) id: number) {
    return this.directeurService.remove(id);
  }
}
