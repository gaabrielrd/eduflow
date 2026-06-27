import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LearnerCoursesScreen } from "@/components/learning/learner-courses-screen";
import { listMyLearningCourses } from "@/lib/learning/learning-service";
import type { MyCourseEnrollment } from "@/lib/learning/learning-types";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock("@/lib/learning/learning-service", () => ({
  listMyLearningCourses: vi.fn()
}));

const listMyLearningCoursesMock = vi.mocked(listMyLearningCourses);

function deferredPromise<T>() {
  let resolvePromise: (value: T) => void = () => undefined;

  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve: resolvePromise
  };
}

describe("LearnerCoursesScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state while enrollments are being fetched", () => {
    const pendingRequest = deferredPromise<MyCourseEnrollment[]>();
    listMyLearningCoursesMock.mockReturnValue(pendingRequest.promise);

    render(createElement(LearnerCoursesScreen));

    expect(screen.getByText("Carregando seus cursos")).toBeTruthy();
  });

  it("shows empty state when no enrollments are returned", async () => {
    listMyLearningCoursesMock.mockResolvedValue([]);

    render(createElement(LearnerCoursesScreen));

    expect(await screen.findByText("Nenhum curso matriculado")).toBeTruthy();
    expect(
      screen.getByText("Voce ainda nao possui matriculas nesta organizacao.")
    ).toBeTruthy();
  });

  it("renders learner enrollments with progress and continue action", async () => {
    listMyLearningCoursesMock.mockResolvedValue([
      {
        id: "enrollment-1",
        courseTitle: "Fundamentos de onboarding",
        courseDescription: "Curso inicial para novos alunos.",
        versionNumber: 3,
        status: "ACTIVE",
        progressPercentage: 67,
        enrolledAt: "2026-06-27T12:00:00.000Z",
        completedAt: null
      },
      {
        id: "enrollment-2",
        courseTitle: "Curso concluido",
        courseDescription: null,
        versionNumber: 1,
        status: "COMPLETED",
        progressPercentage: 100,
        enrolledAt: "2026-06-26T12:00:00.000Z",
        completedAt: "2026-06-27T13:00:00.000Z"
      }
    ]);

    render(createElement(LearnerCoursesScreen));

    expect(await screen.findByText("Fundamentos de onboarding")).toBeTruthy();
    expect(screen.getByText("Curso inicial para novos alunos.")).toBeTruthy();
    expect(screen.getByText("Versao 3")).toBeTruthy();
    expect(screen.getByText("Ativo")).toBeTruthy();
    expect(screen.getByText("67%")).toBeTruthy();
    expect(screen.getByText("Ainda nao concluido")).toBeTruthy();
    expect(screen.getByText("Concluido")).toBeTruthy();
    expect(
      screen.getByText("Este curso ainda nao possui descricao publicada.")
    ).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Continuar" })[0]).toHaveAttribute(
      "href",
      "/app/learn/enrollment-1"
    );
  });

  it("shows error state and retry affordance when loading fails", async () => {
    listMyLearningCoursesMock.mockRejectedValue(new Error("Falha ao carregar"));

    render(createElement(LearnerCoursesScreen));

    expect(await screen.findByText("Nao foi possivel carregar seus cursos")).toBeTruthy();
    expect(screen.getByText("Falha ao carregar")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeTruthy();
  });
});
