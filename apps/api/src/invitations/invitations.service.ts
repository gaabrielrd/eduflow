import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";

import type { AuthenticatedUser } from "../auth/types/authenticated-user.interface.js";
import { PrismaService } from "../database/prisma.service.js";

type InvitationWithOrganization = {
  id: string;
  email: string;
  organizationId?: string;
  role: string;
  token: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
};

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getInvitationByToken(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: {
        token: token.trim()
      },
      select: {
        id: true,
        email: true,
        role: true,
        token: true,
        expiresAt: true,
        acceptedAt: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!invitation) {
      throw new NotFoundException("Invitation not found");
    }

    return this.toPublicInvitation(invitation);
  }

  async acceptInvitation(token: string, user: AuthenticatedUser) {
    const normalizedEmail = this.normalizeEmail(user.email);
    const normalizedToken = token.trim();

    const result = await this.prisma.$transaction(async (tx) => {
      const invitation = await tx.invitation.findUnique({
        where: {
          token: normalizedToken
        },
        select: {
          id: true,
          email: true,
          organizationId: true,
          role: true,
          token: true,
          expiresAt: true,
          acceptedAt: true,
          createdAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      });

      if (!invitation) {
        throw new NotFoundException("Invitation not found");
      }

      if (invitation.acceptedAt) {
        throw new ConflictException("Invitation has already been accepted");
      }

      if (invitation.expiresAt.getTime() <= Date.now()) {
        throw new BadRequestException("Invitation has expired");
      }

      if (this.normalizeEmail(invitation.email) !== normalizedEmail) {
        throw new ForbiddenException("Invitation email does not match the authenticated user");
      }

      const existingMembership = await tx.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: invitation.organizationId
          }
        },
        select: {
          id: true
        }
      });

      if (existingMembership) {
        throw new ConflictException("User is already a member of this organization");
      }

      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          organizationId: invitation.organizationId,
          role: invitation.role
        },
        select: {
          id: true,
          role: true,
          createdAt: true
        }
      });

      const acceptedInvitation = await tx.invitation.update({
        where: {
          id: invitation.id
        },
        data: {
          acceptedAt: new Date()
        },
        select: {
          acceptedAt: true
        }
      });

      return {
        membership,
        invitation: {
          ...this.toPublicInvitation({
            ...invitation,
            acceptedAt: acceptedInvitation.acceptedAt
          }),
          organizationId: invitation.organizationId
        },
        organization: invitation.organization
      };
    });

    return result;
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
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

  private toPublicInvitation(invitation: InvitationWithOrganization) {
    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      createdAt: invitation.createdAt,
      inviteUrl: `/invite/${invitation.token}`,
      organization: invitation.organization,
      status: this.getInvitationStatus(invitation)
    };
  }
}
