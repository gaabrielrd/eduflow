import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CourseVersionsScreen } from "@/components/courses/course-versions-screen";
import {
  getCourseById,
  listCourseVersions
} from "@/lib/courses/course-service";
import type {
  Course,
  CourseVersionMetadata
} from "@/lib/courses/course-types";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock("@/lib/courses/course-service", () => ({
  getCourseById: vi.fn(),
  listCourseVersions: vi.fn()
}));

const getCourseByIdMock = vi.mocked(getCourseById);
const listCourseVersionsMock = vi.mocked(listCourseVersions);

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

const baseCourse: Course = {
  createdAt: "2026-06-22T12:00:00.000Z",
  createdById: "user-1",
  description: "Curso publicado",
  id: "course-1",
  organizationId: "org-1",
  slug: "curso-publicado",
  status: "PUBLISHED",
  title: "Curso publicado",
  updatedAt: "2026-06-22T12:00:00.000Z"
};

const baseVersion: CourseVersionMetadata = {
  courseId: "course-1",
  createdAt: "2026-06-22T14:00:00.000Z",
  description: "Curso publicado",
  id: "version-1",
  organizationId: "org-1",
  publishedAt: "2026-06-22T14:00:00.000Z",
  publishedBy: {
    id: "user-1",
    name: "Gabriel Roda"
  },
  publishedById: "user-1",
  status: "PUBLISHED",
  title: "Curso publicado",
  updatedAt: "2026-06-22T14:00:00.000Z",
  versionNumber: 1
};

describe("CourseVersionsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCourseByIdMock.mockResolvedValue(baseCourse);
    listCourseVersionsMock.mockResolvedValue([baseVersion]);
  });

  it("shows loading state while versions are fetched", () => {
    const pendingVersions = deferredPromise<CourseVersionMetadata[]>();

    getCourseByIdMock.mockResolvedValue(baseCourse);
    listCourseVersionsMock.mockReturnValue(pendingVersions.promise);

    render(createElement(CourseVersionsScreen, { courseId: "course-1" }));

    expect(screen.getByText("Carregando historico de versoes")).toBeTruthy();
  });

  it("shows empty state when no versions exist", async () => {
    listCourseVersionsMock.mockResolvedValue([]);

    render(createElement(CourseVersionsScreen, { courseId: "course-1" }));

    expect(await screen.findByText("Nenhuma versao publicada")).toBeTruthy();
    expect(
      screen.getAllByRole("link", { name: "Voltar para detalhes" })[0]
    ).toHaveAttribute("href", "/app/courses/course-1");
  });

  it("shows an error state with retry when versions fail to load", async () => {
    listCourseVersionsMock.mockRejectedValueOnce(new Error("Falha ao carregar"));

    render(createElement(CourseVersionsScreen, { courseId: "course-1" }));

    expect(await screen.findByText("Falha ao carregar")).toBeTruthy();

    listCourseVersionsMock.mockResolvedValueOnce([baseVersion]);
    screen.getByRole("button", { name: "Tentar novamente" }).click();

    await waitFor(() => {
      expect(screen.getByText("Versao 1")).toBeTruthy();
    });
  });

  it("shows version rows with publisher and inspect links", async () => {
    render(createElement(CourseVersionsScreen, { courseId: "course-1" }));

    expect(await screen.findByText("Versao 1")).toBeTruthy();
    expect(screen.getByText("Curso publicado")).toBeTruthy();
    expect(screen.getByText("Gabriel Roda")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Inspecionar metadados" })
    ).toHaveAttribute("href", "/app/courses/course-1/versions/version-1");
  });

  it("falls back to publisher id when publisher metadata is unavailable", async () => {
    listCourseVersionsMock.mockResolvedValue([{ ...baseVersion, publishedBy: undefined }]);

    render(createElement(CourseVersionsScreen, { courseId: "course-1" }));

    expect(await screen.findByText("user-1")).toBeTruthy();
  });
});
