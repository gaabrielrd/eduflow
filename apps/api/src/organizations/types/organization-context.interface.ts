import type { Role } from "../../generated/prisma/enums.js";

export interface OrganizationContext {
  organizationId: string;
  membershipId: string;
  role: Role;
}
