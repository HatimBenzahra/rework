import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ZoneService } from './zone.service';
import {
  Zone,
  CreateZoneInput,
  UpdateZoneInput,
  ZoneEnCours,
  HistoriqueZone,
  AssignZoneInput,
  UserType,
} from './zone.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Resolver(() => Zone)
@UseGuards(JwtAuthGuard, RolesGuard)
export class ZoneResolver {
  constructor(private readonly zoneService: ZoneService) {}

  @Mutation(() => Zone)
  @Roles('admin', 'directeur', 'manager')
  createZone(@Args('createZoneInput') createZoneInput: CreateZoneInput) {
    return this.zoneService.create(createZoneInput);
  }

  @Query(() => [Zone], { name: 'zones' })
  @Roles('admin', 'directeur', 'manager', 'commercial')
  findAll(
    @Args('userId', { type: () => Int, nullable: true }) userId?: number,
    @Args('userRole', { type: () => String, nullable: true }) userRole?: string,
  ) {
    return this.zoneService.findAll(userId, userRole);
  }

  @Query(() => Zone, { name: 'zone' })
  @Roles('admin', 'directeur', 'manager', 'commercial')
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.zoneService.findOne(id);
  }

  @Mutation(() => Zone)
  @Roles('admin', 'directeur', 'manager')
  updateZone(@Args('updateZoneInput') updateZoneInput: UpdateZoneInput) {
    return this.zoneService.update(updateZoneInput);
  }

  @Mutation(() => Zone)
  @Roles('admin', 'directeur')
  removeZone(@Args('id', { type: () => Int }) id: number) {
    return this.zoneService.remove(id);
  }

  @Mutation(() => Boolean)
  @Roles('admin', 'directeur', 'manager')
  assignZoneToCommercial(
    @Args('zoneId', { type: () => Int }) zoneId: number,
    @Args('commercialId', { type: () => Int }) commercialId: number,
  ) {
    return this.zoneService
      .assignToCommercial(zoneId, commercialId)
      .then(() => true);
  }

  @Mutation(() => Boolean)
  @Roles('admin', 'directeur')
  assignZoneToDirecteur(
    @Args('zoneId', { type: () => Int }) zoneId: number,
    @Args('directeurId', { type: () => Int }) directeurId: number,
  ) {
    return this.zoneService
      .assignToDirecteur(zoneId, directeurId)
      .then(() => true);
  }

  @Mutation(() => Boolean)
  @Roles('admin', 'directeur')
  assignZoneToManager(
    @Args('zoneId', { type: () => Int }) zoneId: number,
    @Args('managerId', { type: () => Int }) managerId: number,
  ) {
    return this.zoneService.assignToManager(zoneId, managerId).then(() => true);
  }

  @Mutation(() => Boolean)
  @Roles('admin', 'directeur', 'manager')
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
  @Roles('admin', 'directeur', 'manager')
  assignZoneToUser(@Args('input') input: AssignZoneInput) {
    return this.zoneService.assignZoneToUser(
      input.zoneId,
      input.userId,
      input.userType,
    );
  }

  @Mutation(() => Boolean, { name: 'unassignUser' })
  @Roles('admin', 'directeur', 'manager')
  unassignUser(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('userType', { type: () => UserType }) userType: UserType,
  ) {
    return this.zoneService.unassignUser(userId, userType).then(() => true);
  }

  @Query(() => ZoneEnCours, { name: 'currentUserAssignment', nullable: true })
  @Roles('admin', 'directeur', 'manager', 'commercial')
  getCurrentAssignment(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('userType', { type: () => UserType }) userType: UserType,
  ) {
    return this.zoneService.getCurrentAssignment(userId, userType);
  }

  @Query(() => [HistoriqueZone], { name: 'userZoneHistory' })
  @Roles('admin', 'directeur', 'manager', 'commercial')
  getUserZoneHistory(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('userType', { type: () => UserType }) userType: UserType,
  ) {
    return this.zoneService.getUserZoneHistory(userId, userType);
  }

  @Query(() => [HistoriqueZone], { name: 'zoneHistory' })
  @Roles('admin', 'directeur', 'manager')
  getZoneHistory(@Args('zoneId', { type: () => Int }) zoneId: number) {
    return this.zoneService.getZoneHistory(zoneId);
  }

  @Query(() => [ZoneEnCours], { name: 'zoneCurrentAssignments' })
  @Roles('admin', 'directeur', 'manager')
  getZoneCurrentAssignments(
    @Args('zoneId', { type: () => Int }) zoneId: number,
  ) {
    return this.zoneService.getZoneCurrentAssignments(zoneId);
  }

  @Query(() => [HistoriqueZone], { name: 'allZoneHistory' })
  @Roles('admin', 'directeur', 'manager')
  getAllZoneHistory(
    @Args('userId', { type: () => Int, nullable: true }) userId?: number,
    @Args('userRole', { type: () => String, nullable: true }) userRole?: string,
  ) {
    return this.zoneService.getAllZoneHistory(userId, userRole);
  }

  @Query(() => [ZoneEnCours], { name: 'allCurrentAssignments' })
  @Roles('admin', 'directeur', 'manager', 'commercial')
  getAllCurrentAssignments(
    @Args('userId', { type: () => Int, nullable: true }) userId?: number,
    @Args('userRole', { type: () => String, nullable: true }) userRole?: string,
  ) {
    return this.zoneService.getAllCurrentAssignments(userId, userRole);
  }
}
