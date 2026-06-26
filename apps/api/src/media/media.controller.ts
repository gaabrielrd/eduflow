import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { CurrentOrganizationContext } from "../auth/decorators/current-organization-context.decorator.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { AUTHORING_ROLES } from "../auth/authoring-roles.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { OrganizationContextGuard } from "../auth/guards/organization-context.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.interface.js";
import type { OrganizationContext } from "../auth/types/organization-context.interface.js";
import { CompleteMediaDto } from "./dto/complete-media.dto.js";
import { ListMediaDto } from "./dto/list-media.dto.js";
import { PresignMediaDto } from "./dto/presign-media.dto.js";
import { MediaService } from "./media.service.js";

@Controller("media")
@UseGuards(JwtAuthGuard, OrganizationContextGuard)
export class MediaController {
  constructor(
    @Inject(MediaService) private readonly mediaService: MediaService,
  ) {}

  @Get()
  list(
    @CurrentOrganizationContext() context: OrganizationContext,
    @Query() dto: ListMediaDto,
  ) {
    return this.mediaService.listMedia(context, dto);
  }

  @Get(":id")
  getById(
    @CurrentOrganizationContext() context: OrganizationContext,
    @Param("id") id: string,
  ) {
    return this.mediaService.getMediaById(context, id);
  }

  @Post("presign")
  @Roles(...AUTHORING_ROLES)
  @UseGuards(RolesGuard)
  presign(
    @CurrentOrganizationContext() context: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PresignMediaDto,
  ) {
    return this.mediaService.createPresignedUpload(context, user, dto);
  }

  @Post("complete")
  @Roles(...AUTHORING_ROLES)
  @UseGuards(RolesGuard)
  complete(
    @CurrentOrganizationContext() context: OrganizationContext,
    @Body() dto: CompleteMediaDto,
  ) {
    return this.mediaService.completeUpload(context, dto);
  }

  @Delete(":id")
  remove(
    @CurrentOrganizationContext() context: OrganizationContext,
    @Param("id") id: string,
  ) {
    return this.mediaService.deleteMedia(context, id);
  }
}
