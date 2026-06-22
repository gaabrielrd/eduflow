import type { BadgeProps } from "@eduflow/ui";
import type { CourseStatus } from "@/lib/courses/course-types";

export function formatCourseStatus(status: CourseStatus) {
  if (status === "PUBLISHED") {
    return "Publicado";
  }

  if (status === "ARCHIVED") {
    return "Arquivado";
  }

  return "Rascunho";
}

export function getCourseStatusVariant(
  status: CourseStatus
): NonNullable<BadgeProps["variant"]> {
  if (status === "PUBLISHED") {
    return "success";
  }

  if (status === "ARCHIVED") {
    return "neutral";
  }

  return "secondary";
}

export function formatCourseDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}
