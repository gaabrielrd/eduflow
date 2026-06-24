import { Role } from "../generated/prisma/enums.js";

export const AUTHORING_ROLES = [
  Role.OWNER,
  Role.ADMIN,
  Role.INSTRUCTOR,
  Role.MANAGER
] as const;
