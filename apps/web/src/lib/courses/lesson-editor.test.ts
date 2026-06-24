import { describe, expect, it } from "vitest";
import type { ContentBlock } from "@eduflow/types";

import type { LessonNode } from "@/lib/courses/course-types";
import {
  createEditorBlock,
  getLessonEditorInitialBlocks,
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
});
