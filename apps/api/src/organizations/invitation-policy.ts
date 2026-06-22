import { Role } from "../generated/prisma/enums.js";

export const INVITATION_TTL_IN_DAYS = 7;

export const INVITABLE_ROLES = [
  Role.ADMIN,
  Role.INSTRUCTOR,
  Role.MANAGER,
  Role.STUDENT
] as const;

export function isInvitableRole(role: Role) {
  return INVITABLE_ROLES.includes(role as (typeof INVITABLE_ROLES)[number]);
}
