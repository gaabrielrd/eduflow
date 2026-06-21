import {
  CanActivate,
  Injectable,
  UnauthorizedException,
  type ExecutionContext
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { getJwtConfig } from "../../config/app.config.js";
import { PrismaService } from "../../database/prisma.service.js";
import type { AuthenticatedRequest } from "../types/authenticated-request.interface.js";
import type { AccessTokenPayload } from "../types/auth-token-payload.interface.js";

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException("Invalid authentication credentials");
    }

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        token,
        {
          secret: getJwtConfig().secret
        }
      );

      if (payload.type !== "access") {
        throw new UnauthorizedException("Invalid authentication credentials");
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          name: true,
          email: true
        }
      });

      if (!user) {
        throw new UnauthorizedException("Invalid authentication credentials");
      }

      request.user = user;

      return true;
    } catch {
      throw new UnauthorizedException("Invalid authentication credentials");
    }
  }

  private extractBearerToken(authorizationHeader?: string) {
    if (!authorizationHeader) {
      return null;
    }

    const [scheme, token] = authorizationHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return null;
    }

    return token;
  }
}
