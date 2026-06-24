"use client";

import { useEffect, useMemo } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";

import { Button } from "@eduflow/ui";
import {
  getPlainTextFromRichText,
  getRichTextEditorContent
} from "@/lib/courses/lesson-editor";

type RichTextBlockEditorProps = {
  ariaLabel?: string;
  controls?: Array<"bold" | "italic" | "bulletList" | "blockquote">;
  value: string;
  onChange: (html: string) => void;
};

export function RichTextBlockEditor({
  ariaLabel,
  controls = ["bold", "italic", "bulletList", "blockquote"],
  value,
  onChange
}: RichTextBlockEditorProps) {
  const initialContent = useMemo(() => getRichTextEditorContent(value), [value]);
  const editor = useEditor({
    content: initialContent,
    editorProps: {
      attributes: {
        "aria-label": ariaLabel ?? "Editor de texto rico",
        class:
          "min-h-40 rounded-xl border border-input bg-card px-4 py-3 text-sm leading-7 text-card-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      }
    },
    extensions: [StarterKit],
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    }
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentHtml = editor.getHTML();
    const nextHtml = getRichTextEditorContent(value);

    if (currentHtml === nextHtml) {
      return;
    }

    editor.commands.setContent(nextHtml);
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <span className="ml-auto text-xs text-muted-foreground">
          {getPlainTextFromRichText(value).length} caracteres visiveis
        </span>
      </div>
      <BubbleMenu
        editor={editor}
        options={{ placement: "top", strategy: "fixed" }}
        shouldShow={({ editor: currentEditor }) =>
          !currentEditor.state.selection.empty && currentEditor.view.hasFocus()
        }
      >
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card/96 p-1.5 shadow-lg backdrop-blur">
          {controls.includes("bold") ? (
            <ToolbarButton
              active={editor.isActive("bold")}
              label="Bold"
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              B
            </ToolbarButton>
          ) : null}
          {controls.includes("italic") ? (
            <ToolbarButton
              active={editor.isActive("italic")}
              label="Italic"
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              I
            </ToolbarButton>
          ) : null}
          {controls.includes("bulletList") ? (
            <ToolbarButton
              active={editor.isActive("bulletList")}
              label="Lista"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              Lista
            </ToolbarButton>
          ) : null}
          {controls.includes("blockquote") ? (
            <ToolbarButton
              active={editor.isActive("blockquote")}
              label="Citacao"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              Aspas
            </ToolbarButton>
          ) : null}
        </div>
      </BubbleMenu>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  active,
  children,
  label,
  onClick
}: {
  active: boolean;
  children: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      aria-label={label}
      size="sm"
      type="button"
      variant={active ? "secondary" : "outline"}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
