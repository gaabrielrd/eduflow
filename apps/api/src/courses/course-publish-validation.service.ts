import { Injectable } from "@nestjs/common";
import {
  contentDocumentSchema,
  type ContentBlock,
  type ContentDocument
} from "@eduflow/types";
import type {
  CoursePublishValidationError,
  CoursePublishValidationResult
} from "@eduflow/types";

import {
  CourseStatus,
  MediaAssetStatus
} from "../generated/prisma/enums.js";
import type {
  CoursePublishDraft,
  PublishMediaAsset
} from "./course-publish.types.js";

export type PublishMediaReference = {
  id: string;
  path: string;
};

export type PublishDraftStructureValidation = {
  contentByLessonId: Map<string, ContentDocument>;
  mediaReferences: PublishMediaReference[];
  validation: CoursePublishValidationResult;
};

@Injectable()
export class CoursePublishValidationService {
  validateDraftStructure(
    course: CoursePublishDraft
  ): PublishDraftStructureValidation {
    const errors: CoursePublishValidationError[] = [];
    const contentByLessonId = new Map<string, ContentDocument>();
    const mediaReferences: PublishMediaReference[] = [];

    if (!course.title.trim()) {
      errors.push({
        code: "COURSE_TITLE_REQUIRED",
        message: "Course must have a title.",
        path: "title"
      });
    }

    if (course.status === CourseStatus.ARCHIVED) {
      errors.push({
        code: "COURSE_ARCHIVED",
        message: "Archived courses cannot be published.",
        path: "status"
      });
    }

    if (course.modules.length === 0) {
      errors.push({
        code: "COURSE_WITHOUT_MODULES",
        message: "Course must contain at least one active module.",
        path: "modules"
      });
    }

    for (const [moduleIndex, module] of course.modules.entries()) {
      if (module.lessons.length === 0) {
        errors.push({
          code: "MODULE_WITHOUT_LESSONS",
          message: "Module must contain at least one active lesson.",
          path: `modules.${moduleIndex}`
        });
      }

      for (const [lessonIndex, lesson] of module.lessons.entries()) {
        const lessonPath = `modules.${moduleIndex}.lessons.${lessonIndex}`;

        if (!lesson.title.trim()) {
          errors.push({
            code: "LESSON_TITLE_REQUIRED",
            message: "Lesson must have a title.",
            path: `${lessonPath}.title`
          });
        }

        const result = contentDocumentSchema.safeParse(lesson.contentJson);

        if (!result.success) {
          errors.push({
            code: "LESSON_CONTENT_INVALID",
            message: "Lesson content JSON is invalid.",
            path: `${lessonPath}.contentJson`
          });
          continue;
        }

        contentByLessonId.set(lesson.id, result.data);
        mediaReferences.push(
          ...this.getMediaReferencesFromBlocks(
            result.data.blocks,
            `${lessonPath}.contentJson.blocks`
          )
        );
      }
    }

    return {
      contentByLessonId,
      mediaReferences,
      validation: this.toValidationResult(errors)
    };
  }

  validateReferencedMedia(params: {
    organizationId: string;
    mediaReferences: readonly PublishMediaReference[];
    mediaAssets: readonly PublishMediaAsset[];
  }): CoursePublishValidationResult {
    const errors: CoursePublishValidationError[] = [];
    const mediaAssetsById = new Map(
      params.mediaAssets.map((mediaAsset) => [mediaAsset.id, mediaAsset])
    );

    for (const mediaReference of params.mediaReferences) {
      const mediaAsset = mediaAssetsById.get(mediaReference.id);

      if (!mediaAsset) {
        errors.push({
          code: "MEDIA_ASSET_MISSING",
          message: `Referenced media asset "${mediaReference.id}" does not exist.`,
          path: mediaReference.path
        });
        continue;
      }

      if (mediaAsset.organizationId !== params.organizationId) {
        errors.push({
          code: "MEDIA_ASSET_WRONG_ORGANIZATION",
          message: `Referenced media asset "${mediaReference.id}" belongs to another organization.`,
          path: mediaReference.path
        });
        continue;
      }

      if (mediaAsset.status !== MediaAssetStatus.READY) {
        errors.push({
          code: "MEDIA_ASSET_UNAVAILABLE",
          message: `Referenced media asset "${mediaReference.id}" is unavailable.`,
          path: mediaReference.path
        });
      }
    }

    return this.toValidationResult(errors);
  }

  combineValidationResults(
    ...results: readonly CoursePublishValidationResult[]
  ): CoursePublishValidationResult {
    return this.toValidationResult(results.flatMap((result) => result.errors));
  }

  private toValidationResult(
    errors: CoursePublishValidationError[]
  ): CoursePublishValidationResult {
    return {
      valid: errors.length === 0,
      errors
    };
  }

  private getMediaReferencesFromBlocks(
    blocks: readonly ContentBlock[],
    blocksPath: string
  ) {
    const mediaReferences: PublishMediaReference[] = [];
    const seenMediaIds = new Set<string>();

    for (const [blockIndex, block] of blocks.entries()) {
      if (
        (block.type === "image" || block.type === "file") &&
        block.props.assetId !== undefined &&
        !seenMediaIds.has(block.props.assetId)
      ) {
        mediaReferences.push({
          id: block.props.assetId,
          path: `${blocksPath}.${blockIndex}.props.assetId`
        });
        seenMediaIds.add(block.props.assetId);
      }
    }

    return mediaReferences;
  }
}
