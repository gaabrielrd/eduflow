import type { BadgeProps } from "@eduflow/ui";
import type {
  EnrollmentStatus,
  LessonProgressStatus
} from "@/lib/learning/learning-types";

export function formatLearningDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatOptionalLearningDate(value: string | null) {
  return value ? formatLearningDate(value) : "Ainda nao concluido";
}

export function formatEnrollmentStatus(status: EnrollmentStatus) {
  if (status === "COMPLETED") {
    return "Concluido";
  }

  if (status === "CANCELLED") {
    return "Cancelado";
  }

  return "Ativo";
}

export function getEnrollmentStatusVariant(
  status: EnrollmentStatus
): NonNullable<BadgeProps["variant"]> {
  if (status === "COMPLETED") {
    return "success";
  }

  if (status === "CANCELLED") {
    return "neutral";
  }

  return "secondary";
}

export function formatLessonProgressStatus(status?: LessonProgressStatus) {
  if (status === "COMPLETED") {
    return "Concluida";
  }

  if (status === "IN_PROGRESS") {
    return "Em andamento";
  }

  return "Nao iniciada";
}

export function getLessonProgressStatusVariant(
  status?: LessonProgressStatus
): NonNullable<BadgeProps["variant"]> {
  if (status === "COMPLETED") {
    return "success";
  }

  if (status === "IN_PROGRESS") {
    return "warning";
  }

  return "neutral";
}
