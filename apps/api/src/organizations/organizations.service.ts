import {
  BadRequestException,
  ConflictException,
  Injectable
} from "@nestjs/common";

import type { AuthenticatedUser } from "../auth/types/authenticated-user.interface.js";
import { PrismaService } from "../database/prisma.service.js";
import { Prisma } from "../generated/prisma/client.js";
import { Role } from "../generated/prisma/enums.js";
import type { CreateOrganizationDto } from "./dto/create-organization.dto.js";
import type { UpdateCurrentOrganizationDto } from "./dto/update-current-organization.dto.js";
import type { OrganizationContext } from "../auth/types/organization-context.interface.js";

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
