import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CourseVersionDetailsScreen } from "@/components/courses/course-version-details-screen";
import { getCourseVersion } from "@/lib/courses/course-service";
import type { CourseVersionDetails } from "@/lib/courses/course-types";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock("@/lib/courses/course-service", () => ({
  getCourseVersion: vi.fn()
}));

const getCourseVersionMock = vi.mocked(getCourseVersion);

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

const baseVersion: CourseVersionDetails = {
  courseId: "course-1",
  createdAt: "2026-06-22T14:00:00.000Z",
  description: "Descricao publicada",
  id: "version-1",
  organizationId: "org-1",
  publishedAt: "2026-06-22T14:00:00.000Z",
  publishedBy: {
    id: "user-1",
    name: "Gabriel Roda"
  },
  publishedById: "user-1",
  snapshotMetadata: {
    course: {
      description: "Descricao publicada",
      id: "course-1",
      slug: "curso-publicado",
      title: "Curso publicado"
    },
    lessonCount: 3,
    mediaCount: 2,
    moduleCount: 2,
    schemaVersion: 1
  },
  status: "PUBLISHED",
  title: "Curso publicado",
  updatedAt: "2026-06-22T14:00:00.000Z",
  versionNumber: 4
};

describe("CourseVersionDetailsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCourseVersionMock.mockResolvedValue(baseVersion);
  });

  it("shows loading state while metadata is fetched", () => {
    const pendingVersion = deferredPromise<CourseVersionDetails>();

    getCourseVersionMock.mockReturnValue(pendingVersion.promise);

    render(
      createElement(CourseVersionDetailsScreen, {
        courseId: "course-1",
        versionId: "version-1"
      })
    );

    expect(screen.getByText("Carregando metadados da versao")).toBeTruthy();
  });

  it("shows error state with retry when metadata fails to load", async () => {
    getCourseVersionMock.mockRejectedValueOnce(new Error("Versao indisponivel"));

    render(
      createElement(CourseVersionDetailsScreen, {
        courseId: "course-1",
        versionId: "version-1"
      })
    );

    expect(await screen.findByText("Versao indisponivel")).toBeTruthy();

    getCourseVersionMock.mockResolvedValueOnce(baseVersion);
    screen.getByRole("button", { name: "Tentar novamente" }).click();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Versao 4" })).toBeTruthy();
    });
  });

  it("renders safe version metadata", async () => {
    render(
      createElement(CourseVersionDetailsScreen, {
        courseId: "course-1",
        versionId: "version-1"
      })
    );

    expect(
      await screen.findByRole("heading", { name: "Versao 4" })
    ).toBeTruthy();
    expect(screen.getAllByText("Curso publicado")).toHaveLength(2);
    expect(screen.getAllByText("Descricao publicada")).toHaveLength(2);
    expect(screen.getByText("Gabriel Roda")).toBeTruthy();
    expect(screen.getByText("v1")).toBeTruthy();
    expect(screen.getByText("curso-publicado")).toBeTruthy();
    expect(screen.getAllByText("2")).toHaveLength(2);
    expect(screen.getByText("3")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Voltar para versoes" })
    ).toHaveAttribute("href", "/app/courses/course-1/versions");
  });

  it("requests the selected course version", async () => {
    render(
      createElement(CourseVersionDetailsScreen, {
        courseId: "course-1",
        versionId: "version-1"
      })
    );

    await waitFor(() => {
      expect(getCourseVersionMock).toHaveBeenCalledWith("course-1", "version-1");
    });
  });
});
