import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  Controller,
  Get,
  Module,
  UseGuards,
  type INestApplication
} from "@nestjs/common";
import request from "supertest";

import { PrismaService } from "../database/prisma.service.js";
import { Role } from "../generated/prisma/enums.js";
import {
  bootstrapTestApp,
  closeTestApp,
  createOrganizationForUser,
  createUserAndToken,
  resetDatabase,
  uniqueSuffix
} from "../testing/test-helpers.js";
import { AuthModule } from "./auth.module.js";
import { CurrentOrganizationContext } from "./decorators/current-organization-context.decorator.js";
import { CurrentUser } from "./decorators/current-user.decorator.js";
import { Roles } from "./decorators/roles.decorator.js";
import { JwtAuthGuard } from "./guards/jwt-auth.guard.js";
import { OrganizationContextGuard } from "./guards/organization-context.guard.js";
import { RolesGuard } from "./guards/roles.guard.js";
import type { AuthenticatedUser } from "./types/authenticated-user.interface.js";
import type { OrganizationContext } from "./types/organization-context.interface.js";

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

  @Get("manage-organization")
  @Roles(Role.OWNER, Role.ADMIN)
  @UseGuards(OrganizationContextGuard, RolesGuard)
  manageOrganization(
    @CurrentOrganizationContext() context: OrganizationContext
  ) {
    return {
      organizationId: context.organizationId,
      role: context.role
    };
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

before(async () => {
  const testContext = await bootstrapTestApp([AuthorizationTestModule]);
  app = testContext.app;
  prisma = testContext.prisma;
});

beforeEach(async () => {
  await resetDatabase(prisma);
});

after(async () => {
  await closeTestApp(app);
});

test("JwtAuthGuard blocks access to protected endpoints without a token", async () => {
  const response = await request(app.getHttpServer())
    .get("/authorization-test/current-user")
    .expect(401);

  assert.equal(response.body.message, "Invalid authentication credentials");
});

test("CurrentUser decorator exposes the authenticated user in controllers", async () => {
  const email = `current-user.${Date.now()}@authorization.test`;
  const { accessToken } = await createUserAndToken(app, email);

  const response = await request(app.getHttpServer())
    .get("/authorization-test/current-user")
    .set("Authorization", `Bearer ${accessToken}`)
    .expect(200);

  assert.equal(response.body.email, email);
  assert.equal(response.body.name, `User ${email}`);
});

test("OrganizationContextGuard resolves membership from X-Organization-Id", async () => {
  const user = await createUserAndToken(
    app,
    `context.${Date.now()}@authorization.test`
  );
  const organization = await createOrganizationForUser({
    prisma,
    userId: user.user.id,
    name: "Authorization Context",
    slug: `authorization-test-context-${uniqueSuffix()}`,
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

test("OrganizationContextGuard blocks cross-tenant access when the user has no membership", async () => {
  const userA = await createUserAndToken(
    app,
    `tenant-a.${Date.now()}@authorization.test`
  );
  const userB = await createUserAndToken(
    app,
    `tenant-b.${Date.now()}@authorization.test`
  );
  const organizationB = await createOrganizationForUser({
    prisma,
    userId: userB.user.id,
    name: "Tenant B Organization",
    slug: `authorization-test-cross-tenant-${uniqueSuffix()}`
  });

  const response = await request(app.getHttpServer())
    .get("/authorization-test/organization-context")
    .set("Authorization", `Bearer ${userA.accessToken}`)
    .set("X-Organization-Id", organizationB.id)
    .expect(403);

  assert.equal(response.body.message, "Organization access denied");
});

test("RolesGuard allows OWNER and ADMIN to access management endpoints", async () => {
  const owner = await createUserAndToken(
    app,
    `owner.${Date.now()}@authorization.test`
  );
  const admin = await createUserAndToken(
    app,
    `admin.${Date.now()}@authorization.test`
  );

  const ownerOrganization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Authorization Owner",
    slug: `authorization-test-owner-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const adminOrganization = await createOrganizationForUser({
    prisma,
    userId: admin.user.id,
    name: "Authorization Admin",
    slug: `authorization-test-admin-${uniqueSuffix()}`,
    role: Role.ADMIN
  });

  const ownerResponse = await request(app.getHttpServer())
    .get("/authorization-test/manage-organization")
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", ownerOrganization.id)
    .expect(200);

  const adminResponse = await request(app.getHttpServer())
    .get("/authorization-test/manage-organization")
    .set("Authorization", `Bearer ${admin.accessToken}`)
    .set("X-Organization-Id", adminOrganization.id)
    .expect(200);

  assert.equal(ownerResponse.body.role, Role.OWNER);
  assert.equal(adminResponse.body.role, Role.ADMIN);
});

test("RolesGuard blocks access without context and for insufficient roles", async () => {
  const student = await createUserAndToken(
    app,
    `student.${Date.now()}@authorization.test`
  );
  const organization = await createOrganizationForUser({
    prisma,
    userId: student.user.id,
    name: "Authorization Student",
    slug: `authorization-test-student-${uniqueSuffix()}`,
    role: Role.STUDENT
  });

  const missingContextResponse = await request(app.getHttpServer())
    .get("/authorization-test/role-without-context")
    .set("Authorization", `Bearer ${student.accessToken}`)
    .expect(403);

  assert.equal(
    missingContextResponse.body.message,
    "Organization context is required"
  );

  const insufficientRoleResponse = await request(app.getHttpServer())
    .get("/authorization-test/owner-only")
    .set("Authorization", `Bearer ${student.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(403);

  assert.equal(
    insufficientRoleResponse.body.message,
    "Insufficient organization role"
  );
});
