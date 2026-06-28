import { apiClient } from "@/lib/api/api-client";
import type {
  LearningEnrollmentDetail,
  LearningProgressSummary,
  MyCourseEnrollment
} from "@/lib/learning/learning-types";

export async function listMyLearningCourses() {
  return apiClient<MyCourseEnrollment[]>({
    method: "GET",
    path: "/api/learning/my-courses"
  });
}

export async function getLearningEnrollment(enrollmentId: string) {
  return apiClient<LearningEnrollmentDetail>({
    method: "GET",
    path: `/api/learning/enrollments/${enrollmentId}`
  });
}

export async function startLearningLesson(enrollmentId: string, lessonId: string) {
  return apiClient<LearningProgressSummary>({
    method: "POST",
    path: `/api/learning/enrollments/${enrollmentId}/lessons/${lessonId}/start`
  });
}

export async function completeLearningLesson(enrollmentId: string, lessonId: string) {
  return apiClient<LearningProgressSummary>({
    method: "POST",
    path: `/api/learning/enrollments/${enrollmentId}/lessons/${lessonId}/complete`
  });
}
