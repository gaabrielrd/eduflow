import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CourseDetailsScreen } from "@/components/courses/course-details-screen";
import { useSession } from "@/hooks/use-session";
import { ApiError } from "@/lib/api/api-client";
import {
  getCourseById,
  publishCourse,
  validateCoursePublish,
} from "@/lib/courses/course-service";
import type { Course, CourseVersionMetadata } from "@/lib/courses/course-types";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/hooks/use-session", () => ({
  useSession: vi.fn(),
}));

vi.mock("@/lib/courses/course-service", () => ({
  getCourseById: vi.fn(),
  publishCourse: vi.fn(),
  validateCoursePublish: vi.fn(),
}));

const useSessionMock = vi.mocked(useSession);
const getCourseByIdMock = vi.mocked(getCourseById);
const publishCourseMock = vi.mocked(publishCourse);
const validateCoursePublishMock = vi.mocked(validateCoursePublish);

function deferredPromise<T>() {
  let resolvePromise: (value: T) => void = () => undefined;

  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve: resolvePromise,
  };
}

const baseCourse: Course = {
  createdAt: "2026-06-22T12:00:00.000Z",
  createdById: "user-1",
  description: "Curso pronto para revisar",
  id: "course-1",
  organizationId: "org-1",
  slug: "curso-publicavel",
  status: "DRAFT",
  title: "Curso publicavel",
  updatedAt: "2026-06-22T13:00:00.000Z",
};

const publishedCourse: Course = {
  ...baseCourse,
  status: "PUBLISHED",
  updatedAt: "2026-06-22T14:00:00.000Z",
};

const publishedVersion: CourseVersionMetadata = {
  courseId: "course-1",
  createdAt: "2026-06-22T14:00:00.000Z",
  description: "Curso pronto para revisar",
  id: "version-1",
  organizationId: "org-1",
  publishedAt: "2026-06-22T14:00:00.000Z",
  publishedById: "user-1",
  status: "PUBLISHED",
  title: "Curso publicavel",
  updatedAt: "2026-06-22T14:00:00.000Z",
  versionNumber: 3,
};

function mockSession(role: string) {
  useSessionMock.mockReturnValue({
    activeOrganizationId: "org-1",
    createOrganization: vi.fn(),
    hasOrganization: true,
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    organizations: [
      {
        id: "org-1",
        name: "EduFlow Studio",
        role,
        slug: "eduflow-studio",
      },
    ],
    refreshSession: vi.fn(),
    register: vi.fn(),
    session: null,
    setActiveOrganizationId: vi.fn(),
    user: {
      email: "user@eduflow.dev",
      id: "user-1",
      name: "User",
    },
  });
}

describe("CourseDetailsScreen publish workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession("MANAGER");
    getCourseByIdMock.mockResolvedValue(baseCourse);
    validateCoursePublishMock.mockResolvedValue({
      errors: [],
      valid: true,
    });
    publishCourseMock.mockResolvedValue(publishedVersion);
  });

  it("shows publish action for authoring roles", async () => {
    render(createElement(CourseDetailsScreen, { courseId: "course-1" }));

    expect(
      await screen.findByRole("heading", { name: "Curso publicavel" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Publicar" })).toBeTruthy();
  });

  it("hides publish action for students", async () => {
    mockSession("STUDENT");

    render(createElement(CourseDetailsScreen, { courseId: "course-1" }));

    expect(
      await screen.findByRole("heading", { name: "Curso publicavel" }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Publicar" })).toBeNull();
  });

  it("shows publish action for instructors", async () => {
    mockSession("INSTRUCTOR");

    render(createElement(CourseDetailsScreen, { courseId: "course-1" }));

    expect(
      await screen.findByRole("heading", { name: "Curso publicavel" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Publicar" })).toBeTruthy();
  });

  it("loads validation when publish dialog opens", async () => {
    const validationRequest = deferredPromise();
    validateCoursePublishMock.mockReturnValue(validationRequest.promise);

    render(createElement(CourseDetailsScreen, { courseId: "course-1" }));

    fireEvent.click(await screen.findByRole("button", { name: "Publicar" }));

    expect(screen.getByText("Verificando prontidao")).toBeTruthy();

    await waitFor(() => {
      expect(validateCoursePublishMock).toHaveBeenCalledWith("course-1");
    });

    await act(async () => {
      validationRequest.resolve({
        errors: [],
        valid: true,
      });
    });

    expect(await screen.findByText("Checklist aprovado")).toBeTruthy();
  });

  it("shows validation checklist errors and does not publish invalid courses", async () => {
    validateCoursePublishMock.mockResolvedValue({
      errors: [
        {
          code: "COURSE_WITHOUT_MODULES",
          message: "Course must contain at least one active module.",
          path: "modules",
        },
      ],
      valid: false,
    });

    render(createElement(CourseDetailsScreen, { courseId: "course-1" }));

    fireEvent.click(await screen.findByRole("button", { name: "Publicar" }));

    expect(await screen.findByText("Criar pelo menos um modulo")).toBeTruthy();
    expect(screen.getByText("modules")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar publicacao" }),
    );

    expect(publishCourseMock).not.toHaveBeenCalled();
  });

  it("publishes valid courses and shows the version history link", async () => {
    getCourseByIdMock
      .mockResolvedValueOnce(baseCourse)
      .mockResolvedValueOnce(publishedCourse);

    render(createElement(CourseDetailsScreen, { courseId: "course-1" }));

    fireEvent.click(await screen.findByRole("button", { name: "Publicar" }));
    expect(await screen.findByText("Checklist aprovado")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar publicacao" }),
    );

    await waitFor(() => {
      expect(publishCourseMock).toHaveBeenCalledWith("course-1");
    });

    expect(
      await screen.findByText("Versao 3 criada com sucesso."),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Ver historico de versoes" }),
    ).toHaveAttribute("href", "/app/courses/course-1/versions");
    expect(await screen.findByText("Publicado")).toBeTruthy();
  });

  it("shows useful publish failure messages", async () => {
    publishCourseMock.mockRejectedValue(new Error("Falha ao publicar"));

    render(createElement(CourseDetailsScreen, { courseId: "course-1" }));

    fireEvent.click(await screen.findByRole("button", { name: "Publicar" }));
    expect(await screen.findByText("Checklist aprovado")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar publicacao" }),
    );

    expect(await screen.findByText("Falha ao publicar")).toBeTruthy();
  });

  it("shows backend validation returned by publish failure", async () => {
    publishCourseMock.mockRejectedValue(
      new ApiError(
        "Course cannot be published",
        400,
        "Bad Request",
        ["Course cannot be published"],
        {
          validation: {
            errors: [
              {
                code: "LESSON_CONTENT_INVALID",
                message: "Lesson content JSON is invalid.",
                path: "modules.0.lessons.0.contentJson",
              },
            ],
            valid: false,
          },
        },
      ),
    );

    render(createElement(CourseDetailsScreen, { courseId: "course-1" }));

    fireEvent.click(await screen.findByRole("button", { name: "Publicar" }));
    expect(await screen.findByText("Checklist aprovado")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar publicacao" }),
    );

    expect(await screen.findByText("Course cannot be published")).toBeTruthy();
    expect(await screen.findByText("Corrigir conteudo das aulas")).toBeTruthy();
    expect(screen.getByText("modules.0.lessons.0.contentJson")).toBeTruthy();
  });
});
