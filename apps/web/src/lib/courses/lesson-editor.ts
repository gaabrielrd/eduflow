"use client";

import {
  contentBlockSchema,
  type CalloutVariant,
  type ContentBlock,
  type ContentDocument
} from "@eduflow/types";

import type { LessonNode } from "@/lib/courses/course-types";

export const LESSON_EDITOR_PERSIST_DELAY_MS = 600;

export type LessonEditorState = {
  lesson: LessonNode | null;
  blocks: ContentBlock[];
  selectedBlockId: string | null;
  hasHydrated: boolean;
  isDirty: boolean;
  lastSavedAt: string | null;
};

type InitializeLessonEditorAction = {
  type: "initialize";
  lesson: LessonNode;
  blocks: ContentBlock[];
};

type SelectBlockAction = {
  type: "select-block";
  blockId: string | null;
};

type AddBlockAction = {
  type: "add-block";
  block: ContentBlock;
};

type DuplicateBlockAction = {
  type: "duplicate-block";
  blockId: string;
  duplicateId: string;
};

type RemoveBlockAction = {
  type: "remove-block";
  blockId: string;
};

type UpdateBlockAction = {
  type: "update-block";
  blockId: string;
  updater: (block: ContentBlock) => ContentBlock;
};

type MarkPersistedAction = {
  type: "mark-persisted";
  persistedAt: string;
};

export type LessonEditorAction =
  | InitializeLessonEditorAction
  | SelectBlockAction
  | AddBlockAction
  | DuplicateBlockAction
  | RemoveBlockAction
  | UpdateBlockAction
  | MarkPersistedAction;

export const initialLessonEditorState: LessonEditorState = {
  lesson: null,
  blocks: [],
  selectedBlockId: null,
  hasHydrated: false,
  isDirty: false,
  lastSavedAt: null
};

export function lessonEditorReducer(
  state: LessonEditorState,
  action: LessonEditorAction
): LessonEditorState {
  switch (action.type) {
    case "initialize":
      return {
        lesson: action.lesson,
        blocks: action.blocks,
        selectedBlockId: null,
        hasHydrated: true,
        isDirty: false,
        lastSavedAt: null
      };
    case "select-block":
      return {
        ...state,
        selectedBlockId: action.blockId
      };
    case "add-block":
      return {
        ...state,
        blocks: [...state.blocks, action.block],
        selectedBlockId: action.block.id,
        isDirty: true
      };
    case "duplicate-block": {
      const sourceIndex = state.blocks.findIndex((block) => block.id === action.blockId);

      if (sourceIndex === -1) {
        return state;
      }

      const sourceBlock = state.blocks[sourceIndex];
      const duplicate = {
        ...sourceBlock,
        id: action.duplicateId
      } as ContentBlock;
      const nextBlocks = [...state.blocks];

      nextBlocks.splice(sourceIndex + 1, 0, duplicate);

      return {
        ...state,
        blocks: nextBlocks,
        selectedBlockId: duplicate.id,
        isDirty: true
      };
    }
    case "remove-block": {
      const removedIndex = state.blocks.findIndex((block) => block.id === action.blockId);

      if (removedIndex === -1) {
        return state;
      }

      const nextBlocks = state.blocks.filter((block) => block.id !== action.blockId);
      const shouldMoveSelection = state.selectedBlockId === action.blockId;
      const nextSelectedBlock =
        nextBlocks[removedIndex] ?? nextBlocks[removedIndex - 1] ?? null;

      return {
        ...state,
        blocks: nextBlocks,
        selectedBlockId: shouldMoveSelection ? nextSelectedBlock?.id ?? null : state.selectedBlockId,
        isDirty: true
      };
    }
    case "update-block":
      return {
        ...state,
        blocks: state.blocks.map((block) =>
          block.id === action.blockId ? action.updater(block) : block
        ),
        isDirty: true
      };
    case "mark-persisted":
      return {
        ...state,
        isDirty: false,
        lastSavedAt: action.persistedAt
      };
    default:
      return state;
  }
}

export function normalizeContentDocument(content: unknown): ContentDocument {
  return {
    version: 1,
    blocks: normalizeContentBlocks(
      content && typeof content === "object" && "blocks" in content
        ? (content as { blocks?: unknown }).blocks
        : []
    )
  };
}

export function normalizeContentBlocks(blocks: unknown): ContentBlock[] {
  if (!Array.isArray(blocks)) {
    return [];
  }

  return blocks.flatMap((block) => {
    const parsed = contentBlockSchema.safeParse(block);

    return parsed.success ? [parsed.data] : [];
  });
}

let blockIdSequence = 0;

export function createEditorBlock(type: ContentBlock["type"]): ContentBlock {
  const id = createClientBlockId(type);

  switch (type) {
    case "heading":
      return {
        id,
        type,
        props: {
          level: 2,
          text: "Novo titulo"
        }
      };
    case "paragraph":
      return {
        id,
        type,
        props: {
          text: "Novo paragrafo"
        }
      };
    case "quote":
      return {
        id,
        type,
        props: {
          text: "Nova citacao"
        }
      };
    case "callout":
      return {
        id,
        type,
        props: {
          text: "Novo destaque",
          variant: "info"
        }
      };
    case "divider":
      return {
        id,
        type,
        props: {}
      };
    case "image":
      return {
        id,
        type,
        props: {
          caption: "Nova imagem"
        }
      };
    case "video":
      return {
        id,
        type,
        props: {
          title: "Novo video"
        }
      };
    case "file":
      return {
        id,
        type,
        props: {
          title: "Novo arquivo"
        }
      };
    default:
      return assertNever(type);
  }
}

export function createClientBlockId(prefix: string) {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  blockIdSequence += 1;

  return `${prefix}-${Date.now()}-${blockIdSequence}`;
}

export function getBlockTypeLabel(type: ContentBlock["type"]) {
  switch (type) {
    case "heading":
      return "Heading";
    case "paragraph":
      return "Paragraph";
    case "quote":
      return "Quote";
    case "callout":
      return "Callout";
    case "divider":
      return "Divider";
    case "image":
      return "Image";
    case "video":
      return "Video";
    case "file":
      return "File";
    default:
      return assertNever(type);
  }
}

export function getBlockSummary(block: ContentBlock) {
  switch (block.type) {
    case "heading":
      return block.props.text || "Sem texto";
    case "paragraph":
      return getRichTextSummary(block.props.text);
    case "quote":
      return getRichTextSummary(block.props.text);
    case "callout":
      return block.props.title || getRichTextSummary(block.props.text, "Sem conteudo");
    case "divider":
      return "Separador visual";
    case "image":
      return block.props.caption || block.props.alt || "Placeholder de imagem";
    case "video":
      return block.props.title || block.props.caption || "Placeholder de video";
    case "file":
      return block.props.title || block.props.caption || "Placeholder de arquivo";
    default:
      return assertNever(block);
  }
}

export function getCalloutVariantOptions(): CalloutVariant[] {
  return ["info", "success", "warning", "destructive"];
}

export function getLessonEditorInitialBlocks(lesson: LessonNode) {
  return normalizeContentDocument(lesson.contentJson).blocks;
}

export function getRichTextEditorContent(value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return "<p></p>";
  }

  if (hasRichTextMarkup(normalizedValue)) {
    return normalizedValue;
  }

  return normalizedValue
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export function getPlainTextFromRichText(value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return "";
  }

  if (typeof DOMParser !== "undefined") {
    const document = new DOMParser().parseFromString(normalizedValue, "text/html");

    return normalizeSummaryWhitespace(document.body.textContent ?? "");
  }

  return normalizeSummaryWhitespace(
    normalizedValue
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|blockquote|h[1-6])>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  );
}

export function hasRichTextMarkup(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function getRichTextSummary(value: string, fallback = "Sem texto") {
  const summary = getPlainTextFromRichText(value);

  return summary || fallback;
}

function normalizeSummaryWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}
