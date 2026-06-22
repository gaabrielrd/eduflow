import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable
} from "@nestjs/common";
import { randomBytes } from "node:crypto";

import type { AuthenticatedUser } from "../auth/types/authenticated-user.interface.js";
import { PrismaService } from "../database/prisma.service.js";
import { Prisma } from "../generated/prisma/client.js";
import { Role } from "../generated/prisma/enums.js";
import type { CreateOrganizationDto } from "./dto/create-organization.dto.js";
import type { UpdateCurrentOrganizationDto } from "./dto/update-current-organization.dto.js";
import type { OrganizationContext } from "../auth/types/organization-context.interface.js";
import type { CreateCurrentOrganizationInvitationDto } from "./dto/create-current-organization-invitation.dto.js";
import {
  INVITATION_TTL_IN_DAYS,
  isInvitableRole
} from "./invitation-policy.js";

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrganization(user: AuthenticatedUser, dto: CreateOrganizationDto) {
    const normalizedSlug = this.normalizeSlug(dto.slug);

    try {
      const organization = await this.prisma.$transaction(async (tx) => {
        const createdOrganization = await tx.organization.create({
          data: {
            name: dto.name.trim(),
            slug: normalizedSlug
          },
          select: {
            id: true,
            name: true,
            slug: true
          }
        });

        const membership = await tx.membership.create({
          data: {
            userId: user.id,
            organizationId: createdOrganization.id,
            role: Role.OWNER
          },
          select: {
            role: true
          }
        });

        return {
          ...createdOrganization,
          role: membership.role
        };
      });

      return organization;
    } catch (error) {
      this.handleKnownPersistenceErrors(error);
    }
  }

  async listOrganizations(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: {
        userId
      },
      select: {
        role: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        organization: {
          createdAt: "asc"
        }
      }
    });

    return memberships.map(({ organization, role }) => ({
      ...organization,
      role
    }));
  }

  async getCurrentOrganization(context: OrganizationContext) {
    const organization = await this.prisma.organization.findUniqueOrThrow({
      where: {
        id: context.organizationId
      },
      select: {
        id: true,
        name: true,
        slug: true
      }
    });

    return {
      ...organization,
      role: context.role
    };
  }

  async updateCurrentOrganization(
    context: OrganizationContext,
    dto: UpdateCurrentOrganizationDto
  ) {
    const data: {
      name?: string;
      slug?: string;
    } = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.slug !== undefined) {
      data.slug = this.normalizeSlug(dto.slug);
    }

    try {
      const organization = await this.prisma.organization.update({
        where: {
          id: context.organizationId
        },
        data,
        select: {
          id: true,
          name: true,
          slug: true
        }
      });

      return {
        ...organization,
        role: context.role
      };
    } catch (error) {
      this.handleKnownPersistenceErrors(error);
    }
  }

  async listCurrentOrganizationMembers(context: OrganizationContext) {
    return this.prisma.membership.findMany({
      where: {
        organizationId: context.organizationId
      },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        {
          createdAt: "asc"
        },
        {
          id: "asc"
        }
      ]
    });
  }

  async createCurrentOrganizationInvitation(
    context: OrganizationContext,
    dto: CreateCurrentOrganizationInvitationDto
  ) {
    if (!isInvitableRole(dto.role)) {
      throw new ForbiddenException("Invitation role is not allowed");
    }

    const invitation = await this.prisma.invitation.create({
      data: {
        email: this.normalizeEmail(dto.email),
        organizationId: context.organizationId,
        role: dto.role,
        token: this.generateInvitationToken(),
        expiresAt: new Date(
          Date.now() + INVITATION_TTL_IN_DAYS * 24 * 60 * 60 * 1000
        )
      },
      select: {
        id: true,
        email: true,
        role: true,
        token: true,
        expiresAt: true,
        acceptedAt: true,
        createdAt: true
      }
    });

    return {
      ...invitation,
      inviteUrl: `/invite/${invitation.token}`,
      status: this.getInvitationStatus(invitation)
    };
  }

  async listCurrentOrganizationInvitations(context: OrganizationContext) {
    const invitations = await this.prisma.invitation.findMany({
      where: {
        organizationId: context.organizationId
      },
      select: {
        id: true,
        email: true,
        role: true,
        token: true,
        expiresAt: true,
        acceptedAt: true,
        createdAt: true
      },
      orderBy: [
        {
          createdAt: "desc"
        },
        {
          id: "desc"
        }
      ]
    });

    return invitations.map((invitation) => ({
      ...invitation,
      inviteUrl: `/invite/${invitation.token}`,
      status: this.getInvitationStatus(invitation)
    }));
  }

  private normalizeSlug(slug: string) {
    const normalized = slug
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!normalized) {
      throw new BadRequestException("Slug is invalid");
    }

    return normalized;
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private generateInvitationToken() {
    return randomBytes(24).toString("hex");
  }

  private getInvitationStatus(invitation: {
    acceptedAt: Date | null;
    expiresAt: Date;
  }) {
    if (invitation.acceptedAt) {
      return "accepted" as const;
    }

    if (invitation.expiresAt.getTime() <= Date.now()) {
      return "expired" as const;
    }

    return "pending" as const;
  }

  private handleKnownPersistenceErrors(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException("Slug already in use");
    }

    throw error;
  }
}
