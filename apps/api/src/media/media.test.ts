import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";

import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { PrismaService } from "../database/prisma.service.js";
import { MediaAssetStatus, Role } from "../generated/prisma/enums.js";
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
  process.env.MEDIA_UPLOAD_MAX_SIZE_BYTES = "10485760";

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

test("POST /media/presign creates a pending media asset and returns a signed upload URL for authoring roles", async () => {
  const instructor = await createUserAndToken(
    app,
    `media-presign.${Date.now()}@media.test`
  );
  const organization = await createOrganizationForUser({
    prisma,
    userId: instructor.user.id,
    name: "Media Presign Org",
    slug: `media-presign-org-${uniqueSuffix()}`,
    role: Role.INSTRUCTOR
  });

  const response = await request(app.getHttpServer())
    .post("/media/presign")
    .set("Authorization", `Bearer ${instructor.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      fileName: " Hero Banner.PNG ",
      mimeType: "image/png",
      sizeBytes: 2048
    })
    .expect(201);

  assert.equal(typeof response.body.id, "string");
  assert.equal(response.body.method, "PUT");
  assert.equal(response.body.headers["content-type"], "image/png");
  assert.match(response.body.uploadUrl, /^http:\/\/localhost:9000\//);

  const persistedAsset = await prisma.mediaAsset.findUnique({
    where: {
      id: response.body.id
    }
  });

  assert.ok(persistedAsset);
  assert.equal(persistedAsset.organizationId, organization.id);
  assert.equal(persistedAsset.uploadedById, instructor.user.id);
  assert.equal(persistedAsset.originalName, "Hero Banner.PNG");
  assert.equal(persistedAsset.fileName, "hero-banner.png");
  assert.equal(persistedAsset.mimeType, "image/png");
  assert.equal(persistedAsset.sizeBytes, 2048);
  assert.equal(persistedAsset.status, MediaAssetStatus.PENDING);
  assert.match(
    persistedAsset.storageKey,
    new RegExp(`^organizations/${organization.id}/media/\\d{4}/\\d{2}/`)
  );
});

test("POST /media/presign rejects unsupported MIME types and invalid file sizes", async () => {
  const manager = await createUserAndToken(
    app,
    `media-validation.${Date.now()}@media.test`
  );
  const organization = await createOrganizationForUser({
    prisma,
    userId: manager.user.id,
    name: "Media Validation Org",
    slug: `media-validation-org-${uniqueSuffix()}`,
    role: Role.MANAGER
  });

  const invalidMimeResponse = await request(app.getHttpServer())
    .post("/media/presign")
    .set("Authorization", `Bearer ${manager.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      fileName: "archive.zip",
      mimeType: "application/zip",
      sizeBytes: 2048
    })
    .expect(400);

  const invalidSizeResponse = await request(app.getHttpServer())
    .post("/media/presign")
    .set("Authorization", `Bearer ${manager.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      fileName: "document.pdf",
      mimeType: "application/pdf",
      sizeBytes: 10485761
    })
    .expect(400);

  assert.match(invalidMimeResponse.body.message, /mime/i);
  assert.match(invalidSizeResponse.body.message, /size/i);
});

test("media endpoints require authentication, organization context, and authoring roles", async () => {
  const student = await createUserAndToken(
    app,
    `media-student.${Date.now()}@media.test`
  );
  const organization = await createOrganizationForUser({
    prisma,
    userId: student.user.id,
    name: "Media Student Org",
    slug: `media-student-org-${uniqueSuffix()}`,
    role: Role.STUDENT
  });

  const unauthorizedResponse = await request(app.getHttpServer())
    .post("/media/presign")
    .send({
      fileName: "hero.png",
      mimeType: "image/png",
      sizeBytes: 100
    })
    .expect(401);

  const missingContextResponse = await request(app.getHttpServer())
    .post("/media/presign")
    .set("Authorization", `Bearer ${student.accessToken}`)
    .send({
      fileName: "hero.png",
      mimeType: "image/png",
      sizeBytes: 100
    })
    .expect(403);

  const deniedRoleResponse = await request(app.getHttpServer())
    .post("/media/presign")
    .set("Authorization", `Bearer ${student.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      fileName: "hero.png",
      mimeType: "image/png",
      sizeBytes: 100
    })
    .expect(403);

  assert.equal(
    unauthorizedResponse.body.message,
    "Invalid authentication credentials"
  );
  assert.equal(
    missingContextResponse.body.message,
    "Organization context is required"
  );
  assert.equal(deniedRoleResponse.body.message, "Insufficient organization role");
});

test("POST /media/complete marks a pending asset as READY", async () => {
  const admin = await createUserAndToken(
    app,
    `media-complete.${Date.now()}@media.test`
  );
  const organization = await createOrganizationForUser({
    prisma,
    userId: admin.user.id,
    name: "Media Complete Org",
    slug: `media-complete-org-${uniqueSuffix()}`,
    role: Role.ADMIN
  });
  const mediaAsset = await prisma.mediaAsset.create({
    data: {
      organizationId: organization.id,
      uploadedById: admin.user.id,
      fileName: "hero-banner.png",
      originalName: "Hero Banner.PNG",
      mimeType: "image/png",
      sizeBytes: 2048,
      storageKey: `organizations/${organization.id}/media/2026/06/${uniqueSuffix()}-hero-banner.png`,
      status: MediaAssetStatus.PENDING
    }
  });

  const response = await request(app.getHttpServer())
    .post("/media/complete")
    .set("Authorization", `Bearer ${admin.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      mediaId: mediaAsset.id
    })
    .expect(201);

  assert.equal(response.body.id, mediaAsset.id);
  assert.equal(response.body.status, MediaAssetStatus.READY);

  const persistedAsset = await prisma.mediaAsset.findUnique({
    where: {
      id: mediaAsset.id
    }
  });

  assert.equal(persistedAsset?.status, MediaAssetStatus.READY);
});

test("POST /media/complete rejects nonexistent, cross-organization, and non-pending media assets", async () => {
  const owner = await createUserAndToken(
    app,
    `media-owner.${Date.now()}@media.test`
  );
  const outsider = await createUserAndToken(
    app,
    `media-outsider.${Date.now()}@media.test`
  );
  const organization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Media Owner Org",
    slug: `media-owner-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const outsiderOrganization = await createOrganizationForUser({
    prisma,
    userId: outsider.user.id,
    name: "Media Outsider Org",
    slug: `media-outsider-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const readyAsset = await prisma.mediaAsset.create({
    data: {
      organizationId: organization.id,
      uploadedById: owner.user.id,
      fileName: "already-ready.pdf",
      originalName: "already-ready.pdf",
      mimeType: "application/pdf",
      sizeBytes: 4096,
      storageKey: `organizations/${organization.id}/media/2026/06/${uniqueSuffix()}-already-ready.pdf`,
      status: MediaAssetStatus.READY
    }
  });
  const foreignAsset = await prisma.mediaAsset.create({
    data: {
      organizationId: outsiderOrganization.id,
      uploadedById: outsider.user.id,
      fileName: "foreign.pdf",
      originalName: "foreign.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024,
      storageKey: `organizations/${outsiderOrganization.id}/media/2026/06/${uniqueSuffix()}-foreign.pdf`,
      status: MediaAssetStatus.PENDING
    }
  });

  const missingResponse = await request(app.getHttpServer())
    .post("/media/complete")
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      mediaId: `missing-${uniqueSuffix()}`
    })
    .expect(404);

  const foreignResponse = await request(app.getHttpServer())
    .post("/media/complete")
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      mediaId: foreignAsset.id
    })
    .expect(404);

  const nonPendingResponse = await request(app.getHttpServer())
    .post("/media/complete")
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      mediaId: readyAsset.id
    })
    .expect(400);

  assert.equal(missingResponse.body.message, "Media asset not found");
  assert.equal(foreignResponse.body.message, "Media asset not found");
  assert.match(nonPendingResponse.body.message, /pending/i);
});
