import assert from "node:assert/strict";
import test from "node:test";

import { ConfigService } from "@nestjs/config";

import { validateEnv } from "../config/env.schema.js";
import { S3CompatibleStorageService } from "./s3-compatible-storage.service.js";
import { StorageConfigService } from "./storage-config.service.js";

function createStorageService(overrides: Record<string, unknown> = {}) {
  const parsedEnv = validateEnv({
    NODE_ENV: "test",
    PORT: "4001",
    DATABASE_URL: "postgresql://eduflow:eduflow@localhost:5432/eduflow",
    REDIS_URL: "redis://localhost:6379",
    JWT_SECRET: "test-secret",
    JWT_ACCESS_TOKEN_EXPIRES_IN: "1h",
    JWT_REFRESH_TOKEN_EXPIRES_IN: "30d",
    STORAGE_ENDPOINT: "http://localhost:9000",
    STORAGE_ACCESS_KEY: "eduflow",
    STORAGE_SECRET_KEY: "eduflow123",
    STORAGE_BUCKET_NAME: "eduflow-media",
    STORAGE_REGION: "us-east-1",
    STORAGE_PUBLIC_BASE_URL: "http://localhost:9000",
    MEDIA_UPLOAD_MAX_SIZE_BYTES: "10485760",
    ...overrides
  });
  const configService = new ConfigService(parsedEnv);
  const storageConfigService = new StorageConfigService(configService);

  return new S3CompatibleStorageService(storageConfigService);
}

test("buildObjectKey prefixes objects by organization and category", () => {
  const service = createStorageService();
  const object = service.buildObjectKey({
    organizationId: "org_123",
    category: "Lesson Assets",
    filename: "Hero Banner.PNG",
    now: new Date("2026-06-24T12:00:00.000Z")
  });

  assert.equal(object.organizationId, "org_123");
  assert.match(
    object.key,
    /^organizations\/org_123\/lesson-assets\/2026\/06\/[a-f0-9-]+-hero-banner\.png$/
  );
});

test("buildObjectKey keeps deterministic structure and unique suffixes", () => {
  const service = createStorageService();
  const now = new Date("2026-06-24T12:00:00.000Z");
  const first = service.buildObjectKey({
    organizationId: "org_123",
    category: "exports",
    filename: "report.csv",
    now
  });
  const second = service.buildObjectKey({
    organizationId: "org_123",
    category: "exports",
    filename: "report.csv",
    now
  });

  assert.notEqual(first.key, second.key);
  assert.match(first.key, /^organizations\/org_123\/exports\/2026\/06\//);
  assert.match(second.key, /^organizations\/org_123\/exports\/2026\/06\//);
});

test("getReadUrl builds a public bucket URL", () => {
  const service = createStorageService();
  const url = service.getReadUrl({
    organizationId: "org_123",
    key: "organizations/org_123/media/2026/06/file name.png"
  });

  assert.equal(
    url,
    "http://localhost:9000/eduflow-media/organizations/org_123/media/2026/06/file%20name.png"
  );
});

test("createUploadUrl returns a PUT URL and object reference", async () => {
  const service = createStorageService();
  const result = await service.createUploadUrl({
    organizationId: "org_123",
    category: "media",
    filename: "sample.pdf",
    contentType: "application/pdf"
  });

  assert.equal(result.method, "PUT");
  assert.equal(result.headers["content-type"], "application/pdf");
  assert.equal(result.object.organizationId, "org_123");
  assert.match(result.object.key, /^organizations\/org_123\/media\/\d{4}\/\d{2}\//);
  assert.match(result.url, /^http:\/\/localhost:9000\/eduflow-media\/organizations\//);
});

test("storage region falls back to us-east-1", () => {
  const service = createStorageService({
    STORAGE_REGION: undefined
  });
  const result = service.buildObjectKey({
    organizationId: "org_123",
    category: "media",
    filename: "sample.pdf",
    now: new Date("2026-06-24T12:00:00.000Z")
  });

  assert.match(result.key, /^organizations\/org_123\/media\/2026\/06\//);
});

test("validateEnv requires public storage configuration", () => {
  assert.throws(() =>
    validateEnv({
      NODE_ENV: "test",
      PORT: "4001",
      DATABASE_URL: "postgresql://eduflow:eduflow@localhost:5432/eduflow",
      REDIS_URL: "redis://localhost:6379",
      JWT_SECRET: "test-secret",
      JWT_ACCESS_TOKEN_EXPIRES_IN: "1h",
      JWT_REFRESH_TOKEN_EXPIRES_IN: "30d",
      STORAGE_ENDPOINT: "http://localhost:9000",
      STORAGE_ACCESS_KEY: "eduflow",
      STORAGE_SECRET_KEY: "eduflow123",
      STORAGE_BUCKET_NAME: "eduflow-media"
    })
  );
});

test("storage validates local MinIO bucket access", async () => {
  const service = createStorageService();

  await assert.doesNotReject(() => service.validateConfiguration());
});

test("storage validation fails for a missing bucket", async () => {
  const service = createStorageService({
    STORAGE_BUCKET_NAME: "missing-bucket"
  });

  await assert.rejects(
    () => service.validateConfiguration(),
    /Storage configuration validation failed/
  );
});

test("deleteObject removes an uploaded object", async () => {
  const service = createStorageService();
  const upload = await service.createUploadUrl({
    organizationId: "org_123",
    category: "media",
    filename: "delete-me.txt",
    contentType: "text/plain"
  });

  const response = await fetch(upload.url, {
    method: upload.method,
    headers: upload.headers,
    body: "delete me"
  });

  assert.equal(response.ok, true);
  await assert.doesNotReject(() => service.deleteObject(upload.object));
});
