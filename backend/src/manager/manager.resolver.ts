import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ManagerService } from './manager.service';
import { Manager, CreateManagerInput, UpdateManagerInput } from './manager.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => Manager)
@UseGuards(JwtAuthGuard, RolesGuard)
export class ManagerResolver {
  constructor(private readonly managerService: ManagerService) {}

  @Mutation(() => Manager)
  @Roles('admin', 'directeur')
  createManager(
    @Args('createManagerInput') createManagerInput: CreateManagerInput,
  ) {
    return this.managerService.create(createManagerInput);
  }

  @Query(() => [Manager], { name: 'managers' })
  @Roles('admin', 'directeur', 'manager')
  findAll(@CurrentUser() user: any) {
    // Utiliser UNIQUEMENT les informations du JWT (sécurisé via Keycloak)
    return this.managerService.findAll(user.id, user.role);
  }

  @Query(() => Manager, { name: 'manager' })
  @Roles('admin', 'directeur', 'manager')
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.managerService.findOne(id);
  }

  @Query(() => Manager, { name: 'managerPersonal', nullable: true })
  @Roles('admin', 'directeur', 'manager')
  findPersonal(@Args('id', { type: () => Int }) id: number) {
    return this.managerService.findPersonal(id);
  }

  @Query(() => Manager, { name: 'managerFull', nullable: true })
  @Roles('admin', 'directeur', 'manager')
  findFull(@Args('id', { type: () => Int }) id: number) {
    return this.managerService.findFull(id);
  }

  @Mutation(() => Manager)
  @Roles('admin', 'directeur')
  updateManager(
    @Args('updateManagerInput') updateManagerInput: UpdateManagerInput,
  ) {
    return this.managerService.update(updateManagerInput);
  }

  @Mutation(() => Manager)
  @Roles('admin', 'directeur')
  removeManager(@Args('id', { type: () => Int }) id: number) {
    return this.managerService.remove(id);
  }
}
