import { apiClient } from "@/lib/api/api-client";
import type {
  Course,
  CreateCoursePayload,
  UpdateCoursePayload
} from "@/lib/courses/course-types";

export async function listCourses() {
  return apiClient<Course[]>({
    method: "GET",
    path: "/api/courses"
  });
}

export async function createCourse(payload: CreateCoursePayload) {
  return apiClient<Course>({
    body: payload,
    method: "POST",
    path: "/api/courses"
  });
}

export async function getCourseById(courseId: string) {
  return apiClient<Course>({
    method: "GET",
    path: `/api/courses/${courseId}`
  });
}

export async function updateCourse(
  courseId: string,
  payload: UpdateCoursePayload
) {
  return apiClient<Course>({
    body: payload,
    method: "PATCH",
    path: `/api/courses/${courseId}`
  });
}
