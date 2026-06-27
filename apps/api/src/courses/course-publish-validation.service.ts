import { BadRequestException, Injectable } from "@nestjs/common";
import {
  contentDocumentSchema,
  type ContentDocument
} from "@eduflow/types";

import {
  CourseStatus,
  MediaAssetStatus
} from "../generated/prisma/enums.js";
import type {
  CoursePublishDraft,
  PublishMediaAsset
} from "./course-publish.types.js";

@Injectable()
export class CoursePublishValidationService {
  validateDraftStructure(course: CoursePublishDraft) {
    if (course.status === CourseStatus.ARCHIVED) {
      throw new BadRequestException("Archived courses cannot be published");
    }

    if (course.modules.length === 0) {
      throw new BadRequestException(
        "Course must contain at least one active module"
      );
    }

    const contentByLessonId = new Map<string, ContentDocument>();

    for (const module of course.modules) {
      if (module.lessons.length === 0) {
        throw new BadRequestException(
          `Module "${module.title}" must contain at least one active lesson`
        );
      }

      for (const lesson of module.lessons) {
        const result = contentDocumentSchema.safeParse(lesson.contentJson);

        if (!result.success) {
          throw new BadRequestException(
            `Lesson "${lesson.title}" has invalid contentJson`
          );
        }

        contentByLessonId.set(lesson.id, result.data);
      }
    }

    return contentByLessonId;
  }

  validateReferencedMedia(params: {
    organizationId: string;
    referencedMediaIds: readonly string[];
    mediaAssets: readonly PublishMediaAsset[];
  }) {
    const mediaAssetsById = new Map(
      params.mediaAssets.map((mediaAsset) => [mediaAsset.id, mediaAsset])
    );

    for (const mediaId of params.referencedMediaIds) {
      const mediaAsset = mediaAssetsById.get(mediaId);

      if (
        !mediaAsset ||
        mediaAsset.organizationId !== params.organizationId ||
        mediaAsset.status !== MediaAssetStatus.READY
      ) {
        throw new BadRequestException(
          `Referenced media asset "${mediaId}" is unavailable`
        );
      }
    }
  }
}
