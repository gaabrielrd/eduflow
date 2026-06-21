import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";

import { CurrentOrganizationContext } from "../auth/decorators/current-organization-context.decorator.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { OrganizationContextGuard } from "../auth/guards/organization-context.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.interface.js";
import type { OrganizationContext } from "../auth/types/organization-context.interface.js";
import { Role } from "../generated/prisma/enums.js";
import { CreateOrganizationDto } from "./dto/create-organization.dto.js";
import { UpdateCurrentOrganizationDto } from "./dto/update-current-organization.dto.js";
import { OrganizationsService } from "./organizations.service.js";

@Controller("organizations")
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrganizationDto
  ) {
    return this.organizationsService.createOrganization(user, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.organizationsService.listOrganizations(user.id);
  }

  @Get("current")
  @UseGuards(OrganizationContextGuard)
  getCurrent(
    @CurrentOrganizationContext() context: OrganizationContext
  ) {
    return this.organizationsService.getCurrentOrganization(context);
  }

  @Patch("current")
  @Roles(Role.OWNER, Role.ADMIN)
  @UseGuards(OrganizationContextGuard, RolesGuard)
  updateCurrent(
    @CurrentOrganizationContext() context: OrganizationContext,
    @Body() dto: UpdateCurrentOrganizationDto
  ) {
    return this.organizationsService.updateCurrentOrganization(context, dto);
  }

  @Get("current/members")
  @UseGuards(OrganizationContextGuard)
  listMembers(
    @CurrentOrganizationContext() context: OrganizationContext
  ) {
    return this.organizationsService.listCurrentOrganizationMembers(context);
  }
}
