import type { ContentDocument } from "@eduflow/types";

export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type ModuleStatus = "ACTIVE" | "ARCHIVED";
export type LessonStatus = "ACTIVE" | "ARCHIVED";
export type LessonContentType = "TEXT" | "VIDEO" | "QUIZ" | "FILE";

export type Course = {
  id: string;
  organizationId: string;
  title: string;
  slug: string;
  description: string | null;
  status: CourseStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateCoursePayload = {
  title: string;
  slug: string;
  description?: string;
};

export type UpdateCoursePayload = Partial<CreateCoursePayload>;

export type LessonNode = {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  contentType: LessonContentType;
  contentJson: ContentDocument;
  position: number;
  estimatedDurationMinutes: number | null;
  isPreview: boolean;
  status: LessonStatus;
  createdAt: string;
  updatedAt: string;
};

export type CourseModuleNode = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  position: number;
  status: ModuleStatus;
  createdAt: string;
  updatedAt: string;
  lessons: LessonNode[];
};

export type CourseCurriculum = Course & {
  modules: CourseModuleNode[];
};

export type CreateModulePayload = {
  title: string;
};

export type UpdateModulePayload = CreateModulePayload;

export type CreateLessonPayload = {
  title: string;
  description?: string;
  contentType: LessonContentType;
  contentJson: ContentDocument;
  estimatedDurationMinutes?: number;
  isPreview?: boolean;
};

export type UpdateLessonPayload = {
  title?: string;
  description?: string;
  contentType?: LessonContentType;
  contentJson?: ContentDocument;
  estimatedDurationMinutes?: number;
  isPreview?: boolean;
};
