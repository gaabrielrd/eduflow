import { Controller, Get, Param, UseGuards } from "@nestjs/common";

import { CurrentOrganizationContext } from "../auth/decorators/current-organization-context.decorator.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { OrganizationContextGuard } from "../auth/guards/organization-context.guard.js";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.interface.js";
import type { OrganizationContext } from "../auth/types/organization-context.interface.js";
import { EnrollmentsService } from "./enrollments.service.js";

@Controller("learning/enrollments")
@UseGuards(JwtAuthGuard, OrganizationContextGuard)
export class LearningEnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get(":enrollmentId")
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
}
