import { apiClient } from "@/lib/api/api-client";
import type {
  Course,
  CourseCurriculum,
  CourseVersionDetails,
  CourseVersionMetadata,
  CreateLessonPayload,
  CreateModulePayload,
  CreateCoursePayload,
  CoursePublishValidationResult,
  LessonNode,
  CourseModuleNode,
  UpdateLessonPayload,
  UpdateModulePayload,
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

export async function getCourseCurriculum(courseId: string) {
  return apiClient<CourseCurriculum>({
    method: "GET",
    path: `/api/courses/${courseId}/curriculum`
  });
}

export async function validateCoursePublish(courseId: string) {
  return apiClient<CoursePublishValidationResult>({
    method: "GET",
    path: `/api/courses/${courseId}/publish-validation`
  });
}

export async function listCourseVersions(courseId: string) {
  return apiClient<CourseVersionMetadata[]>({
    method: "GET",
    path: `/api/courses/${courseId}/versions`
  });
}

export async function getCourseVersion(courseId: string, versionId: string) {
  return apiClient<CourseVersionDetails>({
    method: "GET",
    path: `/api/courses/${courseId}/versions/${versionId}`
  });
}

export async function publishCourse(courseId: string) {
  return apiClient<CourseVersionMetadata>({
    method: "POST",
    path: `/api/courses/${courseId}/publish`
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

export async function createModule(courseId: string, payload: CreateModulePayload) {
  return apiClient<CourseModuleNode>({
    body: payload,
    method: "POST",
    path: `/api/courses/${courseId}/modules`
  });
}

export async function updateModule(
  courseId: string,
  moduleId: string,
  payload: UpdateModulePayload
) {
  return apiClient<CourseModuleNode>({
    body: payload,
    method: "PATCH",
    path: `/api/courses/${courseId}/modules/${moduleId}`
  });
}

export async function archiveModule(courseId: string, moduleId: string) {
  return apiClient<CourseModuleNode>({
    method: "DELETE",
    path: `/api/courses/${courseId}/modules/${moduleId}`
  });
}

export async function createLesson(moduleId: string, payload: CreateLessonPayload) {
  return apiClient<LessonNode>({
    body: payload,
    method: "POST",
    path: `/api/modules/${moduleId}/lessons`
  });
}

export async function updateLesson(lessonId: string, payload: UpdateLessonPayload) {
  return apiClient<LessonNode>({
    body: payload,
    method: "PATCH",
    path: `/api/lessons/${lessonId}`
  });
}

export async function archiveLesson(lessonId: string) {
  return apiClient<LessonNode>({
    method: "DELETE",
    path: `/api/lessons/${lessonId}`
  });
}
