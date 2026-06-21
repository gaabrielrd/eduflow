import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import type { AppModule as AppModuleType } from "../app.module.js";
import { PrismaService } from "../database/prisma.service.js";
import { Role } from "../generated/prisma/enums.js";

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
  role?: Role;
}) {
  const organization = await prisma.organization.create({
    data: {
      name: params.name,
      slug: params.slug
    },
    select: {
      id: true,
      name: true,
      slug: true
    }
  });

  await prisma.membership.create({
    data: {
      userId: params.userId,
      organizationId: organization.id,
      role: params.role ?? Role.OWNER
    }
  });

  return organization;
}

async function cleanupOrganizationFixtures() {
  await prisma.membership.deleteMany({
    where: {
      OR: [
        {
          user: {
            email: {
              endsWith: "@organizations.test"
            }
          }
        },
        {
          organization: {
            slug: {
              contains: "organizations-test"
            }
          }
        }
      ]
    }
  });

  await prisma.organization.deleteMany({
    where: {
      slug: {
        contains: "organizations-test"
      }
    }
  });

  await prisma.authSession.deleteMany({
    where: {
      user: {
        email: {
          endsWith: "@organizations.test"
        }
      }
    }
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        endsWith: "@organizations.test"
      }
    }
  });
}

before(async () => {
  const { AppModule } = (await import("../app.module.js")) as {
    AppModule: typeof AppModuleType;
  };

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule]
  }).compile();

  app = moduleRef.createNestApplication();
  await app.init();

  prisma = app.get(PrismaService);
});

beforeEach(async () => {
  await cleanupOrganizationFixtures();
});

after(async () => {
  await cleanupOrganizationFixtures();
  await app.close();
});

test("POST /organizations creates an organization, normalizes slug and assigns OWNER membership", async () => {
  const email = `create.${Date.now()}@organizations.test`;
  const { user, accessToken } = await createUserAndToken(email);

  const response = await request(app.getHttpServer())
    .post("/organizations")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "EduFlow Demo",
      slug: "  EduFlow   Demo__Org  "
    })
    .expect(201);

  assert.equal(response.body.name, "EduFlow Demo");
  assert.equal(response.body.slug, "eduflow-demo-org");
  assert.equal(response.body.role, Role.OWNER);

  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: response.body.id
      }
    }
  });

  assert.ok(membership);
  assert.equal(membership.role, Role.OWNER);
});

test("POST /organizations rejects duplicated slug", async () => {
  const firstUser = await createUserAndToken(
    `dup-a.${Date.now()}@organizations.test`
  );
  const secondUser = await createUserAndToken(
    `dup-b.${Date.now()}@organizations.test`
  );

  await request(app.getHttpServer())
    .post("/organizations")
    .set("Authorization", `Bearer ${firstUser.accessToken}`)
    .send({
      name: "Org A",
      slug: "organizations-test-duplicate"
    })
    .expect(201);

  const duplicateResponse = await request(app.getHttpServer())
    .post("/organizations")
    .set("Authorization", `Bearer ${secondUser.accessToken}`)
    .send({
      name: "Org B",
      slug: " Organizations Test Duplicate "
    })
    .expect(409);

  assert.equal(duplicateResponse.body.message, "Slug already in use");
});

test("GET /organizations lists only organizations where the user has membership", async () => {
  const primaryUser = await createUserAndToken(
    `list-a.${Date.now()}@organizations.test`
  );
  const secondaryUser = await createUserAndToken(
    `list-b.${Date.now()}@organizations.test`
  );

  await createOrganizationForUser({
    userId: primaryUser.user.id,
    name: "List A",
    slug: "organizations-test-list-a",
    role: Role.ADMIN
  });
  await createOrganizationForUser({
    userId: secondaryUser.user.id,
    name: "List B",
    slug: "organizations-test-list-b"
  });

  const response = await request(app.getHttpServer())
    .get("/organizations")
    .set("Authorization", `Bearer ${primaryUser.accessToken}`)
    .expect(200);

  assert.equal(response.body.length, 1);
  assert.equal(response.body[0].slug, "organizations-test-list-a");
  assert.equal(response.body[0].role, Role.ADMIN);
});

test("GET /organizations/current returns 403 without X-Organization-Id", async () => {
  const { accessToken } = await createUserAndToken(
    `current-missing.${Date.now()}@organizations.test`
  );

  const response = await request(app.getHttpServer())
    .get("/organizations/current")
    .set("Authorization", `Bearer ${accessToken}`)
    .expect(403);

  assert.equal(response.body.message, "Organization context is required");
});

test("GET /organizations/current returns 403 when the user has no membership in the selected organization", async () => {
  const firstUser = await createUserAndToken(
    `current-a.${Date.now()}@organizations.test`
  );
  const secondUser = await createUserAndToken(
    `current-b.${Date.now()}@organizations.test`
  );

  const foreignOrganization = await createOrganizationForUser({
    userId: secondUser.user.id,
    name: "Foreign Org",
    slug: "organizations-test-foreign"
  });

  const response = await request(app.getHttpServer())
    .get("/organizations/current")
    .set("Authorization", `Bearer ${firstUser.accessToken}`)
    .set("X-Organization-Id", foreignOrganization.id)
    .expect(403);

  assert.equal(response.body.message, "Organization access denied");
});

test("GET /organizations/current returns the selected organization for a valid membership", async () => {
  const user = await createUserAndToken(
    `current-ok.${Date.now()}@organizations.test`
  );
  const organization = await createOrganizationForUser({
    userId: user.user.id,
    name: "Current Org",
    slug: "organizations-test-current-ok",
    role: Role.MANAGER
  });

  const response = await request(app.getHttpServer())
    .get("/organizations/current")
    .set("Authorization", `Bearer ${user.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(200);

  assert.equal(response.body.id, organization.id);
  assert.equal(response.body.slug, "organizations-test-current-ok");
  assert.equal(response.body.role, Role.MANAGER);
});

test("PATCH /organizations/current updates name and slug for OWNER and ADMIN", async () => {
  const ownerUser = await createUserAndToken(
    `patch-owner.${Date.now()}@organizations.test`
  );
  const adminUser = await createUserAndToken(
    `patch-admin.${Date.now()}@organizations.test`
  );

  const ownerOrganization = await createOrganizationForUser({
    userId: ownerUser.user.id,
    name: "Owner Org",
    slug: "organizations-test-patch-owner",
    role: Role.OWNER
  });
  const adminOrganization = await createOrganizationForUser({
    userId: adminUser.user.id,
    name: "Admin Org",
    slug: "organizations-test-patch-admin",
    role: Role.ADMIN
  });

  const ownerResponse = await request(app.getHttpServer())
    .patch("/organizations/current")
    .set("Authorization", `Bearer ${ownerUser.accessToken}`)
    .set("X-Organization-Id", ownerOrganization.id)
    .send({
      name: "Owner Org Updated",
      slug: "Owner Org Updated"
    })
    .expect(200);

  const adminResponse = await request(app.getHttpServer())
    .patch("/organizations/current")
    .set("Authorization", `Bearer ${adminUser.accessToken}`)
    .set("X-Organization-Id", adminOrganization.id)
    .send({
      name: "Admin Org Updated"
    })
    .expect(200);

  assert.equal(ownerResponse.body.name, "Owner Org Updated");
  assert.equal(ownerResponse.body.slug, "owner-org-updated");
  assert.equal(adminResponse.body.name, "Admin Org Updated");
  assert.equal(adminResponse.body.slug, "organizations-test-patch-admin");
});

test("PATCH /organizations/current returns 403 for roles without organization update permission", async () => {
  const user = await createUserAndToken(
    `patch-forbidden.${Date.now()}@organizations.test`
  );
  const organization = await createOrganizationForUser({
    userId: user.user.id,
    name: "Forbidden Org",
    slug: "organizations-test-patch-forbidden",
    role: Role.STUDENT
  });

  const response = await request(app.getHttpServer())
    .patch("/organizations/current")
    .set("Authorization", `Bearer ${user.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      name: "Should Not Update"
    })
    .expect(403);

  assert.equal(response.body.message, "Insufficient organization role");
});

test("GET /organizations/current/members returns only memberships from the current organization", async () => {
  const owner = await createUserAndToken(
    `members-owner.${Date.now()}@organizations.test`
  );
  const teammate = await createUserAndToken(
    `members-team.${Date.now()}@organizations.test`
  );
  const outsider = await createUserAndToken(
    `members-outsider.${Date.now()}@organizations.test`
  );

  const currentOrganization = await createOrganizationForUser({
    userId: owner.user.id,
    name: "Members Org",
    slug: "organizations-test-members-current",
    role: Role.OWNER
  });

  await prisma.membership.create({
    data: {
      userId: teammate.user.id,
      organizationId: currentOrganization.id,
      role: Role.ADMIN
    }
  });

  await createOrganizationForUser({
    userId: outsider.user.id,
    name: "Other Org",
    slug: "organizations-test-members-other",
    role: Role.OWNER
  });

  const response = await request(app.getHttpServer())
    .get("/organizations/current/members")
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", currentOrganization.id)
    .expect(200);

  assert.equal(response.body.length, 2);
  assert.deepEqual(
    response.body.map(
      (member: { user: { email: string }; role: Role }) => member.user.email
    ).sort(),
    [owner.user.email, teammate.user.email].sort()
  );
  assert.equal(
    response.body.some(
      (member: { user: { email: string } }) =>
        member.user.email === outsider.user.email
    ),
    false
  );
});
