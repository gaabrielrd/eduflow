import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards
} from "@nestjs/common";

import { CurrentOrganizationContext } from "../auth/decorators/current-organization-context.decorator.js";
import { AUTHORING_ROLES } from "../auth/authoring-roles.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { OrganizationContextGuard } from "../auth/guards/organization-context.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import type { OrganizationContext } from "../auth/types/organization-context.interface.js";
import { ReorderItemsDto } from "../common/dto/reorder-items.dto.js";
import { CourseModulesService } from "./course-modules.service.js";
import { CreateCourseModuleDto } from "./dto/create-course-module.dto.js";
import { UpdateCourseModuleDto } from "./dto/update-course-module.dto.js";

@Controller("courses/:courseId/modules")
@UseGuards(JwtAuthGuard, OrganizationContextGuard)
export class CourseModulesController {
  constructor(private readonly courseModulesService: CourseModulesService) {}

  @Post()
  @Roles(...AUTHORING_ROLES)
  @UseGuards(RolesGuard)
  create(
    @CurrentOrganizationContext() context: OrganizationContext,
    @Param("courseId") courseId: string,
    @Body() dto: CreateCourseModuleDto
  ) {
    return this.courseModulesService.createModule(context, courseId, dto);
  }

  @Post("reorder")
  @Roles(...AUTHORING_ROLES)
  @UseGuards(RolesGuard)
  reorder(
    @CurrentOrganizationContext() context: OrganizationContext,
    @Param("courseId") courseId: string,
    @Body() dto: ReorderItemsDto
  ) {
    return this.courseModulesService.reorderModules(context, courseId, dto);
  }

  @Patch(":moduleId")
  @Roles(...AUTHORING_ROLES)
  @UseGuards(RolesGuard)
  update(
    @CurrentOrganizationContext() context: OrganizationContext,
    @Param("courseId") courseId: string,
    @Param("moduleId") moduleId: string,
    @Body() dto: UpdateCourseModuleDto
  ) {
    return this.courseModulesService.updateModule(
      context,
      courseId,
      moduleId,
      dto
    );
  }

  @Delete(":moduleId")
  @Roles(...AUTHORING_ROLES)
  @UseGuards(RolesGuard)
  archive(
    @CurrentOrganizationContext() context: OrganizationContext,
    @Param("courseId") courseId: string,
    @Param("moduleId") moduleId: string
  ) {
    return this.courseModulesService.archiveModule(context, courseId, moduleId);
  }
}
