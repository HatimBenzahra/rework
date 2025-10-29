import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ManagerService } from './manager.service';
import { Manager, CreateManagerInput, UpdateManagerInput } from './manager.dto';

@Resolver(() => Manager)
export class ManagerResolver {
  constructor(private readonly managerService: ManagerService) {}

  @Mutation(() => Manager)
  createManager(
    @Args('createManagerInput') createManagerInput: CreateManagerInput,
  ) {
    return this.managerService.create(createManagerInput);
  }

  @Query(() => [Manager], { name: 'managers' })
  findAll(
    @Args('userId', { type: () => Int, nullable: true }) userId?: number,
    @Args('userRole', { type: () => String, nullable: true }) userRole?: string,
  ) {
    return this.managerService.findAll(userId, userRole);
  }

  @Query(() => Manager, { name: 'manager' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.managerService.findOne(id);
  }

  @Query(() => Manager, { name: 'managerPersonal', nullable: true })
  findPersonal(@Args('id', { type: () => Int }) id: number) {
    return this.managerService.findPersonal(id);
  }

  @Query(() => Manager, { name: 'managerFull', nullable: true })
  findFull(@Args('id', { type: () => Int }) id: number) {
    return this.managerService.findFull(id);
  }

  @Mutation(() => Manager)
  updateManager(
    @Args('updateManagerInput') updateManagerInput: UpdateManagerInput,
  ) {
    return this.managerService.update(updateManagerInput);
  }

  @Mutation(() => Manager)
  removeManager(@Args('id', { type: () => Int }) id: number) {
    return this.managerService.remove(id);
  }
}
