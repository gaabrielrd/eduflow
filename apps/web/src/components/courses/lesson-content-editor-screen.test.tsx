import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LessonContentEditorScreen } from "@/components/courses/lesson-content-editor-screen";
import { LESSON_EDITOR_PERSIST_DELAY_MS } from "@/lib/courses/lesson-editor";
import {
  getCourseCurriculum,
  updateLesson
} from "@/lib/courses/course-service";
import { listMediaAssets } from "@/lib/media/media-library-service";
import type { MediaAsset } from "@/lib/media/media-types";
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

vi.mock("@/lib/media/media-library-service", () => ({
  listMediaAssets: vi.fn()
}));

vi.mock("@/components/courses/rich-text-block-editor", () => ({
  RichTextBlockEditor: ({
    ariaLabel,
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
const listMediaAssetsMock = vi.mocked(listMediaAssets);
const updateLessonMock = vi.mocked(updateLesson);

const mediaAsset: MediaAsset = {
  createdAt: "2026-06-26T10:00:00.000Z",
  fileName: "hero.png",
  id: "media-1",
  mimeType: "image/png",
  originalName: "Hero image.png",
  readUrl: "https://cdn.eduflow.test/hero.png",
  sizeBytes: 2048,
  status: "READY",
  updatedAt: "2026-06-26T10:00:00.000Z"
};

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
    listMediaAssetsMock.mockResolvedValue([mediaAsset]);
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

  it("reorders blocks upward in the editor list", async () => {
    getCourseCurriculumMock.mockResolvedValue(baseCurriculum);

    render(
      createElement(LessonContentEditorScreen, {
        courseId: "course-1",
        lessonId: "lesson-1"
      })
    );

    expect((await screen.findAllByText("Titulo original")).length).toBeGreaterThan(0);
    expect(getEditorBlockValues()).toEqual(["Titulo original", "Paragrafo original"]);

    fireEvent.click(screen.getByRole("button", { name: "Mover bloco 2 para cima" }));

    await waitFor(() => {
      expect(getEditorBlockValues()).toEqual(["Paragrafo original", "Titulo original"]);
    });
  });

  it("reorders blocks downward in the editor list", async () => {
    getCourseCurriculumMock.mockResolvedValue(baseCurriculum);

    render(
      createElement(LessonContentEditorScreen, {
        courseId: "course-1",
        lessonId: "lesson-1"
      })
    );

    expect((await screen.findAllByText("Titulo original")).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Mover bloco 1 para baixo" }));

    await waitFor(() => {
      expect(getEditorBlockValues()).toEqual(["Paragrafo original", "Titulo original"]);
    });
  });

  it("disables move controls for the first and last blocks", async () => {
    getCourseCurriculumMock.mockResolvedValue(baseCurriculum);

    render(
      createElement(LessonContentEditorScreen, {
        courseId: "course-1",
        lessonId: "lesson-1"
      })
    );

    expect((await screen.findAllByText("Titulo original")).length).toBeGreaterThan(0);

    expect(screen.getByRole("button", { name: "Mover bloco 1 para cima" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Mover bloco 1 para baixo" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Mover bloco 2 para cima" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Mover bloco 2 para baixo" })).toBeDisabled();
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

  it("saves reordered blocks to the api after the debounce delay", async () => {
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

    fireEvent.click(screen.getByRole("button", { name: "Mover bloco 1 para baixo" }));

    expect(updateLessonMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(LESSON_EDITOR_PERSIST_DELAY_MS);
      await Promise.resolve();
    });

    expect(updateLessonMock).toHaveBeenCalledWith("lesson-1", {
      contentJson: {
        version: 1,
        blocks: [
          {
            id: "paragraph-1",
            type: "paragraph",
            props: {
              text: "Paragrafo original"
            }
          },
          {
            id: "heading-1",
            type: "heading",
            props: {
              level: 2,
              text: "Titulo original"
            }
          }
        ]
      }
    });
  });

  it("surfaces save failures without losing local editor state", async () => {
    getCourseCurriculumMock.mockResolvedValue(baseCurriculum);
    updateLessonMock.mockRejectedValue(new Error("Falha no autosave"));

    render(
      createElement(LessonContentEditorScreen, {
        courseId: "course-1",
        lessonId: "lesson-1"
      })
    );

    expect((await screen.findAllByText("Titulo original")).length).toBeGreaterThan(0);

    vi.useFakeTimers();

    fireEvent.change(screen.getByDisplayValue("Paragrafo original"), {
      target: {
        value: "<p>Paragrafo com falha</p>"
      }
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(LESSON_EDITOR_PERSIST_DELAY_MS);
      await Promise.resolve();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(updateLessonMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Falha no autosave")).toBeTruthy();
    expect(screen.getByText("Falha ao salvar")).toBeTruthy();
    expect(screen.queryByText("Salvo")).toBeNull();
    expect(screen.getByDisplayValue("<p>Paragrafo com falha</p>")).toBeTruthy();
    expect(screen.getAllByLabelText("Acoes do bloco")).toHaveLength(2);
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
      expect(screen.getByRole("dialog")).toHaveTextContent("Paragrafo atualizado com preview");
    });
  });

  it("shows the reordered block order in preview", async () => {
    getCourseCurriculumMock.mockResolvedValue(baseCurriculum);

    render(
      createElement(LessonContentEditorScreen, {
        courseId: "course-1",
        lessonId: "lesson-1"
      })
    );

    await screen.findByRole("heading", { level: 1, name: "Aula de blocos" });

    fireEvent.click(screen.getByRole("button", { name: "Mover bloco 1 para baixo" }));

    fireEvent.click(screen.getByRole("button", { name: "Preview" }));

    const dialog = await screen.findByRole("dialog");

    await waitFor(() => {
      const paragraph = within(dialog).getByText("Paragrafo original");
      const heading = within(dialog).getByText("Titulo original");

      expect(paragraph.compareDocumentPosition(heading)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING
      );
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

  it("selects an image asset, stores its assetId, and renders the preview", async () => {
    const user = userEvent.setup();
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
                    id: "image-1",
                    type: "image",
                    props: {
                      caption: "Hero da aula"
                    }
                  }
                ]
              }
            }
          ]
        }
      ]
    });
    updateLessonMock.mockResolvedValue(baseCurriculum.modules[0]!.lessons[0]!);

    render(
      createElement(LessonContentEditorScreen, {
        courseId: "course-1",
        lessonId: "lesson-1"
      })
    );

    expect(await screen.findByText("Nenhuma imagem selecionada ainda.")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Selecionar imagem" }));
    await user.click(await screen.findByText("Hero image.png"));
    await user.click(screen.getByRole("button", { name: "Usar imagem" }));

    expect(await screen.findByText("Hero image.png")).toBeTruthy();

    await waitFor(
      () => {
        expect(updateLessonMock).toHaveBeenCalledWith("lesson-1", {
          contentJson: {
            version: 1,
            blocks: [
              {
                id: "image-1",
                type: "image",
                props: {
                  assetId: "media-1",
                  caption: "Hero da aula"
                }
              }
            ]
          }
        });
      },
      {
        timeout: 2000
      }
    );

    await user.click(screen.getByRole("button", { name: "Preview" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("img", { name: "Hero image.png" })).toHaveAttribute(
      "src",
      mediaAsset.readUrl
    );
    expect(within(dialog).getByText("Hero da aula")).toBeTruthy();
  });
});

function openMenu(trigger: HTMLElement) {
  fireEvent.pointerDown(trigger, {
    button: 0,
    ctrlKey: false
  });
}

function getEditorBlockValues() {
  return screen.getAllByRole("textbox").map((element) => (element as HTMLTextAreaElement).value);
}
