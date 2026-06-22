import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";

import type { INestApplication } from "@nestjs/common";
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

let app: INestApplication;
let prisma: PrismaService;

before(async () => {
  const testContext = await bootstrapTestApp();
  app = testContext.app;
  prisma = testContext.prisma;
});

beforeEach(async () => {
  await resetDatabase(prisma);
});

after(async () => {
  await closeTestApp(app);
});

test("POST /organizations creates an organization, normalizes slug and assigns OWNER membership", async () => {
  const email = `create.${Date.now()}@organizations.test`;
  const { user, accessToken } = await createUserAndToken(app, email);
  const slugSuffix = uniqueSuffix();

  const response = await request(app.getHttpServer())
    .post("/organizations")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "EduFlow Demo",
      slug: `  Organizations Test Demo__Org ${slugSuffix}  `
    })
    .expect(201);

  assert.equal(response.body.name, "EduFlow Demo");
  assert.equal(
    response.body.slug,
    `organizations-test-demo-org-${slugSuffix}`
  );
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
    app,
    `dup-a.${Date.now()}@organizations.test`
  );
  const secondUser = await createUserAndToken(
    app,
    `dup-b.${Date.now()}@organizations.test`
  );
  const slugSuffix = uniqueSuffix();
  const duplicateSlug = `organizations-test-duplicate-${slugSuffix}`;

  await request(app.getHttpServer())
    .post("/organizations")
    .set("Authorization", `Bearer ${firstUser.accessToken}`)
    .send({
      name: "Org A",
      slug: duplicateSlug
    })
    .expect(201);

  const duplicateResponse = await request(app.getHttpServer())
    .post("/organizations")
    .set("Authorization", `Bearer ${secondUser.accessToken}`)
    .send({
      name: "Org B",
      slug: ` Organizations Test Duplicate ${slugSuffix} `
    })
    .expect(409);

  assert.equal(duplicateResponse.body.message, "Slug already in use");
});

test("GET /organizations lists only organizations where the user has membership", async () => {
  const primaryUser = await createUserAndToken(
    app,
    `list-a.${Date.now()}@organizations.test`
  );
  const secondaryUser = await createUserAndToken(
    app,
    `list-b.${Date.now()}@organizations.test`
  );

  const primarySlug = `organizations-test-list-a-${uniqueSuffix()}`;
  const secondarySlug = `organizations-test-list-b-${uniqueSuffix()}`;

  await createOrganizationForUser({
    prisma,
    userId: primaryUser.user.id,
    name: "List A",
    slug: primarySlug,
    role: Role.ADMIN
  });
  await createOrganizationForUser({
    prisma,
    userId: secondaryUser.user.id,
    name: "List B",
    slug: secondarySlug
  });

  const response = await request(app.getHttpServer())
    .get("/organizations")
    .set("Authorization", `Bearer ${primaryUser.accessToken}`)
    .expect(200);

  assert.equal(response.body.length, 1);
  assert.equal(response.body[0].slug, primarySlug);
  assert.equal(response.body[0].role, Role.ADMIN);
});

test("GET /organizations/current returns 403 without X-Organization-Id", async () => {
  const { accessToken } = await createUserAndToken(
    app,
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
    app,
    `current-a.${Date.now()}@organizations.test`
  );
  const secondUser = await createUserAndToken(
    app,
    `current-b.${Date.now()}@organizations.test`
  );

  const foreignOrganization = await createOrganizationForUser({
    prisma,
    userId: secondUser.user.id,
    name: "Foreign Org",
    slug: `organizations-test-foreign-${uniqueSuffix()}`
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
    app,
    `current-ok.${Date.now()}@organizations.test`
  );
  const organization = await createOrganizationForUser({
    prisma,
    userId: user.user.id,
    name: "Current Org",
    slug: `organizations-test-current-ok-${uniqueSuffix()}`,
    role: Role.MANAGER
  });

  const response = await request(app.getHttpServer())
    .get("/organizations/current")
    .set("Authorization", `Bearer ${user.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(200);

  assert.equal(response.body.id, organization.id);
  assert.equal(response.body.slug, organization.slug);
  assert.equal(response.body.role, Role.MANAGER);
});

test("PATCH /organizations/current updates name and slug for OWNER and ADMIN", async () => {
  const ownerUser = await createUserAndToken(
    app,
    `patch-owner.${Date.now()}@organizations.test`
  );
  const adminUser = await createUserAndToken(
    app,
    `patch-admin.${Date.now()}@organizations.test`
  );

  const ownerSlug = `organizations-test-patch-owner-${uniqueSuffix()}`;
  const adminSlug = `organizations-test-patch-admin-${uniqueSuffix()}`;
  const updatedOwnerSlugSuffix = uniqueSuffix();

  const ownerOrganization = await createOrganizationForUser({
    prisma,
    userId: ownerUser.user.id,
    name: "Owner Org",
    slug: ownerSlug,
    role: Role.OWNER
  });
  const adminOrganization = await createOrganizationForUser({
    prisma,
    userId: adminUser.user.id,
    name: "Admin Org",
    slug: adminSlug,
    role: Role.ADMIN
  });

  const ownerResponse = await request(app.getHttpServer())
    .patch("/organizations/current")
    .set("Authorization", `Bearer ${ownerUser.accessToken}`)
    .set("X-Organization-Id", ownerOrganization.id)
    .send({
      name: "Owner Org Updated",
      slug: `Organizations Test Owner Org Updated ${updatedOwnerSlugSuffix}`
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
  assert.equal(
    ownerResponse.body.slug,
    `organizations-test-owner-org-updated-${updatedOwnerSlugSuffix}`
  );
  assert.equal(adminResponse.body.name, "Admin Org Updated");
  assert.equal(adminResponse.body.slug, adminSlug);
});

test("PATCH /organizations/current returns 403 for roles without organization update permission", async () => {
  const user = await createUserAndToken(
    app,
    `patch-forbidden.${Date.now()}@organizations.test`
  );
  const organization = await createOrganizationForUser({
    prisma,
    userId: user.user.id,
    name: "Forbidden Org",
    slug: `organizations-test-patch-forbidden-${uniqueSuffix()}`,
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
    app,
    `members-owner.${Date.now()}@organizations.test`
  );
  const teammate = await createUserAndToken(
    app,
    `members-team.${Date.now()}@organizations.test`
  );
  const outsider = await createUserAndToken(
    app,
    `members-outsider.${Date.now()}@organizations.test`
  );

  const currentOrganizationSlug = `organizations-test-members-current-${uniqueSuffix()}`;

  const currentOrganization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Members Org",
    slug: currentOrganizationSlug,
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
    prisma,
    userId: outsider.user.id,
    name: "Other Org",
    slug: `organizations-test-members-other-${uniqueSuffix()}`,
    role: Role.OWNER
  });

  const response = await request(app.getHttpServer())
    .get("/organizations/current/members")
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", currentOrganization.id)
    .expect(200);

  assert.equal(response.body.length, 2);
  assert.deepEqual(
    response.body
      .map((member: { user: { email: string }; role: Role }) => member.user.email)
      .sort(),
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

test("GET /organizations/current/members returns 403 for non-admin roles", async () => {
  const user = await createUserAndToken(
    app,
    `members-forbidden.${Date.now()}@organizations.test`
  );
  const organization = await createOrganizationForUser({
    prisma,
    userId: user.user.id,
    name: "Members Forbidden Org",
    slug: `members-forbidden-${uniqueSuffix()}`,
    role: Role.STUDENT
  });

  const response = await request(app.getHttpServer())
    .get("/organizations/current/members")
    .set("Authorization", `Bearer ${user.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(403);

  assert.equal(response.body.message, "Insufficient organization role");
});

test("POST /organizations/current/invitations creates an invitation for OWNER and ADMIN", async () => {
  const owner = await createUserAndToken(
    app,
    `invite-create-owner.${Date.now()}@organizations.test`
  );
  const admin = await createUserAndToken(
    app,
    `invite-create-admin.${Date.now()}@organizations.test`
  );

  const ownerOrganization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Owner Invite Org",
    slug: `owner-invite-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const adminOrganization = await createOrganizationForUser({
    prisma,
    userId: admin.user.id,
    name: "Admin Invite Org",
    slug: `admin-invite-org-${uniqueSuffix()}`,
    role: Role.ADMIN
  });

  const ownerResponse = await request(app.getHttpServer())
    .post("/organizations/current/invitations")
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", ownerOrganization.id)
    .send({
      email: "Owner.Invited@Example.com",
      role: Role.MANAGER
    })
    .expect(201);

  const adminResponse = await request(app.getHttpServer())
    .post("/organizations/current/invitations")
    .set("Authorization", `Bearer ${admin.accessToken}`)
    .set("X-Organization-Id", adminOrganization.id)
    .send({
      email: "admin.invited@example.com",
      role: Role.STUDENT
    })
    .expect(201);

  assert.equal(ownerResponse.body.email, "owner.invited@example.com");
  assert.equal(ownerResponse.body.role, Role.MANAGER);
  assert.equal(ownerResponse.body.status, "pending");
  assert.equal(typeof ownerResponse.body.token, "string");
  assert.equal(typeof ownerResponse.body.expiresAt, "string");
  assert.equal(ownerResponse.body.inviteUrl, `/invite/${ownerResponse.body.token}`);

  assert.equal(adminResponse.body.role, Role.STUDENT);

  const persistedInvitation = await prisma.invitation.findUnique({
    where: {
      token: ownerResponse.body.token
    }
  });

  assert.ok(persistedInvitation);
  assert.equal(persistedInvitation.email, "owner.invited@example.com");
});

test("POST /organizations/current/invitations returns 403 for roles without invitation permission", async () => {
  const user = await createUserAndToken(
    app,
    `invite-forbidden.${Date.now()}@organizations.test`
  );
  const organization = await createOrganizationForUser({
    prisma,
    userId: user.user.id,
    name: "Invite Forbidden Org",
    slug: `invite-forbidden-${uniqueSuffix()}`,
    role: Role.STUDENT
  });

  const response = await request(app.getHttpServer())
    .post("/organizations/current/invitations")
    .set("Authorization", `Bearer ${user.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      email: "person@example.com",
      role: Role.STUDENT
    })
    .expect(403);

  assert.equal(response.body.message, "Insufficient organization role");
});

test("POST /organizations/current/invitations rejects OWNER as an invitation role", async () => {
  const owner = await createUserAndToken(
    app,
    `invite-owner-role.${Date.now()}@organizations.test`
  );
  const organization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Owner Role Org",
    slug: `owner-role-${uniqueSuffix()}`
  });

  const response = await request(app.getHttpServer())
    .post("/organizations/current/invitations")
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      email: "owner@example.com",
      role: Role.OWNER
    })
    .expect(403);

  assert.equal(response.body.message, "Invitation role is not allowed");
});

test("GET /organizations/current/invitations returns invitations only from the current organization", async () => {
  const owner = await createUserAndToken(
    app,
    `invite-list-owner.${Date.now()}@organizations.test`
  );
  const outsider = await createUserAndToken(
    app,
    `invite-list-outsider.${Date.now()}@organizations.test`
  );

  const currentOrganization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Current Invite Org",
    slug: `current-invite-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const otherOrganization = await createOrganizationForUser({
    prisma,
    userId: outsider.user.id,
    name: "Other Invite Org",
    slug: `other-invite-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });

  await prisma.invitation.create({
    data: {
      email: "current@example.com",
      organizationId: currentOrganization.id,
      role: Role.ADMIN,
      token: `current-invite-${uniqueSuffix()}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    }
  });
  await prisma.invitation.create({
    data: {
      email: "other@example.com",
      organizationId: otherOrganization.id,
      role: Role.STUDENT,
      token: `other-invite-${uniqueSuffix()}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    }
  });

  const response = await request(app.getHttpServer())
    .get("/organizations/current/invitations")
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", currentOrganization.id)
    .expect(200);

  assert.equal(response.body.length, 1);
  assert.equal(response.body[0].email, "current@example.com");
});

test("GET /organizations/current/invitations returns 403 for non-admin roles", async () => {
  const user = await createUserAndToken(
    app,
    `invite-list-forbidden.${Date.now()}@organizations.test`
  );
  const organization = await createOrganizationForUser({
    prisma,
    userId: user.user.id,
    name: "Invite List Forbidden Org",
    slug: `invite-list-forbidden-${uniqueSuffix()}`,
    role: Role.STUDENT
  });

  const response = await request(app.getHttpServer())
    .get("/organizations/current/invitations")
    .set("Authorization", `Bearer ${user.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(403);

  assert.equal(response.body.message, "Insufficient organization role");
});
