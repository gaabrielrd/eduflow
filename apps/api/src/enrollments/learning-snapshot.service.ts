import { Injectable } from "@nestjs/common";
import type {
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

  getProgressPercentage(
    snapshot: CourseVersionSnapshot,
    lessonProgress: readonly Pick<LessonProgressSummary, "status">[]
  ) {
    if (snapshot.lessons.length === 0) {
      return 0;
    }

    const completedLessons = lessonProgress.filter(
      (progress) => progress.status === LessonProgressStatus.COMPLETED
    ).length;

    return Math.round((completedLessons / snapshot.lessons.length) * 100);
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
  first: CourseVersionSnapshotModule | CourseVersionLessonSummary,
  second: CourseVersionSnapshotModule | CourseVersionLessonSummary
) {
  return first.position - second.position || first.id.localeCompare(second.id);
}
