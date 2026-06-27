import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards
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
import { CoursesService } from "./courses.service.js";
import { CreateCourseDto } from "./dto/create-course.dto.js";
import { UpdateCourseDto } from "./dto/update-course.dto.js";

@Controller("courses")
@UseGuards(JwtAuthGuard, OrganizationContextGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(...AUTHORING_ROLES)
  @UseGuards(RolesGuard)
  create(
    @CurrentOrganizationContext() context: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCourseDto
  ) {
    return this.coursesService.createCourse(context, user, dto);
  }

  @Get()
  list(@CurrentOrganizationContext() context: OrganizationContext) {
    return this.coursesService.listCourses(context);
  }

  @Get(":id")
  getById(
    @CurrentOrganizationContext() context: OrganizationContext,
    @Param("id") id: string
  ) {
    return this.coursesService.getCourseById(context, id);
  }

  @Get(":id/curriculum")
  getCurriculum(
    @CurrentOrganizationContext() context: OrganizationContext,
    @Param("id") id: string
  ) {
    return this.coursesService.getCourseCurriculum(context, id);
  }

  @Patch(":id")
  @Roles(...AUTHORING_ROLES)
  @UseGuards(RolesGuard)
  update(
    @CurrentOrganizationContext() context: OrganizationContext,
    @Param("id") id: string,
    @Body() dto: UpdateCourseDto
  ) {
    return this.coursesService.updateCourse(context, id, dto);
  }

  @Delete(":id")
  @Roles(...AUTHORING_ROLES)
  @UseGuards(RolesGuard)
  archive(
    @CurrentOrganizationContext() context: OrganizationContext,
    @Param("id") id: string
  ) {
    return this.coursesService.archiveCourse(context, id);
  }

  @Post(":courseId/publish")
  @Roles(...AUTHORING_ROLES)
  @UseGuards(RolesGuard)
  publish(
    @CurrentOrganizationContext() context: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("courseId") courseId: string
  ) {
    return this.coursesService.publishCourse(context, user, courseId);
  }
}
