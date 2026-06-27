import { apiClient } from "@/lib/api/api-client";
import type {
  LearningEnrollmentDetail,
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
