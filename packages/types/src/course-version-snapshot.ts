import { z } from "zod";

import { contentDocumentSchema, type ContentBlock } from "./content-contract.js";

export const courseVersionSnapshotSchemaVersionSchema = z.literal(1);

const idSchema = z.string().min(1);
const nullableTextSchema = z.string().nullable();
const positionSchema = z.number().int().positive();

export const courseVersionPublishedBySchema = z.object({
  id: idSchema,
  name: z.string().min(1)
}).strict();

export const courseVersionCourseSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  title: z.string().min(1),
  slug: z.string().min(1),
  description: nullableTextSchema
}).strict();

export const courseVersionModuleSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  description: nullableTextSchema,
  position: positionSchema,
  lessonIds: z.array(idSchema)
}).strict();

export const courseVersionLessonContentTypeSchema = z.enum([
  "TEXT",
  "VIDEO",
  "QUIZ",
  "FILE"
]);

export const courseVersionLessonSummarySchema = z.object({
  id: idSchema,
  moduleId: idSchema,
  title: z.string().min(1),
  description: nullableTextSchema,
  contentType: courseVersionLessonContentTypeSchema,
  position: positionSchema,
  estimatedDurationMinutes: z.number().int().positive().nullable(),
  isPreview: z.boolean()
}).strict();

export const courseVersionLessonMediaSchema = z.object({
  id: idSchema,
  url: z.string().url(),
  fileName: z.string().min(1),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive()
}).strict();

export const courseVersionLessonDetailSchema = courseVersionLessonSummarySchema
  .extend({
    contentJson: contentDocumentSchema,
    media: z.array(courseVersionLessonMediaSchema)
  })
  .strict()
  .superRefine((lessonDetail, context) => {
    const referencedAssetIds = getReferencedAssetIds(lessonDetail.contentJson.blocks);
    const mediaIds = lessonDetail.media.map((media) => media.id);

    addDuplicateIdIssues(mediaIds, context, "media");

    const missingMediaIds = referencedAssetIds.filter(
      (assetId) => !mediaIds.includes(assetId)
    );
    const unreferencedMediaIds = mediaIds.filter(
      (mediaId) => !referencedAssetIds.includes(mediaId)
    );

    for (const assetId of missingMediaIds) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Referenced media asset "${assetId}" is missing from lesson media`
      });
    }

    for (const mediaId of unreferencedMediaIds) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Lesson media "${mediaId}" is not referenced by contentJson`
      });
    }
  });

export const courseVersionSnapshotSchema = z.object({
  schemaVersion: courseVersionSnapshotSchemaVersionSchema,
  publishedAt: z.string().datetime({ offset: true }),
  publishedBy: courseVersionPublishedBySchema,
  course: courseVersionCourseSchema,
  modules: z.array(courseVersionModuleSchema),
  lessons: z.array(courseVersionLessonSummarySchema),
  lessonDetails: z.array(courseVersionLessonDetailSchema)
}).strict().superRefine((snapshot, context) => {
  addDuplicateIdIssues(snapshot.modules.map((module) => module.id), context, "module");
  addDuplicateIdIssues(snapshot.lessons.map((lesson) => lesson.id), context, "lesson");
  addDuplicateIdIssues(
    snapshot.lessonDetails.map((lessonDetail) => lessonDetail.id),
    context,
    "lesson detail"
  );

  assertSorted(snapshot.modules, context, "modules");

  const moduleIds = snapshot.modules.map((module) => module.id);
  const lessonIds = snapshot.lessons.map((lesson) => lesson.id);
  const lessonDetailIds = snapshot.lessonDetails.map((lessonDetail) => lessonDetail.id);

  const expectedLessonOrder = snapshot.modules.flatMap((module) =>
    snapshot.lessons
      .filter((lesson) => lesson.moduleId === module.id)
      .sort(comparePositionedItems)
      .map((lesson) => lesson.id)
  );

  if (!arraysEqual(lessonIds, expectedLessonOrder)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Lessons must be ordered by module order, then position and id"
    });
  }

  for (const lesson of snapshot.lessons) {
    if (!moduleIds.includes(lesson.moduleId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Lesson "${lesson.id}" references an unknown module`
      });
    }
  }

  for (const module of snapshot.modules) {
    const expectedModuleLessonIds = snapshot.lessons
      .filter((lesson) => lesson.moduleId === module.id)
      .map((lesson) => lesson.id);

    if (!arraysEqual(module.lessonIds, expectedModuleLessonIds)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Module "${module.id}" lessonIds must match ordered lessons`
      });
    }
  }

  if (!setsEqual(new Set(lessonIds), new Set(lessonDetailIds))) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Lesson details must exist exactly once for every lesson"
    });
  }

  for (const lessonDetail of snapshot.lessonDetails) {
    const lesson = snapshot.lessons.find((item) => item.id === lessonDetail.id);

    if (!lesson) {
      continue;
    }

    if (!lessonSummaryFieldsMatch(lesson, lessonDetail)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Lesson detail "${lessonDetail.id}" metadata must match lesson summary`
      });
    }
  }
});

export type CourseVersionSnapshotSchemaVersion = z.infer<
  typeof courseVersionSnapshotSchemaVersionSchema
>;
export type CourseVersionPublishedBy = z.infer<typeof courseVersionPublishedBySchema>;
export type CourseVersionSnapshotCourse = z.infer<typeof courseVersionCourseSchema>;
export type CourseVersionSnapshotModule = z.infer<typeof courseVersionModuleSchema>;
export type CourseVersionLessonContentType = z.infer<
  typeof courseVersionLessonContentTypeSchema
>;
export type CourseVersionLessonSummary = z.infer<
  typeof courseVersionLessonSummarySchema
>;
export type CourseVersionLessonMedia = z.infer<typeof courseVersionLessonMediaSchema>;
export type CourseVersionLessonDetail = z.infer<
  typeof courseVersionLessonDetailSchema
>;
export type CourseVersionSnapshot = z.infer<typeof courseVersionSnapshotSchema>;

type PositionedItem = {
  readonly id: string;
  readonly position: number;
};

function comparePositionedItems(first: PositionedItem, second: PositionedItem) {
  return first.position - second.position || first.id.localeCompare(second.id);
}

function assertSorted(
  items: readonly PositionedItem[],
  context: z.RefinementCtx,
  label: string
) {
  const sortedIds = [...items].sort(comparePositionedItems).map((item) => item.id);
  const actualIds = items.map((item) => item.id);

  if (!arraysEqual(actualIds, sortedIds)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${label} must be ordered by position and id`
    });
  }
}

function addDuplicateIdIssues(
  ids: readonly string[],
  context: z.RefinementCtx,
  label: string
) {
  const seen = new Set<string>();

  for (const id of ids) {
    if (seen.has(id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate ${label} id "${id}"`
      });
    }

    seen.add(id);
  }
}

function getReferencedAssetIds(blocks: readonly ContentBlock[]) {
  const assetIds: string[] = [];

  for (const block of blocks) {
    if (
      (block.type === "image" || block.type === "file") &&
      block.props.assetId !== undefined &&
      !assetIds.includes(block.props.assetId)
    ) {
      assetIds.push(block.props.assetId);
    }
  }

  return assetIds;
}

function lessonSummaryFieldsMatch(
  lesson: CourseVersionLessonSummary,
  lessonDetail: CourseVersionLessonDetail
) {
  return (
    lesson.moduleId === lessonDetail.moduleId &&
    lesson.title === lessonDetail.title &&
    lesson.description === lessonDetail.description &&
    lesson.contentType === lessonDetail.contentType &&
    lesson.position === lessonDetail.position &&
    lesson.estimatedDurationMinutes === lessonDetail.estimatedDurationMinutes &&
    lesson.isPreview === lessonDetail.isPreview
  );
}

function arraysEqual(first: readonly string[], second: readonly string[]) {
  return (
    first.length === second.length &&
    first.every((value, index) => value === second[index])
  );
}

function setsEqual(first: ReadonlySet<string>, second: ReadonlySet<string>) {
  if (first.size !== second.size) {
    return false;
  }

  for (const value of first) {
    if (!second.has(value)) {
      return false;
    }
  }

  return true;
}
