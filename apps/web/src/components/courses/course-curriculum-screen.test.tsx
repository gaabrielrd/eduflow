import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CourseCurriculumScreen } from "@/components/courses/course-curriculum-screen";
import { useSession } from "@/hooks/use-session";
import {
  archiveLesson,
  archiveModule,
  createLesson,
  createModule,
  getCourseCurriculum,
  updateLesson,
  updateModule
} from "@/lib/courses/course-service";
import type { CourseCurriculum } from "@/lib/courses/course-types";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

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
  archiveLesson: vi.fn(),
  archiveModule: vi.fn(),
  createLesson: vi.fn(),
  createModule: vi.fn(),
  getCourseCurriculum: vi.fn(),
  updateLesson: vi.fn(),
  updateModule: vi.fn()
}));

const useSessionMock = vi.mocked(useSession);
const getCourseCurriculumMock = vi.mocked(getCourseCurriculum);
const createModuleMock = vi.mocked(createModule);
const updateModuleMock = vi.mocked(updateModule);
const archiveModuleMock = vi.mocked(archiveModule);
const createLessonMock = vi.mocked(createLesson);
const updateLessonMock = vi.mocked(updateLesson);
const archiveLessonMock = vi.mocked(archiveLesson);

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

const baseCurriculum: CourseCurriculum = {
  createdAt: "2026-06-22T12:00:00.000Z",
  createdById: "user-1",
  description: "Descricao do curso",
  id: "course-1",
  modules: [
    {
      courseId: "course-1",
      createdAt: "2026-06-22T12:00:00.000Z",
      description: null,
      id: "module-1",
      lessons: [
        {
          contentJson: { version: 1, blocks: [] },
          contentType: "TEXT",
          createdAt: "2026-06-22T12:00:00.000Z",
          description: null,
          estimatedDurationMinutes: null,
          id: "lesson-1",
          isPreview: false,
          moduleId: "module-1",
          position: 1,
          status: "ACTIVE",
          title: "Aula inicial",
          updatedAt: "2026-06-22T12:00:00.000Z"
        }
      ],
      position: 1,
      status: "ACTIVE",
      title: "Modulo inicial",
      updatedAt: "2026-06-22T12:00:00.000Z"
    }
  ],
  organizationId: "org-1",
  slug: "curso-curriculo",
  status: "DRAFT",
  title: "Curso de curriculo",
  updatedAt: "2026-06-22T12:00:00.000Z"
};

describe("CourseCurriculumScreen", () => {
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

  it("shows loading state while curriculum is being fetched", () => {
    const pendingRequest = deferredPromise<CourseCurriculum>();
    getCourseCurriculumMock.mockReturnValue(pendingRequest.promise);

    render(createElement(CourseCurriculumScreen, { courseId: "course-1" }));

    expect(screen.getByText("Carregando curriculo do curso")).toBeTruthy();
  });

  it("shows empty state when the course has no modules", async () => {
    getCourseCurriculumMock.mockResolvedValue({
      ...baseCurriculum,
      modules: []
    });

    render(createElement(CourseCurriculumScreen, { courseId: "course-1" }));

    expect(await screen.findByText("Nenhum modulo criado ainda")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Criar primeiro modulo" })).toBeTruthy();
  });

  it("shows the viewer empty state without authoring actions when the course has no modules", async () => {
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
    getCourseCurriculumMock.mockResolvedValue({
      ...baseCurriculum,
      modules: []
    });

    render(createElement(CourseCurriculumScreen, { courseId: "course-1" }));

    expect(await screen.findByText("Nenhum modulo criado ainda")).toBeTruthy();
    expect(screen.getByText("Este curso ainda nao possui modulos visiveis.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Criar primeiro modulo" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Criar modulo" })).toBeNull();
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
    getCourseCurriculumMock.mockResolvedValue(baseCurriculum);

    render(createElement(CourseCurriculumScreen, { courseId: "course-1" }));

    expect(await screen.findByText("Modulo inicial")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Criar modulo" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Criar aula" })).toBeNull();
  });

  it("creates a module and renders it in the list", async () => {
    getCourseCurriculumMock.mockResolvedValue(baseCurriculum);
    createModuleMock.mockResolvedValue({
      courseId: "course-1",
      createdAt: "2026-06-22T13:00:00.000Z",
      description: null,
      id: "module-2",
      position: 2,
      status: "ACTIVE",
      title: "Modulo avancado",
      updatedAt: "2026-06-22T13:00:00.000Z"
    });

    render(createElement(CourseCurriculumScreen, { courseId: "course-1" }));

    expect(await screen.findByText("Modulo inicial")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Criar modulo" }));
    fireEvent.input(screen.getByLabelText("Titulo do modulo"), {
      target: { value: "Modulo avancado" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar modulo" }));

    await waitFor(() => {
      expect(createModuleMock).toHaveBeenCalledWith("course-1", {
        title: "Modulo avancado"
      });
    });

    expect(await screen.findByText("Modulo avancado")).toBeTruthy();
  });

  it("edits module and lesson titles", async () => {
    getCourseCurriculumMock.mockResolvedValue(baseCurriculum);
    updateModuleMock.mockResolvedValue({
      ...baseCurriculum.modules[0],
      lessons: undefined as never,
      title: "Modulo renomeado"
    });
    updateLessonMock.mockResolvedValue({
      ...baseCurriculum.modules[0]!.lessons[0]!,
      title: "Aula renomeada"
    });

    render(createElement(CourseCurriculumScreen, { courseId: "course-1" }));

    expect(await screen.findByText("Modulo inicial")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "Editar titulo" })[0]!);
    fireEvent.input(screen.getByLabelText("Titulo do modulo"), {
      target: { value: "Modulo renomeado" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar titulo" }));

    await waitFor(() => {
      expect(updateModuleMock).toHaveBeenCalledWith("course-1", "module-1", {
        title: "Modulo renomeado"
      });
    });

    expect(await screen.findByText("Modulo renomeado")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "Editar titulo" })[1]!);
    fireEvent.input(screen.getByLabelText("Titulo da aula"), {
      target: { value: "Aula renomeada" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar titulo" }));

    await waitFor(() => {
      expect(updateLessonMock).toHaveBeenCalledWith("lesson-1", {
        title: "Aula renomeada"
      });
    });

    expect(await screen.findByText("Aula renomeada")).toBeTruthy();
  });

  it("renders an entry point to edit the lesson content", async () => {
    getCourseCurriculumMock.mockResolvedValue(baseCurriculum);

    render(createElement(CourseCurriculumScreen, { courseId: "course-1" }));

    expect(await screen.findByText("Modulo inicial")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Editar conteudo" })).toHaveAttribute(
      "href",
      "/app/courses/course-1/lessons/lesson-1/edit"
    );
  });

  it("creates a lesson with the default text draft payload", async () => {
    getCourseCurriculumMock.mockResolvedValue(baseCurriculum);
    createLessonMock.mockResolvedValue({
      contentJson: { version: 1, blocks: [] },
      contentType: "TEXT",
      createdAt: "2026-06-22T13:00:00.000Z",
      description: null,
      estimatedDurationMinutes: null,
      id: "lesson-2",
      isPreview: false,
      moduleId: "module-1",
      position: 2,
      status: "ACTIVE",
      title: "Nova aula",
      updatedAt: "2026-06-22T13:00:00.000Z"
    });

    render(createElement(CourseCurriculumScreen, { courseId: "course-1" }));

    expect(await screen.findByText("Modulo inicial")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Criar aula" }));
    fireEvent.input(screen.getByLabelText("Titulo da aula"), {
      target: { value: "Nova aula" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar aula" }));

    await waitFor(() => {
      expect(createLessonMock).toHaveBeenCalledWith("module-1", {
        contentJson: {
          version: 1,
          blocks: []
        },
        contentType: "TEXT",
        title: "Nova aula"
      });
    });

    expect(await screen.findByText("Nova aula")).toBeTruthy();
  });

  it("requires confirmation before removing module or lesson", async () => {
    getCourseCurriculumMock.mockResolvedValue(baseCurriculum);
    archiveModuleMock.mockResolvedValue(baseCurriculum.modules[0]!);
    archiveLessonMock.mockResolvedValue(baseCurriculum.modules[0]!.lessons[0]!);

    render(createElement(CourseCurriculumScreen, { courseId: "course-1" }));

    expect(await screen.findByText("Modulo inicial")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "Remover" })[1]!);
    fireEvent.click(screen.getByRole("button", { name: "Remover aula" }));

    await waitFor(() => {
      expect(archiveLessonMock).toHaveBeenCalledWith("lesson-1");
    });

    expect(screen.queryByText("Aula inicial")).toBeNull();

    fireEvent.click(screen.getAllByRole("button", { name: "Remover" })[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Remover modulo" }));

    await waitFor(() => {
      expect(archiveModuleMock).toHaveBeenCalledWith("course-1", "module-1");
    });

    expect(screen.queryByText("Modulo inicial")).toBeNull();
  });

  it("shows the error state when curriculum loading fails", async () => {
    getCourseCurriculumMock.mockRejectedValue(new Error("Falha ao carregar"));

    render(createElement(CourseCurriculumScreen, { courseId: "course-1" }));

    expect(await screen.findByText("Nao foi possivel carregar o curriculo")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeTruthy();
  });
});
