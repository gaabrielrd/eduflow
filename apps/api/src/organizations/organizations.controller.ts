import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { AccessTokenGuard } from "../auth/guards/access-token.guard.js";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.interface.js";
import { CurrentOrganizationContext } from "./decorators/current-organization-context.decorator.js";
import { CreateOrganizationDto } from "./dto/create-organization.dto.js";
import { UpdateCurrentOrganizationDto } from "./dto/update-current-organization.dto.js";
import { OrganizationContextGuard } from "./guards/organization-context.guard.js";
import { OrganizationsService } from "./organizations.service.js";
import type { OrganizationContext } from "./types/organization-context.interface.js";

@Controller("organizations")
@UseGuards(AccessTokenGuard)
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
  @UseGuards(OrganizationContextGuard)
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
