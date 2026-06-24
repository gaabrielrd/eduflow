import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { LessonContentEditorScreen } from "@/components/courses/lesson-content-editor-screen";
import { LESSON_EDITOR_PERSIST_DELAY_MS } from "@/lib/courses/lesson-editor";
import {
  getCourseCurriculum,
  updateLesson
} from "@/lib/courses/course-service";
import type { CourseCurriculum } from "@/lib/courses/course-types";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock("@/lib/courses/course-service", () => ({
  getCourseCurriculum: vi.fn(),
  updateLesson: vi.fn()
}));

vi.mock("@/components/courses/rich-text-block-editor", () => ({
  RichTextBlockEditor: ({
    ariaLabel,
    controls: _controls,
    onChange,
    value
  }: {
    ariaLabel?: string;
    controls?: string[];
    onChange: (value: string) => void;
    value: string;
  }) => (
    <textarea
      aria-label={ariaLabel ?? "Editor de texto rico"}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}));

const getCourseCurriculumMock = vi.mocked(getCourseCurriculum);
const updateLessonMock = vi.mocked(updateLesson);

const baseCurriculum: CourseCurriculum = {
  createdAt: "2026-06-24T12:00:00.000Z",
  createdById: "user-1",
  description: "Descricao",
  id: "course-1",
  modules: [
    {
      courseId: "course-1",
      createdAt: "2026-06-24T12:00:00.000Z",
      description: null,
      id: "module-1",
      lessons: [
        {
          contentJson: {
            version: 1,
            blocks: [
              {
                id: "heading-1",
                type: "heading",
                props: {
                  level: 2,
                  text: "Titulo original"
                }
              },
              {
                id: "paragraph-1",
                type: "paragraph",
                props: {
                  text: "Paragrafo original"
                }
              }
            ]
          },
          contentType: "TEXT",
          createdAt: "2026-06-24T12:00:00.000Z",
          description: null,
          estimatedDurationMinutes: 12,
          id: "lesson-1",
          isPreview: true,
          moduleId: "module-1",
          position: 1,
          status: "ACTIVE",
          title: "Aula de blocos",
          updatedAt: "2026-06-24T12:00:00.000Z"
        }
      ],
      position: 1,
      status: "ACTIVE",
      title: "Modulo 1",
      updatedAt: "2026-06-24T12:00:00.000Z"
    }
  ],
  organizationId: "org-1",
  slug: "curso-de-blocos",
  status: "DRAFT",
  title: "Curso de blocos",
  updatedAt: "2026-06-24T12:00:00.000Z"
};

describe("LessonContentEditorScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("loads lesson metadata and existing content", async () => {
    getCourseCurriculumMock.mockResolvedValue(baseCurriculum);

    render(
      createElement(LessonContentEditorScreen, {
        courseId: "course-1",
        lessonId: "lesson-1"
      })
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Aula de blocos" })
    ).toBeTruthy();
    expect(screen.getByText("TEXT")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Preview" })).toBeTruthy();
    expect((await screen.findAllByText("Titulo original")).length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue("Paragrafo original")).toBeTruthy();
  });

  it("shows the empty state when the lesson has no blocks", async () => {
    getCourseCurriculumMock.mockResolvedValue({
      ...baseCurriculum,
      modules: [
        {
          ...baseCurriculum.modules[0]!,
          lessons: [
            {
              ...baseCurriculum.modules[0]!.lessons[0]!,
              contentJson: {
                version: 1,
                blocks: []
              }
            }
          ]
        }
      ]
    });

    render(
      createElement(LessonContentEditorScreen, {
        courseId: "course-1",
        lessonId: "lesson-1"
      })
    );

    expect(await screen.findByText("Nenhum bloco criado ainda")).toBeTruthy();
  });

  it("adds every supported block type locally", async () => {
    getCourseCurriculumMock.mockResolvedValue({
      ...baseCurriculum,
      modules: [
        {
          ...baseCurriculum.modules[0]!,
          lessons: [
            {
              ...baseCurriculum.modules[0]!.lessons[0]!,
              contentJson: {
                version: 1,
                blocks: []
              }
            }
          ]
        }
      ]
    });

    render(
      createElement(LessonContentEditorScreen, {
        courseId: "course-1",
        lessonId: "lesson-1"
      })
    );

    expect(await screen.findByText("Nenhum bloco criado ainda")).toBeTruthy();

    for (const label of [
      "Heading",
      "Paragraph",
      "Quote",
      "Callout",
      "Divider",
      "Image",
      "Video",
      "File"
    ]) {
      openMenu(screen.getAllByRole("button", { name: "Adicionar bloco" })[0]!);
      fireEvent.click(await screen.findByRole("menuitem", { name: label }));
    }

    expect(screen.getAllByLabelText("Acoes do bloco")).toHaveLength(8);
  });

  it("allows selecting, duplicating and removing blocks locally", async () => {
    getCourseCurriculumMock.mockResolvedValue(baseCurriculum);

    render(
      createElement(LessonContentEditorScreen, {
        courseId: "course-1",
        lessonId: "lesson-1"
      })
    );

    expect((await screen.findAllByText("Titulo original")).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByDisplayValue("Paragrafo original"));
    expect(screen.getByDisplayValue("Paragrafo original")).toBeTruthy();

    openMenu(screen.getAllByLabelText("Acoes do bloco")[1]!);
    fireEvent.click(await screen.findByRole("menuitem", { name: "Duplicar bloco" }));

    await waitFor(() => {
      expect(screen.getAllByLabelText("Acoes do bloco")).toHaveLength(3);
    });

    openMenu(screen.getAllByLabelText("Acoes do bloco")[1]!);
    fireEvent.click(await screen.findByRole("menuitem", { name: "Remover bloco" }));

    await waitFor(() => {
      expect(screen.getAllByLabelText("Acoes do bloco")).toHaveLength(2);
    });
  });

  it("saves changes to the api after the debounce delay", async () => {
    getCourseCurriculumMock.mockResolvedValue(baseCurriculum);
    updateLessonMock.mockResolvedValue(baseCurriculum.modules[0]!.lessons[0]!);

    render(
      createElement(LessonContentEditorScreen, {
        courseId: "course-1",
        lessonId: "lesson-1"
      })
    );

    expect((await screen.findAllByText("Titulo original")).length).toBeGreaterThan(0);

    vi.useFakeTimers();

    fireEvent.click(screen.getAllByText("Titulo original")[0]!);
    fireEvent.input(screen.getByDisplayValue("Titulo original"), {
      target: {
        value: "<p><strong>Titulo atualizado</strong></p>"
      }
    });

    expect(updateLessonMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(LESSON_EDITOR_PERSIST_DELAY_MS - 1);
    });
    expect(updateLessonMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
      await Promise.resolve();
    });

    expect(updateLessonMock).toHaveBeenCalledWith("lesson-1", {
      contentJson: {
        version: 1,
        blocks: [
          {
            id: "heading-1",
            type: "heading",
            props: {
              level: 2,
              text: "<p><strong>Titulo atualizado</strong></p>"
            }
          },
          {
            id: "paragraph-1",
            type: "paragraph",
            props: {
              text: "Paragrafo original"
            }
          }
        ]
      }
    });
  });

  it("opens and closes the preview aside from the header button", async () => {
    getCourseCurriculumMock.mockResolvedValue(baseCurriculum);

    render(
      createElement(LessonContentEditorScreen, {
        courseId: "course-1",
        lessonId: "lesson-1"
      })
    );

    await screen.findByRole("heading", { level: 1, name: "Aula de blocos" });

    fireEvent.click(screen.getByRole("button", { name: "Preview" }));

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Preview da aula")).toBeTruthy();
    expect(screen.getAllByText("Paragrafo original").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("updates the preview immediately when inline rich text changes", async () => {
    getCourseCurriculumMock.mockResolvedValue(baseCurriculum);

    render(
      createElement(LessonContentEditorScreen, {
        courseId: "course-1",
        lessonId: "lesson-1"
      })
    );

    await screen.findByRole("heading", { level: 1, name: "Aula de blocos" });

    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    await screen.findByRole("dialog");

    fireEvent.change(screen.getByDisplayValue("Paragrafo original"), {
      target: {
        value: "<p><strong>Paragrafo atualizado</strong> com preview</p>"
      }
    });

    await waitFor(() => {
      expect(screen.getAllByText("Paragrafo atualizado com preview").length).toBeGreaterThan(0);
    });
  });

  it("shows the empty preview state when no blocks exist", async () => {
    getCourseCurriculumMock.mockResolvedValue({
      ...baseCurriculum,
      modules: [
        {
          ...baseCurriculum.modules[0]!,
          lessons: [
            {
              ...baseCurriculum.modules[0]!.lessons[0]!,
              contentJson: {
                version: 1,
                blocks: []
              }
            }
          ]
        }
      ]
    });

    render(
      createElement(LessonContentEditorScreen, {
        courseId: "course-1",
        lessonId: "lesson-1"
      })
    );

    await screen.findByText("Nenhum bloco criado ainda");
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));

    expect(await screen.findByText("Preview vazio")).toBeTruthy();
  });

  it("falls back safely when the lesson content is malformed", async () => {
    getCourseCurriculumMock.mockResolvedValue({
      ...baseCurriculum,
      modules: [
        {
          ...baseCurriculum.modules[0]!,
          lessons: [
            {
              ...baseCurriculum.modules[0]!.lessons[0]!,
              contentJson: {
                version: 1,
                blocks: [
                  {
                    id: "broken-heading",
                    type: "heading",
                    props: {
                      level: 9
                    }
                  }
                ]
              } as never
            }
          ]
        }
      ]
    });

    render(
      createElement(LessonContentEditorScreen, {
        courseId: "course-1",
        lessonId: "lesson-1"
      })
    );

    expect(await screen.findByText("Nenhum bloco criado ainda")).toBeTruthy();
  });
});

function openMenu(trigger: HTMLElement) {
  fireEvent.pointerDown(trigger, {
    button: 0,
    ctrlKey: false
  });
}
