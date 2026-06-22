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
import { Roles } from "../auth/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { OrganizationContextGuard } from "../auth/guards/organization-context.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import type { OrganizationContext } from "../auth/types/organization-context.interface.js";
import { ReorderItemsDto } from "../common/dto/reorder-items.dto.js";
import { Role } from "../generated/prisma/enums.js";
import { CreateLessonDto } from "./dto/create-lesson.dto.js";
import { UpdateLessonDto } from "./dto/update-lesson.dto.js";
import { LessonsService } from "./lessons.service.js";

@UseGuards(JwtAuthGuard, OrganizationContextGuard)
@Controller()
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post("modules/:moduleId/lessons")
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @UseGuards(RolesGuard)
  create(
    @CurrentOrganizationContext() context: OrganizationContext,
    @Param("moduleId") moduleId: string,
    @Body() dto: CreateLessonDto
  ) {
    return this.lessonsService.createLesson(context, moduleId, dto);
  }

  @Post("modules/:moduleId/lessons/reorder")
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @UseGuards(RolesGuard)
  reorder(
    @CurrentOrganizationContext() context: OrganizationContext,
    @Param("moduleId") moduleId: string,
    @Body() dto: ReorderItemsDto
  ) {
    return this.lessonsService.reorderLessons(context, moduleId, dto);
  }

  @Patch("lessons/:lessonId")
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @UseGuards(RolesGuard)
  update(
    @CurrentOrganizationContext() context: OrganizationContext,
    @Param("lessonId") lessonId: string,
    @Body() dto: UpdateLessonDto
  ) {
    return this.lessonsService.updateLesson(context, lessonId, dto);
  }

  @Delete("lessons/:lessonId")
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @UseGuards(RolesGuard)
  archive(
    @CurrentOrganizationContext() context: OrganizationContext,
    @Param("lessonId") lessonId: string
  ) {
    return this.lessonsService.archiveLesson(context, lessonId);
  }
}
