import type { Prisma } from "../generated/prisma/client.js";
import {
  CourseModuleStatus,
  LessonStatus
} from "../generated/prisma/enums.js";

export const coursePublishDraftSelect = {
  id: true,
  organizationId: true,
  title: true,
  slug: true,
  description: true,
  status: true,
  modules: {
    where: {
      status: CourseModuleStatus.ACTIVE
    },
    select: {
      id: true,
      title: true,
      description: true,
      position: true,
      lessons: {
        where: {
          status: LessonStatus.ACTIVE
        },
        select: {
          id: true,
          moduleId: true,
          title: true,
          description: true,
          contentType: true,
          contentJson: true,
          position: true,
          estimatedDurationMinutes: true,
          isPreview: true
        },
        orderBy: [{ position: "asc" }, { id: "asc" }]
      }
    },
    orderBy: [{ position: "asc" }, { id: "asc" }]
  }
} satisfies Prisma.CourseSelect;

export const courseVersionMetadataSelect = {
  id: true,
  courseId: true,
  organizationId: true,
  versionNumber: true,
  title: true,
  description: true,
  status: true,
  publishedById: true,
  publishedBy: {
    select: {
      id: true,
      name: true
    }
  },
  publishedAt: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.CourseVersionSelect;

export const courseVersionDetailSelect = {
  ...courseVersionMetadataSelect,
  snapshotJson: true
} satisfies Prisma.CourseVersionSelect;

export const publishMediaAssetSelect = {
  id: true,
  organizationId: true,
  fileName: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  storageKey: true,
  status: true
} satisfies Prisma.MediaAssetSelect;

export type CoursePublishDraft = Prisma.CourseGetPayload<{
  select: typeof coursePublishDraftSelect;
}>;

export type CoursePublishLesson =
  CoursePublishDraft["modules"][number]["lessons"][number];

export type PublishMediaAsset = Prisma.MediaAssetGetPayload<{
  select: typeof publishMediaAssetSelect;
}>;
