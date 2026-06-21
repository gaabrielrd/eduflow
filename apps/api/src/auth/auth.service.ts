import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";

import { getJwtConfig } from "../config/app.config.js";
import { PrismaService } from "../database/prisma.service.js";
import { PrismaClient } from "../generated/prisma/client.js";
import type { LoginDto } from "./dto/login.dto.js";
import type { RegisterDto } from "./dto/register.dto.js";
import type {
  AccessTokenPayload,
  RefreshTokenPayload
} from "./types/auth-token-payload.interface.js";
import type { AuthenticatedUser } from "./types/authenticated-user.interface.js";

const PASSWORD_HASH_ROUNDS = 12;
const REFRESH_TOKEN_HASH_ROUNDS = 10;
type AuthSessionDelegate = InstanceType<typeof PrismaClient>["authSession"];

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  private get authSessionDelegate(): AuthSessionDelegate {
    return (this.prisma as PrismaService & { authSession: AuthSessionDelegate })
      .authSession;
  }

  async register(dto: RegisterDto) {
    const email = this.normalizeEmail(dto.email);
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      throw new ConflictException("Email already in use");
    }

    const passwordHash = await hash(dto.password, PASSWORD_HASH_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        passwordHash
      },
      select: this.publicUserSelect
    });

    const tokens = await this.createSessionAndTokens(user.id, user.email);

    return {
      user,
      ...tokens
    };
  }

  async login(dto: LoginDto) {
    const email = this.normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true
      }
    });

    if (!user) {
      throw this.invalidCredentialsError();
    }

    const passwordMatches = await compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw this.invalidCredentialsError();
    }

    const tokens = await this.createSessionAndTokens(user.id, user.email);

    return {
      user: this.toPublicUser(user),
      ...tokens
    };
  }

  async refresh(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);

    if (!payload) {
      throw this.invalidRefreshTokenError();
    }

    const session = await this.authSessionDelegate.findUnique({
      where: { id: payload.sessionId },
      select: {
        id: true,
        userId: true,
        refreshTokenHash: true,
        expiresAt: true,
        revokedAt: true,
        user: {
          select: {
            email: true
          }
        }
      }
    });

    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now()
    ) {
      throw this.invalidRefreshTokenError();
    }

    const refreshTokenMatches = await compare(
      refreshToken,
      session.refreshTokenHash
    );

    if (!refreshTokenMatches) {
      throw this.invalidRefreshTokenError();
    }

    const tokens = await this.rotateSessionTokens(
      session.id,
      session.userId,
      session.user.email
    );

    return tokens;
  }

  async logout(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken, true);

    if (!payload) {
      return { success: true };
    }

    const session = await this.authSessionDelegate.findUnique({
      where: { id: payload.sessionId },
      select: {
        id: true,
        userId: true,
        refreshTokenHash: true,
        revokedAt: true
      }
    });

    if (!session || session.userId !== payload.sub) {
      return { success: true };
    }

    const refreshTokenMatches = await compare(
      refreshToken,
      session.refreshTokenHash
    ).catch(() => false);

    if (!refreshTokenMatches || session.revokedAt) {
      return { success: true };
    }

    await this.authSessionDelegate.update({
      where: { id: session.id },
      data: {
        revokedAt: new Date()
      }
    });

    return { success: true };
  }

  private get publicUserSelect() {
    return {
      id: true,
      name: true,
      email: true
    } as const;
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private toPublicUser(user: {
    id: string;
    name: string;
    email: string;
  }): AuthenticatedUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email
    };
  }

  private invalidCredentialsError() {
    return new UnauthorizedException("Invalid authentication credentials");
  }

  private invalidRefreshTokenError() {
    return new UnauthorizedException("Invalid authentication credentials");
  }

  private async createSessionAndTokens(userId: string, email: string) {
    const session = await this.authSessionDelegate.create({
      data: {
        userId,
        refreshTokenHash: "pending",
        expiresAt: new Date()
      },
      select: { id: true }
    });

    const tokens = await this.issueTokens(userId, email, session.id);

    await this.authSessionDelegate.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: tokens.refreshTokenHash,
        expiresAt: tokens.refreshTokenExpiresAt,
        revokedAt: null
      }
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  private async rotateSessionTokens(
    sessionId: string,
    userId: string,
    email: string
  ) {
    const tokens = await this.issueTokens(userId, email, sessionId);

    await this.authSessionDelegate.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: tokens.refreshTokenHash,
        expiresAt: tokens.refreshTokenExpiresAt,
        revokedAt: null
      }
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  private async issueTokens(userId: string, email: string, sessionId: string) {
    const jwtConfig = getJwtConfig();
    const accessPayload: AccessTokenPayload = {
      sub: userId,
      email,
      type: "access"
    };
    const refreshPayload: RefreshTokenPayload = {
      sub: userId,
      sessionId,
      nonce: randomUUID(),
      type: "refresh"
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: jwtConfig.secret,
        expiresIn: jwtConfig.accessTokenExpiresIn as never
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: jwtConfig.secret,
        expiresIn: jwtConfig.refreshTokenExpiresIn as never
      })
    ]);

    const decodedRefreshToken = this.jwtService.decode(refreshToken) as
      | { exp?: number }
      | null;

    if (!decodedRefreshToken?.exp) {
      throw new InternalServerErrorException(
        "Failed to issue authentication tokens"
      );
    }

    const refreshTokenHash = await hash(
      refreshToken,
      REFRESH_TOKEN_HASH_ROUNDS
    );

    return {
      accessToken,
      refreshToken,
      refreshTokenHash,
      refreshTokenExpiresAt: new Date(decodedRefreshToken.exp * 1000)
    };
  }

  private async verifyRefreshToken(
    refreshToken: string,
    allowExpired = false
  ): Promise<RefreshTokenPayload | null> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: getJwtConfig().secret,
          ignoreExpiration: allowExpired
        }
      );

      if (payload.type !== "refresh") {
        throw this.invalidRefreshTokenError();
      }

      return payload;
    } catch {
      if (allowExpired) {
        return null;
      }

      throw this.invalidRefreshTokenError();
    }
  }
}
