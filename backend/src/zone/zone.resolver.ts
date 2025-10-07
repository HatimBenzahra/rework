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
  findAll() {
    return this.zoneService.findAll();
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
    return this.zoneService.assignToCommercial(zoneId, commercialId).then(() => true);
  }

  @Mutation(() => Boolean)
  unassignZoneFromCommercial(
    @Args('zoneId', { type: () => Int }) zoneId: number,
    @Args('commercialId', { type: () => Int }) commercialId: number,
  ) {
    return this.zoneService.unassignFromCommercial(zoneId, commercialId).then(() => true);
  }
}