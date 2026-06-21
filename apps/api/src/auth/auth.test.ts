import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import type { AppModule as AppModuleType } from "../app.module.js";
import { PrismaService } from "../database/prisma.service.js";
import { PrismaClient } from "../generated/prisma/client.js";

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
type AuthSessionDelegate = InstanceType<typeof PrismaClient>["authSession"];

async function createAuthUserPayload(email: string) {
  return {
    name: "Gabriel Roda",
    email,
    password: "strong-password"
  };
}

async function cleanupAuthFixtures() {
  await prisma.$executeRaw`
    DELETE FROM "AuthSession"
    WHERE "userId" IN (
      SELECT "id" FROM "User" WHERE "email" LIKE ${"%@auth.test"}
    )
  `;

  await prisma.$executeRaw`
    DELETE FROM "User"
    WHERE "email" LIKE ${"%@auth.test"}
  `;
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
  await cleanupAuthFixtures();
});

after(async () => {
  await cleanupAuthFixtures();
  await app.close();
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

test("GET /auth/me returns the authenticated user for a valid access token", async () => {
  const email = `me.${Date.now()}@auth.test`;
  const registerResponse = await request(app.getHttpServer())
    .post("/auth/register")
    .send(await createAuthUserPayload(email))
    .expect(201);

  const meResponse = await request(app.getHttpServer())
    .get("/auth/me")
    .set("Authorization", `Bearer ${registerResponse.body.accessToken}`)
    .expect(200);

  assert.equal(meResponse.body.email, email);
  assert.equal(meResponse.body.name, "Gabriel Roda");
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
