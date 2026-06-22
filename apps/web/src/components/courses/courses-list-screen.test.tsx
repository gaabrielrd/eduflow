import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CoursesListScreen } from "@/components/courses/courses-list-screen";
import { useSession } from "@/hooks/use-session";
import { listCourses } from "@/lib/courses/course-service";
import type { Course } from "@/lib/courses/course-types";
import {
  render,
  screen,
  waitFor
} from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock("@/hooks/use-session", () => ({
  useSession: vi.fn()
}));

vi.mock("@/lib/courses/course-service", () => ({
  listCourses: vi.fn()
}));

const useSessionMock = vi.mocked(useSession);
const listCoursesMock = vi.mocked(listCourses);

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

describe("CoursesListScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();

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
          role: "MANAGER",
          slug: "eduflow-studio"
        }
      ],
      refreshSession: vi.fn(),
      register: vi.fn(),
      session: null,
      setActiveOrganizationId: vi.fn(),
      user: {
        email: "user@eduflow.dev",
        id: "user-1",
        name: "User"
      }
    });
  });

  it("shows loading state while courses are being fetched", () => {
    const pendingRequest = deferredPromise<Course[]>();
    listCoursesMock.mockReturnValue(pendingRequest.promise);

    render(createElement(CoursesListScreen));

    expect(screen.getByText("Carregando catalogo de cursos")).toBeTruthy();
  });

  it("shows empty state when no courses are returned", async () => {
    listCoursesMock.mockResolvedValue([]);

    render(createElement(CoursesListScreen));

    expect(await screen.findByText("Nenhum curso encontrado")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Criar primeiro curso" })).toBeTruthy();
  });

  it("renders courses and the authoring action for authoring roles", async () => {
    listCoursesMock.mockResolvedValue([
      {
        createdAt: "2026-06-22T12:00:00.000Z",
        createdById: "user-1",
        description: "Primeiro curso de onboarding",
        id: "course-1",
        organizationId: "org-1",
        slug: "primeiro-curso",
        status: "DRAFT",
        title: "Primeiro curso",
        updatedAt: "2026-06-22T13:00:00.000Z"
      }
    ]);

    render(createElement(CoursesListScreen));

    expect(await screen.findByText("Primeiro curso")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Novo curso" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Abrir detalhes" })).toBeTruthy();
  });

  it("shows error state and retry affordance when loading fails", async () => {
    listCoursesMock.mockRejectedValue(new Error("Falha ao carregar"));

    render(createElement(CoursesListScreen));

    expect(await screen.findByText("Nao foi possivel carregar os cursos")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeTruthy();
  });

  it("hides authoring actions for non-authoring roles", async () => {
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
          role: "STUDENT",
          slug: "eduflow-studio"
        }
      ],
      refreshSession: vi.fn(),
      register: vi.fn(),
      session: null,
      setActiveOrganizationId: vi.fn(),
      user: {
        email: "student@eduflow.dev",
        id: "user-2",
        name: "Student"
      }
    });
    listCoursesMock.mockResolvedValue([
      {
        createdAt: "2026-06-22T12:00:00.000Z",
        createdById: "user-1",
        description: null,
        id: "course-1",
        organizationId: "org-1",
        slug: "primeiro-curso",
        status: "DRAFT",
        title: "Primeiro curso",
        updatedAt: "2026-06-22T13:00:00.000Z"
      }
    ]);

    render(createElement(CoursesListScreen));

    await waitFor(() => {
      expect(screen.getByText("Primeiro curso")).toBeTruthy();
    });

    expect(screen.queryByRole("link", { name: "Novo curso" })).toBeNull();
  });
});
