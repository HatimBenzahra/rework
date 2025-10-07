import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ManagerService } from './manager.service';
import { Manager, CreateManagerInput, UpdateManagerInput } from './manager.dto';

@Resolver(() => Manager)
export class ManagerResolver {
  constructor(private readonly managerService: ManagerService) {}

  @Mutation(() => Manager)
  createManager(@Args('createManagerInput') createManagerInput: CreateManagerInput) {
    return this.managerService.create(createManagerInput);
  }

  @Query(() => [Manager], { name: 'managers' })
  findAll() {
    return this.managerService.findAll();
  }

  @Query(() => Manager, { name: 'manager' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.managerService.findOne(id);
  }

  @Mutation(() => Manager)
  updateManager(@Args('updateManagerInput') updateManagerInput: UpdateManagerInput) {
    return this.managerService.update(updateManagerInput);
  }

  @Mutation(() => Manager)
  removeManager(@Args('id', { type: () => Int }) id: number) {
    return this.managerService.remove(id);
  }
}