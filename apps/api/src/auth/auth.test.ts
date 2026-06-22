import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";

import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { PrismaService } from "../database/prisma.service.js";
import {
  bootstrapTestApp,
  closeTestApp,
  createAuthUserPayload,
  resetDatabase
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

test("POST /auth/register creates a user, normalizes email and hashes the password", async () => {
  const email = `Gabriel.${Date.now()}@Auth.Test`;
  const response = await request(app.getHttpServer())
    .post("/auth/register")
    .send(await createAuthUserPayload(email))
    .expect(201);

  assert.equal(response.body.user.name, "Gabriel Roda");
  assert.equal(response.body.user.email, email.trim().toLowerCase());
  assert.equal(typeof response.body.accessToken, "string");
  assert.equal(typeof response.body.refreshToken, "string");
  assert.equal("passwordHash" in response.body.user, false);

  const persistedUser = await prisma.user.findUnique({
    where: {
      email: email.trim().toLowerCase()
    }
  });

  assert.ok(persistedUser);
  assert.notEqual(persistedUser.passwordHash, "strong-password");
});

test("POST /auth/register rejects duplicate email", async () => {
  const email = `duplicate.${Date.now()}@auth.test`;

  await request(app.getHttpServer())
    .post("/auth/register")
    .send(await createAuthUserPayload(email))
    .expect(201);

  const duplicateResponse = await request(app.getHttpServer())
    .post("/auth/register")
    .send(await createAuthUserPayload(email.toUpperCase()))
    .expect(409);

  assert.equal(duplicateResponse.body.message, "Email already in use");
});

test("POST /auth/login returns tokens for valid credentials and a generic error for invalid ones", async () => {
  const email = `gabriel.${Date.now()}@auth.test`;

  await request(app.getHttpServer())
    .post("/auth/register")
    .send(await createAuthUserPayload(email))
    .expect(201);

  const loginResponse = await request(app.getHttpServer())
    .post("/auth/login")
    .send({
      email,
      password: "strong-password"
    })
    .expect(201);

  assert.equal(loginResponse.body.user.email, email);
  assert.equal(typeof loginResponse.body.accessToken, "string");
  assert.equal(typeof loginResponse.body.refreshToken, "string");

  const invalidLoginResponse = await request(app.getHttpServer())
    .post("/auth/login")
    .send({
      email,
      password: "wrong-password"
    })
    .expect(401);

  assert.equal(
    invalidLoginResponse.body.message,
    "Invalid authentication credentials"
  );
});

test("GET /auth/me returns the authenticated session snapshot for a valid access token", async () => {
  const email = `me.${Date.now()}@auth.test`;
  const registerResponse = await request(app.getHttpServer())
    .post("/auth/register")
    .send(await createAuthUserPayload(email))
    .expect(201);

  const meResponse = await request(app.getHttpServer())
    .get("/auth/me")
    .set("Authorization", `Bearer ${registerResponse.body.accessToken}`)
    .expect(200);

  assert.equal(meResponse.body.user.email, email);
  assert.equal(meResponse.body.user.name, "Gabriel Roda");
  assert.deepEqual(meResponse.body.organizations, []);
  assert.equal(meResponse.body.activeOrganizationId, null);
});

test("GET /auth/me returns 401 for missing or invalid access tokens", async () => {
  const missingTokenResponse = await request(app.getHttpServer())
    .get("/auth/me")
    .expect(401);

  assert.equal(
    missingTokenResponse.body.message,
    "Invalid authentication credentials"
  );

  const invalidTokenResponse = await request(app.getHttpServer())
    .get("/auth/me")
    .set("Authorization", "Bearer invalid-token")
    .expect(401);

  assert.equal(
    invalidTokenResponse.body.message,
    "Invalid authentication credentials"
  );
});

test("POST /auth/refresh rotates tokens and POST /auth/logout invalidates the session", async () => {
  const email = `refresh.${Date.now()}@auth.test`;
  const registerResponse = await request(app.getHttpServer())
    .post("/auth/register")
    .send(await createAuthUserPayload(email))
    .expect(201);

  const refreshResponse = await request(app.getHttpServer())
    .post("/auth/refresh")
    .send({
      refreshToken: registerResponse.body.refreshToken
    })
    .expect(201);

  assert.equal(typeof refreshResponse.body.accessToken, "string");
  assert.equal(typeof refreshResponse.body.refreshToken, "string");
  assert.notEqual(
    refreshResponse.body.refreshToken,
    registerResponse.body.refreshToken
  );

  const logoutResponse = await request(app.getHttpServer())
    .post("/auth/logout")
    .send({
      refreshToken: refreshResponse.body.refreshToken
    })
    .expect(201);

  assert.deepEqual(logoutResponse.body, { success: true });

  const invalidatedRefreshResponse = await request(app.getHttpServer())
    .post("/auth/refresh")
    .send({
      refreshToken: refreshResponse.body.refreshToken
    })
    .expect(401);

  assert.equal(
    invalidatedRefreshResponse.body.message,
    "Invalid authentication credentials"
  );
});
