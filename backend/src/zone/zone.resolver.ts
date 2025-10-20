import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ZoneService } from './zone.service';
import { Zone, CreateZoneInput, UpdateZoneInput } from './zone.dto';

@Resolver(() => Zone)
export class ZoneResolver {
  constructor(private readonly zoneService: ZoneService) {}

  @Mutation(() => Zone)
  createZone(@Args('createZoneInput') createZoneInput: CreateZoneInput) {
    return this.zoneService.create(createZoneInput);
  }

  @Query(() => [Zone], { name: 'zones' })
  findAll(
    @Args('userId', { type: () => Int, nullable: true }) userId?: number,
    @Args('userRole', { type: () => String, nullable: true }) userRole?: string,
  ) {
    return this.zoneService.findAll(userId, userRole);
  }

  @Query(() => Zone, { name: 'zone' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.zoneService.findOne(id);
  }

  @Mutation(() => Zone)
  updateZone(@Args('updateZoneInput') updateZoneInput: UpdateZoneInput) {
    return this.zoneService.update(updateZoneInput);
  }

  @Mutation(() => Zone)
  removeZone(@Args('id', { type: () => Int }) id: number) {
    return this.zoneService.remove(id);
  }

  @Mutation(() => Boolean)
  assignZoneToCommercial(
    @Args('zoneId', { type: () => Int }) zoneId: number,
    @Args('commercialId', { type: () => Int }) commercialId: number,
  ) {
    return this.zoneService
      .assignToCommercial(zoneId, commercialId)
      .then(() => true);
  }

  @Mutation(() => Boolean)
  assignZoneToDirecteur(
    @Args('zoneId', { type: () => Int }) zoneId: number,
    @Args('directeurId', { type: () => Int }) directeurId: number,
  ) {
    return this.zoneService
      .assignToDirecteur(zoneId, directeurId)
      .then(() => true);
  }

  @Mutation(() => Boolean)
  assignZoneToManager(
    @Args('zoneId', { type: () => Int }) zoneId: number,
    @Args('managerId', { type: () => Int }) managerId: number,
  ) {
    return this.zoneService.assignToManager(zoneId, managerId).then(() => true);
  }
  @Mutation(() => Boolean)
  unassignZoneFromCommercial(
    @Args('zoneId', { type: () => Int }) zoneId: number,
    @Args('commercialId', { type: () => Int }) commercialId: number,
  ) {
    return this.zoneService
      .unassignFromCommercial(zoneId, commercialId)
      .then(() => true);
  }
}
