import {
  CanActivate,
  ForbiddenException,
  Injectable,
  type ExecutionContext
} from "@nestjs/common";

import type { AuthenticatedRequest } from "../../auth/types/authenticated-request.interface.js";
import { PrismaService } from "../../database/prisma.service.js";

const ORGANIZATION_ID_HEADER = "x-organization-id";

@Injectable()
export class OrganizationContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException("Organization context is unavailable");
    }

    const organizationIdHeader = request.headers[ORGANIZATION_ID_HEADER];
    const organizationId = Array.isArray(organizationIdHeader)
      ? organizationIdHeader[0]
      : organizationIdHeader;

    if (!organizationId?.trim()) {
      throw new ForbiddenException("Organization context is required");
    }

    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: organizationId.trim()
        }
      },
      select: {
        id: true,
        organizationId: true,
        role: true
      }
    });

    if (!membership) {
      throw new ForbiddenException("Organization access denied");
    }

    request.organizationContext = {
      organizationId: membership.organizationId,
      membershipId: membership.id,
      role: membership.role
    };

    return true;
  }
}
