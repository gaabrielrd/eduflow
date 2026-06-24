"use client";

import {
  ContentRenderer,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState
} from "@eduflow/ui";
import type { ContentDocument } from "@eduflow/types";

type LessonPreviewAsideProps = {
  content: ContentDocument;
  lessonTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LessonPreviewAside({
  content,
  lessonTitle,
  open,
  onOpenChange
}: LessonPreviewAsideProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-auto right-0 top-0 h-[100svh] w-full max-w-[42rem] translate-x-0 translate-y-0 rounded-none border-0 border-l border-border p-0 sm:w-[min(100vw,42rem)]">
        <div className="flex h-full flex-col bg-card text-card-foreground">
          <header className="border-b border-border/70 px-5 py-4 sm:px-6">
            <DialogTitle>Preview da aula</DialogTitle>
            <DialogDescription>
              Renderizacao atual de {lessonTitle} com as alteracoes ainda em edicao.
            </DialogDescription>
          </header>
          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
            {content.blocks.length === 0 ? (
              <EmptyState
                description="O preview aparecera assim que a aula tiver pelo menos um bloco."
                title="Preview vazio"
              />
            ) : (
              <ContentRenderer className="max-w-none" content={content} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
