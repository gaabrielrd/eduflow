import { Injectable } from "@nestjs/common";
import type {
  CourseVersionLessonDetail,
  CourseVersionLessonSummary,
  CourseVersionSnapshot,
  CourseVersionSnapshotModule
} from "@eduflow/types";

import { LessonProgressStatus } from "../generated/prisma/enums.js";

type LessonProgressSummary = {
  id: string;
  enrollmentId: string;
  lessonId: string;
  status: LessonProgressStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  lastAccessedAt: Date | null;
  timeSpentSeconds: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class LearningSnapshotService {
  parseSnapshot(snapshotJson: unknown) {
    return snapshotJson as CourseVersionSnapshot;
  }

  getSnapshotMetadata(snapshot: CourseVersionSnapshot) {
    const mediaCount = snapshot.lessonDetails.reduce(
      (total, lessonDetail) => total + lessonDetail.media.length,
      0
    );

    return {
      schemaVersion: snapshot.schemaVersion,
      course: {
        id: snapshot.course.id,
        title: snapshot.course.title,
        slug: snapshot.course.slug,
        description: snapshot.course.description
      },
      moduleCount: snapshot.modules.length,
      lessonCount: snapshot.lessons.length,
      mediaCount
    };
  }

  getOrderedModules(snapshot: CourseVersionSnapshot) {
    return [...snapshot.modules].sort(comparePositionedItems);
  }

  getOrderedLessons(snapshot: CourseVersionSnapshot) {
    const moduleOrder = new Map(
      this.getOrderedModules(snapshot).map((module, index) => [module.id, index])
    );

    return [...snapshot.lessons].sort((first, second) => {
      const firstModuleIndex = moduleOrder.get(first.moduleId) ?? Number.MAX_SAFE_INTEGER;
      const secondModuleIndex =
        moduleOrder.get(second.moduleId) ?? Number.MAX_SAFE_INTEGER;

      return (
        firstModuleIndex - secondModuleIndex ||
        comparePositionedItems(first, second)
      );
    });
  }

  getOrderedLessonDetails(snapshot: CourseVersionSnapshot) {
    const lessonOrder = new Map(
      this.getOrderedLessons(snapshot).map((lesson, index) => [lesson.id, index])
    );

    return [...snapshot.lessonDetails].sort((first, second) => {
      const firstLessonIndex = lessonOrder.get(first.id) ?? Number.MAX_SAFE_INTEGER;
      const secondLessonIndex =
        lessonOrder.get(second.id) ?? Number.MAX_SAFE_INTEGER;

      return (
        firstLessonIndex - secondLessonIndex ||
        comparePositionedItems(first, second)
      );
    });
  }

  getProgressPercentage(
    snapshot: CourseVersionSnapshot,
    lessonProgress: readonly Pick<LessonProgressSummary, "lessonId" | "status">[]
  ) {
    const totalCount = this.getTotalLessonCount(snapshot);

    if (totalCount === 0) {
      return 0;
    }

    return Math.round((this.getCompletedLessonCount(snapshot, lessonProgress) / totalCount) * 100);
  }

  getRequiredLessons(snapshot: CourseVersionSnapshot) {
    return snapshot.lessons;
  }

  getTotalLessonCount(snapshot: CourseVersionSnapshot) {
    return this.getRequiredLessons(snapshot).length;
  }

  getCompletedLessonCount(
    snapshot: CourseVersionSnapshot,
    lessonProgress: readonly Pick<LessonProgressSummary, "lessonId" | "status">[]
  ) {
    const requiredLessonIds = new Set(
      this.getRequiredLessons(snapshot).map((lesson) => lesson.id)
    );

    return lessonProgress.filter(
      (progress) =>
        requiredLessonIds.has(progress.lessonId) &&
        progress.status === LessonProgressStatus.COMPLETED
    ).length;
  }

  hasLesson(snapshot: CourseVersionSnapshot, lessonId: string) {
    return snapshot.lessons.some((lesson) => lesson.id === lessonId);
  }

  getLessonProgressMap(
    lessonProgress: readonly LessonProgressSummary[]
  ): Record<string, LessonProgressSummary> {
    return Object.fromEntries(
      lessonProgress.map((progress) => [progress.lessonId, progress])
    );
  }
}

function comparePositionedItems(
  first:
    | CourseVersionLessonDetail
    | CourseVersionSnapshotModule
    | CourseVersionLessonSummary,
  second:
    | CourseVersionLessonDetail
    | CourseVersionSnapshotModule
    | CourseVersionLessonSummary
) {
  return first.position - second.position || first.id.localeCompare(second.id);
}
