export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

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
