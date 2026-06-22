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

test("GET /invitations/:token returns public metadata for a valid invitation", async () => {
  const owner = await createUserAndToken(app, `invite-owner.${Date.now()}@invitations.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Invite Org",
    slug: `invite-org-${uniqueSuffix()}`
  });

  const invitation = await prisma.invitation.create({
    data: {
      email: "person@example.com",
      organizationId: organization.id,
      role: Role.ADMIN,
      token: `token-${uniqueSuffix()}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    }
  });

  const response = await request(app.getHttpServer())
    .get(`/invitations/${invitation.token}`)
    .expect(200);

  assert.equal(response.body.email, "person@example.com");
  assert.equal(response.body.role, Role.ADMIN);
  assert.equal(response.body.status, "pending");
  assert.equal(response.body.organization.name, "Invite Org");
  assert.equal(response.body.inviteUrl, `/invite/${invitation.token}`);
});

test("GET /invitations/:token exposes expired and accepted statuses without leaking extra data", async () => {
  const owner = await createUserAndToken(app, `invite-status-owner.${Date.now()}@invitations.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Invite Status Org",
    slug: `invite-status-org-${uniqueSuffix()}`
  });

  const expiredInvitation = await prisma.invitation.create({
    data: {
      email: "expired@example.com",
      organizationId: organization.id,
      role: Role.STUDENT,
      token: `expired-${uniqueSuffix()}`,
      expiresAt: new Date(Date.now() - 60 * 1000)
    }
  });

  const acceptedInvitation = await prisma.invitation.create({
    data: {
      email: "accepted@example.com",
      organizationId: organization.id,
      role: Role.MANAGER,
      token: `accepted-${uniqueSuffix()}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      acceptedAt: new Date()
    }
  });

  const expiredResponse = await request(app.getHttpServer())
    .get(`/invitations/${expiredInvitation.token}`)
    .expect(200);
  const acceptedResponse = await request(app.getHttpServer())
    .get(`/invitations/${acceptedInvitation.token}`)
    .expect(200);

  assert.equal(expiredResponse.body.status, "expired");
  assert.equal(acceptedResponse.body.status, "accepted");
});

test("GET /invitations/:token returns 404 when the invitation does not exist", async () => {
  const response = await request(app.getHttpServer())
    .get("/invitations/missing-token")
    .expect(404);

  assert.equal(response.body.message, "Invitation not found");
});

test("POST /invitations/:token/accept creates membership and marks invitation as accepted", async () => {
  const owner = await createUserAndToken(app, `accept-owner.${Date.now()}@invitations.test`);
  const invitedUser = await createUserAndToken(app, `accept-user.${Date.now()}@invitations.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Accept Org",
    slug: `accept-org-${uniqueSuffix()}`
  });

  const invitation = await prisma.invitation.create({
    data: {
      email: invitedUser.user.email,
      organizationId: organization.id,
      role: Role.MANAGER,
      token: `accept-${uniqueSuffix()}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    }
  });

  const response = await request(app.getHttpServer())
    .post(`/invitations/${invitation.token}/accept`)
    .set("Authorization", `Bearer ${invitedUser.accessToken}`)
    .expect(201);

  assert.equal(response.body.membership.role, Role.MANAGER);
  assert.equal(response.body.organization.id, organization.id);
  assert.equal(response.body.invitation.status, "accepted");

  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: invitedUser.user.id,
        organizationId: organization.id
      }
    }
  });

  assert.ok(membership);
  assert.equal(membership.role, Role.MANAGER);

  const acceptedInvitation = await prisma.invitation.findUniqueOrThrow({
    where: {
      id: invitation.id
    }
  });

  assert.ok(acceptedInvitation.acceptedAt);
});

test("POST /invitations/:token/accept rejects invitations with a different authenticated email", async () => {
  const owner = await createUserAndToken(app, `mismatch-owner.${Date.now()}@invitations.test`);
  const invitedUser = await createUserAndToken(app, `mismatch-user.${Date.now()}@invitations.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Mismatch Org",
    slug: `mismatch-org-${uniqueSuffix()}`
  });

  const invitation = await prisma.invitation.create({
    data: {
      email: "other@example.com",
      organizationId: organization.id,
      role: Role.ADMIN,
      token: `mismatch-${uniqueSuffix()}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    }
  });

  const response = await request(app.getHttpServer())
    .post(`/invitations/${invitation.token}/accept`)
    .set("Authorization", `Bearer ${invitedUser.accessToken}`)
    .expect(403);

  assert.equal(
    response.body.message,
    "Invitation email does not match the authenticated user"
  );
});

test("POST /invitations/:token/accept rejects expired invitations", async () => {
  const owner = await createUserAndToken(app, `expired-owner.${Date.now()}@invitations.test`);
  const invitedUser = await createUserAndToken(app, `expired-user.${Date.now()}@invitations.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Expired Org",
    slug: `expired-org-${uniqueSuffix()}`
  });

  const invitation = await prisma.invitation.create({
    data: {
      email: invitedUser.user.email,
      organizationId: organization.id,
      role: Role.STUDENT,
      token: `expired-accept-${uniqueSuffix()}`,
      expiresAt: new Date(Date.now() - 60 * 1000)
    }
  });

  const response = await request(app.getHttpServer())
    .post(`/invitations/${invitation.token}/accept`)
    .set("Authorization", `Bearer ${invitedUser.accessToken}`)
    .expect(400);

  assert.equal(response.body.message, "Invitation has expired");
});

test("POST /invitations/:token/accept rejects already accepted invitations", async () => {
  const owner = await createUserAndToken(app, `accepted-owner.${Date.now()}@invitations.test`);
  const invitedUser = await createUserAndToken(app, `accepted-user.${Date.now()}@invitations.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Accepted Org",
    slug: `accepted-org-${uniqueSuffix()}`
  });

  const invitation = await prisma.invitation.create({
    data: {
      email: invitedUser.user.email,
      organizationId: organization.id,
      role: Role.ADMIN,
      token: `already-accepted-${uniqueSuffix()}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      acceptedAt: new Date()
    }
  });

  const response = await request(app.getHttpServer())
    .post(`/invitations/${invitation.token}/accept`)
    .set("Authorization", `Bearer ${invitedUser.accessToken}`)
    .expect(409);

  assert.equal(response.body.message, "Invitation has already been accepted");
});

test("POST /invitations/:token/accept rejects when the user is already a member", async () => {
  const owner = await createUserAndToken(app, `member-owner.${Date.now()}@invitations.test`);
  const invitedUser = await createUserAndToken(app, `member-user.${Date.now()}@invitations.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Member Org",
    slug: `member-org-${uniqueSuffix()}`
  });

  await prisma.membership.create({
    data: {
      userId: invitedUser.user.id,
      organizationId: organization.id,
      role: Role.STUDENT
    }
  });

  const invitation = await prisma.invitation.create({
    data: {
      email: invitedUser.user.email,
      organizationId: organization.id,
      role: Role.MANAGER,
      token: `already-member-${uniqueSuffix()}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    }
  });

  const response = await request(app.getHttpServer())
    .post(`/invitations/${invitation.token}/accept`)
    .set("Authorization", `Bearer ${invitedUser.accessToken}`)
    .expect(409);

  assert.equal(
    response.body.message,
    "User is already a member of this organization"
  );
});
