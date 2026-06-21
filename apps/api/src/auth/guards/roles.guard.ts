import {
  CanActivate,
  ForbiddenException,
  Injectable,
  type ExecutionContext
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { AuthenticatedRequest } from "../types/authenticated-request.interface.js";
import { ROLES_KEY } from "../decorators/roles.decorator.js";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!roles || roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const contextRole = request.organizationContext?.role;

    if (!contextRole) {
      throw new ForbiddenException("Organization context is required");
    }

    if (!roles.includes(contextRole)) {
      throw new ForbiddenException("Insufficient organization role");
    }

    return true;
  }
}
