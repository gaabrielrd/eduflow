import { Inject, Injectable, BadRequestException } from "@nestjs/common";
import {
  courseVersionSnapshotSchema,
  type ContentBlock,
  type ContentDocument,
  type CourseVersionLessonDetail,
  type CourseVersionLessonMedia,
  type CourseVersionLessonSummary,
  type CourseVersionSnapshot,
  type CourseVersionSnapshotModule
} from "@eduflow/types";

import { STORAGE_SERVICE } from "../storage/storage.constants.js";
import type { StorageService } from "../storage/storage.service.js";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.interface.js";
import type {
  CoursePublishDraft,
  CoursePublishLesson,
  PublishMediaAsset
} from "./course-publish.types.js";

@Injectable()
export class CourseVersionSnapshotService {
  constructor(
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService
  ) {}

  getReferencedMediaIds(contentByLessonId: ReadonlyMap<string, ContentDocument>) {
    const mediaIds: string[] = [];

    for (const contentJson of contentByLessonId.values()) {
      for (const mediaId of this.getReferencedMediaIdsFromBlocks(
        contentJson.blocks
      )) {
        if (!mediaIds.includes(mediaId)) {
          mediaIds.push(mediaId);
        }
      }
    }

    return mediaIds;
  }

  buildSnapshot(params: {
    course: CoursePublishDraft;
    contentByLessonId: ReadonlyMap<string, ContentDocument>;
    mediaAssets: readonly PublishMediaAsset[];
    publishedAt: Date;
    publishedBy: AuthenticatedUser;
  }) {
    const mediaAssetsById = new Map(
      params.mediaAssets.map((mediaAsset) => [mediaAsset.id, mediaAsset])
    );

    const modules: CourseVersionSnapshotModule[] = params.course.modules.map(
      (module) => ({
        id: module.id,
        title: module.title,
        description: module.description,
        position: module.position,
        lessonIds: module.lessons.map((lesson) => lesson.id)
      })
    );

    const lessons = params.course.modules.flatMap((module) =>
      module.lessons.map((lesson) => this.toLessonSummary(lesson))
    );

    const lessonDetails: CourseVersionLessonDetail[] = params.course.modules.flatMap(
      (module) =>
        module.lessons.map((lesson) =>
          this.toLessonDetail({
            lesson,
            contentJson: this.getLessonContentJson(
              params.contentByLessonId,
              lesson.id
            ),
            mediaAssetsById
          })
        )
    );

    const snapshot: CourseVersionSnapshot = {
      schemaVersion: 1,
      publishedAt: params.publishedAt.toISOString(),
      publishedBy: {
        id: params.publishedBy.id,
        name: params.publishedBy.name
      },
      course: {
        id: params.course.id,
        organizationId: params.course.organizationId,
        title: params.course.title,
        slug: params.course.slug,
        description: params.course.description
      },
      modules,
      lessons,
      lessonDetails
    };

    const result = courseVersionSnapshotSchema.safeParse(snapshot);

    if (!result.success) {
      throw new BadRequestException("Course snapshot is invalid");
    }

    return result.data;
  }

  private toLessonSummary(
    lesson: CoursePublishLesson
  ): CourseVersionLessonSummary {
    return {
      id: lesson.id,
      moduleId: lesson.moduleId,
      title: lesson.title,
      description: lesson.description,
      contentType: lesson.contentType,
      position: lesson.position,
      estimatedDurationMinutes: lesson.estimatedDurationMinutes,
      isPreview: lesson.isPreview
    };
  }

  private toLessonDetail(params: {
    lesson: CoursePublishLesson;
    contentJson: ContentDocument;
    mediaAssetsById: ReadonlyMap<string, PublishMediaAsset>;
  }): CourseVersionLessonDetail {
    return {
      ...this.toLessonSummary(params.lesson),
      contentJson: params.contentJson,
      media: this.getReferencedMediaIdsFromBlocks(params.contentJson.blocks).map(
        (mediaId) =>
          this.toLessonMedia(this.getMediaAsset(params.mediaAssetsById, mediaId))
      )
    };
  }

  private toLessonMedia(mediaAsset: PublishMediaAsset): CourseVersionLessonMedia {
    return {
      id: mediaAsset.id,
      url: this.storageService.getReadUrl({
        organizationId: mediaAsset.organizationId,
        key: mediaAsset.storageKey
      }),
      fileName: mediaAsset.fileName,
      originalName: mediaAsset.originalName,
      mimeType: mediaAsset.mimeType,
      sizeBytes: mediaAsset.sizeBytes
    };
  }

  private getLessonContentJson(
    contentByLessonId: ReadonlyMap<string, ContentDocument>,
    lessonId: string
  ) {
    const contentJson = contentByLessonId.get(lessonId);

    if (!contentJson) {
      throw new BadRequestException("Course snapshot is invalid");
    }

    return contentJson;
  }

  private getMediaAsset(
    mediaAssetsById: ReadonlyMap<string, PublishMediaAsset>,
    mediaId: string
  ) {
    const mediaAsset = mediaAssetsById.get(mediaId);

    if (!mediaAsset) {
      throw new BadRequestException(
        `Referenced media asset "${mediaId}" is unavailable`
      );
    }

    return mediaAsset;
  }

  private getReferencedMediaIdsFromBlocks(blocks: readonly ContentBlock[]) {
    const mediaIds: string[] = [];

    for (const block of blocks) {
      if (
        (block.type === "image" || block.type === "file") &&
        block.props.assetId !== undefined &&
        !mediaIds.includes(block.props.assetId)
      ) {
        mediaIds.push(block.props.assetId);
      }
    }

    return mediaIds;
  }
}
