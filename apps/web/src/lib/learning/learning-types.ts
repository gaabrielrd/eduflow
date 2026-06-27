export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export type LessonProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export type MyCourseEnrollment = {
  id: string;
  courseTitle: string;
  courseDescription: string | null;
  versionNumber: number;
  status: EnrollmentStatus;
  progressPercentage: number;
  enrolledAt: string;
  completedAt: string | null;
};

export type LearningModule = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  lessonIds: string[];
};

export type LearningLesson = {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  contentType: "TEXT" | "VIDEO" | "QUIZ" | "FILE";
  position: number;
  estimatedDurationMinutes: number | null;
  isPreview: boolean;
};

export type LearningLessonProgress = {
  id: string;
  enrollmentId: string;
  lessonId: string;
  status: LessonProgressStatus;
  startedAt: string | null;
  completedAt: string | null;
  lastAccessedAt: string | null;
  timeSpentSeconds: number;
  createdAt: string;
  updatedAt: string;
};

export type LearningEnrollmentDetail = {
  id: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt: string | null;
  courseVersionId: string;
  snapshotMetadata: {
    schemaVersion: 1;
    course: {
      id: string;
      title: string;
      slug: string;
      description: string | null;
    };
    moduleCount: number;
    lessonCount: number;
    mediaCount: number;
  };
  modules: LearningModule[];
  lessons: LearningLesson[];
  lessonProgress: Record<string, LearningLessonProgress>;
  progressPercentage: number;
};
