import { randomUUID } from "node:crypto";

import {
  DeleteObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable, type OnModuleInit } from "@nestjs/common";

import { StorageConfigService } from "./storage-config.service.js";
import type { StorageService } from "./storage.service.js";
import type {
  BuildStorageKeyInput,
  CreateUploadUrlInput,
  CreateUploadUrlResult,
  StorageConfiguration,
  StorageObjectRef
} from "./storage.types.js";

const DEFAULT_UPLOAD_URL_TTL_SECONDS = 900;

@Injectable()
export class S3CompatibleStorageService
  implements StorageService, OnModuleInit
{
  private readonly config: StorageConfiguration;
  private readonly client: S3Client;

  constructor(private readonly storageConfigService: StorageConfigService) {
    this.config = this.storageConfigService.getSettings();
    this.client = new S3Client({
      region: this.config.region,
      endpoint: this.config.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.config.accessKey,
        secretAccessKey: this.config.secretKey
      }
    });
  }

  async onModuleInit() {
    await this.validateConfiguration();
  }

  buildObjectKey(input: BuildStorageKeyInput): StorageObjectRef {
    const date = input.now ?? new Date();
    const year = date.getUTCFullYear().toString();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const category = sanitizePathSegment(input.category);
    const filename = sanitizeFilename(input.filename);
    const key = `organizations/${input.organizationId}/${category}/${year}/${month}/${randomUUID()}-${filename}`;

    return {
      organizationId: input.organizationId,
      key
    };
  }

  async createUploadUrl(
    input: CreateUploadUrlInput
  ): Promise<CreateUploadUrlResult> {
    const object = this.buildObjectKey(input);
    const command = new PutObjectCommand({
      Bucket: this.config.bucketName,
      Key: object.key,
      ContentType: input.contentType
    });
    const url = await getSignedUrl(this.client, command, {
      expiresIn: input.expiresInSeconds ?? DEFAULT_UPLOAD_URL_TTL_SECONDS
    });
    const headers: Record<string, string> = {};

    if (input.contentType) {
      headers["content-type"] = input.contentType;
    }

    return {
      url,
      method: "PUT",
      object,
      headers
    };
  }

  getReadUrl(object: StorageObjectRef) {
    return buildPublicObjectUrl({
      publicBaseUrl: this.config.publicBaseUrl,
      bucketName: this.config.bucketName,
      key: object.key
    });
  }

  async deleteObject(object: StorageObjectRef) {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucketName,
        Key: object.key
      })
    );
  }

  async validateConfiguration() {
    try {
      await this.client.send(
        new HeadBucketCommand({
          Bucket: this.config.bucketName
        })
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown storage error";

      throw new Error(
        `Storage configuration validation failed for bucket "${this.config.bucketName}": ${message}`
      );
    }
  }
}

function sanitizePathSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function sanitizeFilename(filename: string) {
  const trimmed = filename.trim().toLowerCase();
  const lastDotIndex = trimmed.lastIndexOf(".");
  const basename =
    lastDotIndex > 0 ? trimmed.slice(0, lastDotIndex) : trimmed;
  const extension = lastDotIndex > 0 ? trimmed.slice(lastDotIndex) : "";
  const safeBase = sanitizePathSegment(basename) || "file";
  const safeExtension = extension.replace(/[^a-z0-9.]+/g, "");

  return `${safeBase}${safeExtension}`;
}

function buildPublicObjectUrl(input: {
  publicBaseUrl: string;
  bucketName: string;
  key: string;
}) {
  const baseUrl = input.publicBaseUrl.replace(/\/+$/, "");
  const encodedKey = input.key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${baseUrl}/${encodeURIComponent(input.bucketName)}/${encodedKey}`;
}
