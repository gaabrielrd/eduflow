import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";

import { CurrentOrganizationContext } from "../auth/decorators/current-organization-context.decorator.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { OrganizationContextGuard } from "../auth/guards/organization-context.guard.js";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.interface.js";
import type { OrganizationContext } from "../auth/types/organization-context.interface.js";
import { EnrollmentsService } from "./enrollments.service.js";

@Controller("learning")
@UseGuards(JwtAuthGuard, OrganizationContextGuard)
export class LearningEnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get("my-courses")
  listMyCourses(
    @CurrentOrganizationContext() context: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.enrollmentsService.listMyCourses(context, user);
  }

  @Get("enrollments/:enrollmentId")
  getById(
    @CurrentOrganizationContext() context: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("enrollmentId") enrollmentId: string
  ) {
    return this.enrollmentsService.getEnrollmentById(
      context,
      user,
      enrollmentId
    );
  }

  @Post("enrollments/:enrollmentId/lessons/:lessonId/start")
  startLesson(
    @CurrentOrganizationContext() context: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("enrollmentId") enrollmentId: string,
    @Param("lessonId") lessonId: string
  ) {
    return this.enrollmentsService.startLesson(
      context,
      user,
      enrollmentId,
      lessonId
    );
  }

  @Post("enrollments/:enrollmentId/lessons/:lessonId/complete")
  completeLesson(
    @CurrentOrganizationContext() context: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("enrollmentId") enrollmentId: string,
    @Param("lessonId") lessonId: string
  ) {
    return this.enrollmentsService.completeLesson(
      context,
      user,
      enrollmentId,
      lessonId
    );
  }

  @Get("enrollments/:enrollmentId/progress")
  getProgress(
    @CurrentOrganizationContext() context: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("enrollmentId") enrollmentId: string
  ) {
    return this.enrollmentsService.getProgress(context, user, enrollmentId);
  }
}
