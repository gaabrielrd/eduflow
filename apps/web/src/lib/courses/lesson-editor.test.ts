import { describe, expect, it } from "vitest";
import type { ContentBlock } from "@eduflow/types";

import type { LessonNode } from "@/lib/courses/course-types";
import {
  createEditorBlock,
  getPlainTextFromRichText,
  getRichTextEditorContent,
  getLessonEditorInitialBlocks,
  hasRichTextMarkup,
  initialLessonEditorState,
  lessonEditorReducer,
  normalizeContentDocument
} from "@/lib/courses/lesson-editor";

const baseLesson: LessonNode = {
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
  estimatedDurationMinutes: null,
  id: "lesson-1",
  isPreview: false,
  moduleId: "module-1",
  position: 1,
  status: "ACTIVE",
  title: "Aula original",
  updatedAt: "2026-06-24T12:00:00.000Z"
};

describe("lesson-editor", () => {
  it("normalizes malformed content without crashing", () => {
    expect(
      normalizeContentDocument({
        version: 1,
        blocks: [
          {
            id: "valid-1",
            type: "paragraph",
            props: {
              text: "Valido"
            }
          },
          {
            id: "invalid-1",
            type: "heading",
            props: {
              level: 9
            }
          }
        ]
      }).blocks
    ).toEqual([
      {
        id: "valid-1",
        type: "paragraph",
        props: {
          text: "Valido"
        }
      }
    ]);
  });

  it("duplicates blocks immutably and preserves props with a new id", () => {
    const initializedState = lessonEditorReducer(initialLessonEditorState, {
      type: "initialize",
      lesson: baseLesson,
      blocks: getLessonEditorInitialBlocks(baseLesson)
    });

    const nextState = lessonEditorReducer(initializedState, {
      type: "duplicate-block",
      blockId: "heading-1",
      duplicateId: "heading-copy"
    });

    expect(initializedState.blocks).toHaveLength(2);
    expect(nextState.blocks).toHaveLength(3);
    expect(nextState.blocks[1]).toEqual({
      ...initializedState.blocks[0],
      id: "heading-copy"
    });
    expect(nextState.blocks[1]).not.toBe(initializedState.blocks[0]);
    expect(nextState.selectedBlockId).toBe("heading-copy");
  });

  it("moves selection deterministically when removing the selected block", () => {
    const initializedState = lessonEditorReducer(initialLessonEditorState, {
      type: "initialize",
      lesson: baseLesson,
      blocks: getLessonEditorInitialBlocks(baseLesson)
    });
    const selectedState = lessonEditorReducer(initializedState, {
      type: "select-block",
      blockId: "heading-1"
    });

    const nextState = lessonEditorReducer(selectedState, {
      type: "remove-block",
      blockId: "heading-1"
    });

    expect(nextState.blocks).toEqual([
      {
        id: "paragraph-1",
        type: "paragraph",
        props: {
          text: "Paragrafo original"
        }
      }
    ]);
    expect(nextState.selectedBlockId).toBe("paragraph-1");
  });

  it("moves a block up when there is a previous neighbor", () => {
    const initializedState = lessonEditorReducer(initialLessonEditorState, {
      type: "initialize",
      lesson: baseLesson,
      blocks: getLessonEditorInitialBlocks(baseLesson)
    });
    const selectedState = lessonEditorReducer(initializedState, {
      type: "select-block",
      blockId: "paragraph-1"
    });

    const nextState = lessonEditorReducer(selectedState, {
      type: "move-block",
      blockId: "paragraph-1",
      direction: "up"
    });

    expect(nextState.blocks.map((block) => block.id)).toEqual(["paragraph-1", "heading-1"]);
    expect(nextState.selectedBlockId).toBe("paragraph-1");
    expect(nextState.isDirty).toBe(true);
  });

  it("moves a block down when there is a next neighbor", () => {
    const initializedState = lessonEditorReducer(initialLessonEditorState, {
      type: "initialize",
      lesson: baseLesson,
      blocks: getLessonEditorInitialBlocks(baseLesson)
    });
    const selectedState = lessonEditorReducer(initializedState, {
      type: "select-block",
      blockId: "heading-1"
    });

    const nextState = lessonEditorReducer(selectedState, {
      type: "move-block",
      blockId: "heading-1",
      direction: "down"
    });

    expect(nextState.blocks.map((block) => block.id)).toEqual(["paragraph-1", "heading-1"]);
    expect(nextState.selectedBlockId).toBe("heading-1");
    expect(nextState.isDirty).toBe(true);
  });

  it("does not change state when moving the first block up", () => {
    const initializedState = lessonEditorReducer(initialLessonEditorState, {
      type: "initialize",
      lesson: baseLesson,
      blocks: getLessonEditorInitialBlocks(baseLesson)
    });

    const nextState = lessonEditorReducer(initializedState, {
      type: "move-block",
      blockId: "heading-1",
      direction: "up"
    });

    expect(nextState).toBe(initializedState);
    expect(nextState.isDirty).toBe(false);
  });

  it("does not change state when moving the last block down", () => {
    const initializedState = lessonEditorReducer(initialLessonEditorState, {
      type: "initialize",
      lesson: baseLesson,
      blocks: getLessonEditorInitialBlocks(baseLesson)
    });

    const nextState = lessonEditorReducer(initializedState, {
      type: "move-block",
      blockId: "paragraph-1",
      direction: "down"
    });

    expect(nextState).toBe(initializedState);
    expect(nextState.isDirty).toBe(false);
  });

  it("creates all supported block types with the shared schema shape", () => {
    expect(
      [
        "heading",
        "paragraph",
        "quote",
        "callout",
        "divider",
        "image",
        "video",
        "file"
      ].map((type) => createEditorBlock(type as ContentBlock["type"]).type)
    ).toEqual([
      "heading",
      "paragraph",
      "quote",
      "callout",
      "divider",
      "image",
      "video",
      "file"
    ]);
  });

  it("converts plain text into valid rich text editor content", () => {
    expect(getRichTextEditorContent("Primeira linha\n\nSegunda linha")).toBe(
      "<p>Primeira linha</p><p>Segunda linha</p>"
    );
  });

  it("extracts readable plain text from stored html", () => {
    expect(getPlainTextFromRichText("<p><strong>Resumo</strong> do bloco</p>")).toBe(
      "Resumo do bloco"
    );
  });

  it("detects stored rich text markup without breaking plain text", () => {
    expect(hasRichTextMarkup("<p>Com markup</p>")).toBe(true);
    expect(hasRichTextMarkup("Texto simples")).toBe(false);
  });
});
