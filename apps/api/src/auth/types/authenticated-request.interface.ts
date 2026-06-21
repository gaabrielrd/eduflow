import type { Request } from "express";

import type { AuthenticatedUser } from "./authenticated-user.interface.js";
import type { OrganizationContext } from "./organization-context.interface.js";

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  organizationContext?: OrganizationContext;
}
