import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  Controller,
  Get,
  Module,
  UseGuards,
  type INestApplication
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";

import type { AppModule as AppModuleType } from "../app.module.js";
import { AuthModule } from "./auth.module.js";
import { PrismaService } from "../database/prisma.service.js";
import { Role } from "../generated/prisma/enums.js";
import { CurrentOrganizationContext } from "./decorators/current-organization-context.decorator.js";
import { CurrentUser } from "./decorators/current-user.decorator.js";
import { Roles } from "./decorators/roles.decorator.js";
import { JwtAuthGuard } from "./guards/jwt-auth.guard.js";
import { OrganizationContextGuard } from "./guards/organization-context.guard.js";
import { RolesGuard } from "./guards/roles.guard.js";
import type { AuthenticatedUser } from "./types/authenticated-user.interface.js";
import type { OrganizationContext } from "./types/organization-context.interface.js";

process.env.NODE_ENV = "test";
process.env.PORT = "4001";
process.env.DATABASE_URL ??= "postgresql://eduflow:eduflow@localhost:5432/eduflow";
process.env.REDIS_URL ??= "redis://localhost:6379";
process.env.JWT_SECRET ??= "test-secret";
process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ??= "1h";
process.env.JWT_REFRESH_TOKEN_EXPIRES_IN ??= "30d";
process.env.S3_ENDPOINT ??= "http://localhost:9000";
process.env.S3_ACCESS_KEY ??= "eduflow";
process.env.S3_SECRET_KEY ??= "eduflow123";

@Controller("authorization-test")
@UseGuards(JwtAuthGuard)
class AuthorizationTestController {
  @Get("current-user")
  currentUser(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Get("organization-context")
  @UseGuards(OrganizationContextGuard)
  currentOrganization(
    @CurrentOrganizationContext() context: OrganizationContext
  ) {
    return context;
  }

  @Get("owner-only")
  @Roles(Role.OWNER)
  @UseGuards(OrganizationContextGuard, RolesGuard)
  ownerOnly(@CurrentOrganizationContext() context: OrganizationContext) {
    return {
      organizationId: context.organizationId,
      role: context.role
    };
  }

  @Get("role-without-context")
  @Roles(Role.OWNER)
  @UseGuards(RolesGuard)
  roleWithoutContext() {
    return { ok: true };
  }
}

@Module({
  imports: [AuthModule],
  controllers: [AuthorizationTestController]
})
class AuthorizationTestModule {}

let app: INestApplication;
let prisma: PrismaService;

async function createUserAndToken(email: string) {
  const response = await request(app.getHttpServer())
    .post("/auth/register")
    .send({
      name: `User ${email}`,
      email,
      password: "strong-password"
    })
    .expect(201);

  return {
    user: response.body.user as { id: string; email: string; name: string },
    accessToken: response.body.accessToken as string
  };
}

async function createOrganizationForUser(params: {
  userId: string;
  name: string;
  slug: string;
  role: Role;
}) {
  const organization = await prisma.organization.create({
    data: {
      name: params.name,
      slug: params.slug
    },
    select: {
      id: true,
      slug: true
    }
  });

  await prisma.membership.create({
    data: {
      userId: params.userId,
      organizationId: organization.id,
      role: params.role
    }
  });

  return organization;
}

async function cleanupAuthorizationFixtures() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        endsWith: "@authorization.test"
      }
    },
    select: {
      id: true
    }
  });
  const organizations = await prisma.organization.findMany({
    where: {
      slug: {
        contains: "authorization-test"
      }
    },
    select: {
      id: true
    }
  });
  const userIds = users.map(({ id }) => id);
  const organizationIds = organizations.map(({ id }) => id);

  if (userIds.length > 0 || organizationIds.length > 0) {
    await prisma.membership.deleteMany({
      where: {
        OR: [
          {
            userId: {
              in: userIds
            }
          },
          {
            organizationId: {
              in: organizationIds
            }
          }
        ]
      }
    });
  }

  if (organizationIds.length > 0) {
    await prisma.organization.deleteMany({
      where: {
        id: {
          in: organizationIds
        }
      }
    });
  }

  if (userIds.length > 0) {
    await prisma.authSession.deleteMany({
      where: {
        userId: {
          in: userIds
        }
      }
    });
  }

  await prisma.user.deleteMany({
    where: {
      email: {
        endsWith: "@authorization.test"
      }
    }
  });
}

before(async () => {
  const { AppModule } = (await import("../app.module.js")) as {
    AppModule: typeof AppModuleType;
  };

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule, AuthorizationTestModule]
  }).compile();

  app = moduleRef.createNestApplication();
  await app.init();

  prisma = app.get(PrismaService);
});

beforeEach(async () => {
  await cleanupAuthorizationFixtures();
});

after(async () => {
  await cleanupAuthorizationFixtures();
  await app.close();
});

test("CurrentUser decorator exposes the authenticated user in controllers", async () => {
  const email = `current-user.${Date.now()}@authorization.test`;
  const { accessToken } = await createUserAndToken(email);

  const response = await request(app.getHttpServer())
    .get("/authorization-test/current-user")
    .set("Authorization", `Bearer ${accessToken}`)
    .expect(200);

  assert.equal(response.body.email, email);
  assert.equal(response.body.name, `User ${email}`);
});

test("OrganizationContextGuard resolves membership from X-Organization-Id", async () => {
  const user = await createUserAndToken(
    `context.${Date.now()}@authorization.test`
  );
  const organization = await createOrganizationForUser({
    userId: user.user.id,
    name: "Authorization Context",
    slug: "authorization-test-context",
    role: Role.MANAGER
  });

  const response = await request(app.getHttpServer())
    .get("/authorization-test/organization-context")
    .set("Authorization", `Bearer ${user.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(200);

  assert.equal(response.body.organizationId, organization.id);
  assert.equal(response.body.role, Role.MANAGER);
  assert.equal(typeof response.body.membershipId, "string");
});

test("RolesGuard allows access for an allowed role and blocks access without context", async () => {
  const owner = await createUserAndToken(
    `owner.${Date.now()}@authorization.test`
  );
  const organization = await createOrganizationForUser({
    userId: owner.user.id,
    name: "Authorization Owner",
    slug: "authorization-test-owner",
    role: Role.OWNER
  });

  const allowedResponse = await request(app.getHttpServer())
    .get("/authorization-test/owner-only")
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(200);

  assert.equal(allowedResponse.body.organizationId, organization.id);
  assert.equal(allowedResponse.body.role, Role.OWNER);

  const missingContextResponse = await request(app.getHttpServer())
    .get("/authorization-test/role-without-context")
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .expect(403);

  assert.equal(
    missingContextResponse.body.message,
    "Organization context is required"
  );
});

test("RolesGuard blocks access for an insufficient role", async () => {
  const student = await createUserAndToken(
    `student.${Date.now()}@authorization.test`
  );
  const organization = await createOrganizationForUser({
    userId: student.user.id,
    name: "Authorization Student",
    slug: "authorization-test-student",
    role: Role.STUDENT
  });

  const response = await request(app.getHttpServer())
    .get("/authorization-test/owner-only")
    .set("Authorization", `Bearer ${student.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(403);

  assert.equal(response.body.message, "Insufficient organization role");
});
