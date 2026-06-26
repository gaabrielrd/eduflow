import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException
} from "@nestjs/common";

import type { AuthenticatedUser } from "../auth/types/authenticated-user.interface.js";
import type { OrganizationContext } from "../auth/types/organization-context.interface.js";
import { PrismaService } from "../database/prisma.service.js";
import { Prisma } from "../generated/prisma/client.js";
import { MediaAssetStatus } from "../generated/prisma/enums.js";
import { STORAGE_SERVICE } from "../storage/storage.constants.js";
import { StorageConfigService } from "../storage/storage-config.service.js";
import type { StorageService } from "../storage/storage.service.js";
import type { CompleteMediaDto } from "./dto/complete-media.dto.js";
import type { PresignMediaDto } from "./dto/presign-media.dto.js";

const SUPPORTED_MEDIA_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf"
]);

const mediaAssetSelect = {
  id: true,
  organizationId: true,
  uploadedById: true,
  fileName: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  storageKey: true,
  status: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.MediaAssetSelect;

@Injectable()
export class MediaService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
    @Inject(StorageConfigService)
    private readonly storageConfigService: StorageConfigService
  ) {}

  async createPresignedUpload(
    context: OrganizationContext,
    user: AuthenticatedUser,
    dto: PresignMediaDto
  ) {
    const originalName = this.normalizeOriginalName(dto.fileName);
    const mimeType = this.normalizeMimeType(dto.mimeType);
    const maxSizeBytes =
      this.storageConfigService.getSettings().mediaUploadMaxSizeBytes;

    this.validateMimeType(mimeType);
    this.validateSize(dto.sizeBytes, maxSizeBytes);

    const upload = await this.storageService.createUploadUrl({
      organizationId: context.organizationId,
      category: "media",
      filename: originalName,
      contentType: mimeType
    });

    const mediaAsset = await this.prisma.mediaAsset.create({
      data: {
        organizationId: context.organizationId,
        uploadedById: user.id,
        fileName: this.extractStoredFilename(upload.object.key),
        originalName,
        mimeType,
        sizeBytes: dto.sizeBytes,
        storageKey: upload.object.key,
        status: MediaAssetStatus.PENDING
      },
      select: {
        id: true
      }
    });

    return {
      id: mediaAsset.id,
      uploadUrl: upload.url,
      method: upload.method,
      headers: upload.headers
    };
  }

  async completeUpload(context: OrganizationContext, dto: CompleteMediaDto) {
    const mediaAsset = await this.prisma.mediaAsset.findFirst({
      where: {
        id: dto.mediaId,
        organizationId: context.organizationId
      },
      select: mediaAssetSelect
    });

    if (!mediaAsset) {
      throw new NotFoundException("Media asset not found");
    }

    if (mediaAsset.status !== MediaAssetStatus.PENDING) {
      throw new BadRequestException(
        "Only pending media assets can be completed"
      );
    }

    return this.prisma.mediaAsset.update({
      where: {
        id: mediaAsset.id
      },
      data: {
        status: MediaAssetStatus.READY
      },
      select: mediaAssetSelect
    });
  }

  async listMediaAssets(context: OrganizationContext) {
    return this.prisma.mediaAsset.findMany({
      where: {
        organizationId: context.organizationId,
        status: {
          not: MediaAssetStatus.DELETED
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      select: mediaAssetSelect
    });
  }

  async deleteMediaAsset(context: OrganizationContext, mediaId: string) {
    const mediaAsset = await this.prisma.mediaAsset.findFirst({
      where: {
        id: mediaId,
        organizationId: context.organizationId,
        status: {
          not: MediaAssetStatus.DELETED
        }
      },
      select: mediaAssetSelect
    });

    if (!mediaAsset) {
      throw new NotFoundException("Media asset not found");
    }

    await this.storageService.deleteObject({
      organizationId: mediaAsset.organizationId,
      key: mediaAsset.storageKey
    });

    return this.prisma.mediaAsset.update({
      where: {
        id: mediaAsset.id
      },
      data: {
        status: MediaAssetStatus.DELETED
      },
      select: mediaAssetSelect
    });
  }

  private normalizeOriginalName(fileName: string) {
    const normalized = fileName.trim();

    if (!normalized) {
      throw new BadRequestException("File name is invalid");
    }

    return normalized;
  }

  private normalizeMimeType(mimeType: string) {
    const normalized = mimeType.trim().toLowerCase();

    if (!normalized) {
      throw new BadRequestException("MIME type is invalid");
    }

    return normalized;
  }

  private validateMimeType(mimeType: string) {
    if (!SUPPORTED_MEDIA_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException("Unsupported MIME type");
    }
  }

  private validateSize(sizeBytes: number, maxSizeBytes: number) {
    if (sizeBytes <= 0 || sizeBytes > maxSizeBytes) {
      throw new BadRequestException(
        `File size must be between 1 and ${maxSizeBytes} bytes`
      );
    }
  }

  private extractStoredFilename(storageKey: string) {
    const filename = storageKey.split("/").pop() ?? "";

    return filename.replace(/^[0-9a-f-]+-/, "");
  }
}
