import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ZoneService } from './zone.service';
import { Zone, CreateZoneInput, UpdateZoneInput, ZoneEnCours, HistoriqueZone, AssignZoneInput, UserType } from './zone.dto';

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

  // =====================================================
  //assignZoneToUser and unassignUser
  // =====================================================

  @Mutation(() => ZoneEnCours, { name: 'assignZoneToUser' })
  assignZoneToUser(@Args('input') input: AssignZoneInput) {
    return this.zoneService.assignZoneToUser(input.zoneId, input.userId, input.userType);
  }

  @Mutation(() => Boolean, { name: 'unassignUser' })
  unassignUser(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('userType', { type: () => UserType }) userType: UserType,
  ) {
    return this.zoneService.unassignUser(userId, userType).then(() => true);
  }

  @Query(() => ZoneEnCours, { name: 'currentUserAssignment', nullable: true })
  getCurrentAssignment(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('userType', { type: () => UserType }) userType: UserType,
  ) {
    return this.zoneService.getCurrentAssignment(userId, userType);
  }

  @Query(() => [HistoriqueZone], { name: 'userZoneHistory' })
  getUserZoneHistory(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('userType', { type: () => UserType }) userType: UserType,
  ) {
    return this.zoneService.getUserZoneHistory(userId, userType);
  }

  @Query(() => [HistoriqueZone], { name: 'zoneHistory' })
  getZoneHistory(@Args('zoneId', { type: () => Int }) zoneId: number) {
    return this.zoneService.getZoneHistory(zoneId);
  }

  @Query(() => [ZoneEnCours], { name: 'zoneCurrentAssignments' })
  getZoneCurrentAssignments(@Args('zoneId', { type: () => Int }) zoneId: number) {
    return this.zoneService.getZoneCurrentAssignments(zoneId);
  }

  @Query(() => [HistoriqueZone], { name: 'allZoneHistory' })
  getAllZoneHistory() {
    return this.zoneService.getAllZoneHistory();
  }

  @Query(() => [ZoneEnCours], { name: 'allCurrentAssignments' })
  getAllCurrentAssignments() {
    return this.zoneService.getAllCurrentAssignments();
  }
}
