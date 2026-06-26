"use client";

import Link from "next/link";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode
} from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  type ContentRendererMediaAsset,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea
} from "@eduflow/ui";
import { useAppBreadcrumbs } from "@/components/breadcrumb-context";
import { LessonPreviewAside } from "@/components/courses/lesson-preview-aside";
import { formatMediaType } from "@/components/media/media-formatters";
import { MediaPicker } from "@/components/media/media-picker";
import { RichTextBlockEditor } from "@/components/courses/rich-text-block-editor";
import {
  LESSON_EDITOR_PERSIST_DELAY_MS,
  createClientBlockId,
  createEditorBlock,
  getBlockTypeLabel,
  getCalloutVariantOptions,
  getLessonEditorInitialBlocks,
  initialLessonEditorState,
  lessonEditorReducer,
  normalizeContentDocument
} from "@/lib/courses/lesson-editor";
import {
  getCourseCurriculum,
  updateLesson
} from "@/lib/courses/course-service";
import { listMediaAssets } from "@/lib/media/media-library-service";
import type { MediaAsset } from "@/lib/media/media-types";
import { formatFileSize } from "@/lib/media/media-upload-config";
import type {
  CourseCurriculum,
  LessonNode
} from "@/lib/courses/course-types";

type EditorBlock = LessonNode["contentJson"]["blocks"][number];

function DotsIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8A1.25 1.25 0 1 0 3 8.01M8 8A1.25 1.25 0 1 0 8 8.01M13 8A1.25 1.25 0 1 0 13 8.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 12V4M8 4L4.75 7.25M8 4L11.25 7.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 4V12M8 12L4.75 8.75M8 12L11.25 8.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

const blockTypes: Array<EditorBlock["type"]> = [
  "heading",
  "paragraph",
  "quote",
  "callout",
  "divider",
  "image",
  "video",
  "file"
];

type LessonContentEditorScreenProps = {
  courseId: string;
  lessonId: string;
};

export function LessonContentEditorScreen({
  courseId,
  lessonId
}: LessonContentEditorScreenProps) {
  const [curriculum, setCurriculum] = useState<CourseCurriculum | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [mediaLoadErrorMessage, setMediaLoadErrorMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [state, dispatch] = useReducer(lessonEditorReducer, initialLessonEditorState);

  const loadEditor = useCallback(async () => {
    try {
      const nextCurriculum = await getCourseCurriculum(courseId);
      const nextLesson =
        nextCurriculum.modules.flatMap((module) => module.lessons).find((lesson) => lesson.id === lessonId) ??
        null;

      if (!nextLesson) {
        throw new Error("Nao foi possivel localizar a aula solicitada neste curso.");
      }

      const mediaResolution = await listMediaAssets()
        .then((assets) => ({
          assets,
          errorMessage: null
        }))
        .catch((error: unknown) => ({
          assets: [] as MediaAsset[],
          errorMessage:
            error instanceof Error
              ? error.message
              : "Nao foi possivel carregar a biblioteca de midia."
        }));

      setCurriculum(nextCurriculum);
      setMediaAssets(mediaResolution.assets);
      setMediaLoadErrorMessage(mediaResolution.errorMessage);
      dispatch({
        type: "initialize",
        lesson: nextLesson,
        blocks: getLessonEditorInitialBlocks(nextLesson)
      });
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar o editor desta aula."
      );
    } finally {
      setIsLoading(false);
    }
  }, [courseId, lessonId]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void loadEditor();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadEditor]);

  useEffect(() => {
    if (!state.lesson || !state.hasHydrated || !state.isDirty) {
      return;
    }

    const lessonToSave = state.lesson;
    const timer = window.setTimeout(() => {
      setIsSaving(true);
      setSaveErrorMessage(null);

      void updateLesson(lessonToSave.id, {
        contentJson: {
          version: 1,
          blocks: state.blocks
        }
      })
        .then(() => {
          dispatch({
            type: "mark-persisted",
            persistedAt: new Date().toISOString()
          });
        })
        .catch((error: unknown) => {
          setSaveErrorMessage(
            error instanceof Error
              ? error.message
              : "Nao foi possivel salvar o conteudo agora."
          );
        })
        .finally(() => {
          setIsSaving(false);
        });
    }, LESSON_EDITOR_PERSIST_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [state.blocks, state.hasHydrated, state.isDirty, state.lesson]);

  const lesson = state.lesson;
  const mediaAssetsById = useMemo<Record<string, ContentRendererMediaAsset>>(
    () =>
      Object.fromEntries(
        mediaAssets.map((asset) => [
          asset.id,
          {
            id: asset.id,
            mimeType: asset.mimeType,
            originalName: asset.originalName,
            readUrl: asset.readUrl,
            sizeBytes: asset.sizeBytes
          }
        ])
      ),
    [mediaAssets]
  );
  const breadcrumbItems = useMemo(
    () => [
      { href: "/app/dashboard", label: "App" },
      { href: "/app/courses", label: "Cursos" },
      {
        href: `/app/courses/${courseId}`,
        label: curriculum?.title ?? "Curso"
      },
      {
        href: `/app/courses/${courseId}/curriculum`,
        label: "Curriculo"
      },
      { label: lesson?.title ?? "Editar aula" }
    ],
    [courseId, curriculum?.title, lesson?.title]
  );

  useAppBreadcrumbs(breadcrumbItems);

  function handleRetry() {
    setIsLoading(true);
    setErrorMessage(null);
    void loadEditor();
  }

  const handleAddBlock = useCallback((type: (typeof blockTypes)[number]) => {
    setSaveErrorMessage(null);
    dispatch({
      type: "add-block",
      block: createEditorBlock(type)
    });
  }, []);

  const handleSelectBlock = useCallback((blockId: string) => {
    dispatch({
      type: "select-block",
      blockId
    });
  }, []);

  const handleDuplicateBlock = useCallback((blockId: string) => {
    setSaveErrorMessage(null);
    dispatch({
      type: "duplicate-block",
      blockId,
      duplicateId: createClientBlockId("block")
    });
  }, []);

  const handleRemoveBlock = useCallback((blockId: string) => {
    setSaveErrorMessage(null);
    dispatch({
      type: "remove-block",
      blockId
    });
  }, []);

  const handleUpdateBlock = useCallback(
    (blockId: string, updater: (current: EditorBlock) => EditorBlock) => {
      setSaveErrorMessage(null);
      dispatch({
        type: "update-block",
        blockId,
        updater
      });
    },
    []
  );

  const handleMoveBlock = useCallback((blockId: string, direction: "up" | "down") => {
    setSaveErrorMessage(null);
    dispatch({
      type: "move-block",
      blockId,
      direction
    });
  }, []);

  const rememberMediaAsset = useCallback((asset: MediaAsset) => {
    setMediaAssets((current) => {
      const nextAssets = current.filter((item) => item.id !== asset.id);
      return [asset, ...nextAssets];
    });
    setMediaLoadErrorMessage(null);
  }, []);

  if (isLoading) {
    return (
      <LoadingState
        description="Buscando os metadados da aula e o conteudo atual para iniciar a edicao."
        title="Carregando editor da aula"
      />
    );
  }

  if (errorMessage || !lesson || !curriculum) {
    return (
      <ErrorState
        action={<Button onClick={handleRetry}>Tentar novamente</Button>}
        description={errorMessage ?? "Nao foi possivel abrir a aula para edicao."}
        title="Nao foi possivel carregar o editor"
      />
    );
  }

  const previewContent = normalizeContentDocument({
    version: 1,
    blocks: state.blocks
  });

  return (
    <section className="space-y-8">
      <PageHeader
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/app/courses/${courseId}/curriculum`}>Voltar para curriculo</Link>
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsPreviewOpen(true)}>
              Preview
            </Button>
            <AddBlockMenu onAddBlock={handleAddBlock} />
          </>
        }
        description="As alteracoes no conteudo sao salvas automaticamente na API alguns instantes apos a ultima edicao."
        eyebrow="Editor da aula"
        title={lesson.title}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary">{lesson.contentType}</Badge>
        <Badge variant="neutral">Aula {String(lesson.position).padStart(2, "0")}</Badge>
        {lesson.isPreview ? <Badge variant="warning">Preview</Badge> : null}
        {lesson.estimatedDurationMinutes ? (
          <Badge variant="outline">{lesson.estimatedDurationMinutes} min</Badge>
        ) : null}
        <Badge variant={saveErrorMessage ? "destructive" : isSaving ? "warning" : "success"}>
          {saveErrorMessage
            ? "Falha ao salvar"
            : isSaving
              ? "Salvando..."
              : state.lastSavedAt
                ? "Salvo"
                : "Sem alteracoes"}
        </Badge>
      </div>

      {saveErrorMessage ? (
        <p className="rounded-2xl border border-destructive/35 bg-destructive/12 px-4 py-3 text-sm text-destructive">
          {saveErrorMessage}
        </p>
      ) : null}

      <Card className="overflow-hidden">
        <CardHeader className="gap-4 border-b border-border/70 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.04em] text-card-foreground">
              Blocos da aula
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              Edite cada trecho diretamente na lista, mantendo o fluxo da narrativa e abrindo o
              preview apenas quando precisar validar a leitura completa.
            </p>
          </div>
          <AddBlockMenu onAddBlock={handleAddBlock} />
        </CardHeader>
        <CardContent className="pt-5">
          {state.blocks.length === 0 ? (
            <EmptyState
              action={<AddBlockMenu onAddBlock={handleAddBlock} />}
              description="Comece adicionando o primeiro bloco do conteudo desta aula."
              title="Nenhum bloco criado ainda"
            />
          ) : (
            <div className="space-y-4">
              {state.blocks.map((block, index) => (
                <LessonBlockCard
                  key={block.id}
                  block={block}
                  index={index}
                  isSelected={block.id === state.selectedBlockId}
                  mediaAssetsById={mediaAssetsById}
                  mediaLoadErrorMessage={mediaLoadErrorMessage}
                  onDuplicate={handleDuplicateBlock}
                  onRememberMediaAsset={rememberMediaAsset}
                  onMove={handleMoveBlock}
                  onRemove={handleRemoveBlock}
                  onSelect={handleSelectBlock}
                  onUpdate={handleUpdateBlock}
                  canMoveUp={index > 0}
                  canMoveDown={index < state.blocks.length - 1}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <LessonPreviewAside
        content={previewContent}
        lessonTitle={lesson.title}
        mediaAssetsById={mediaAssetsById}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
      />
    </section>
  );
}

function AddBlockMenu({
  onAddBlock
}: {
  onAddBlock: (type: (typeof blockTypes)[number]) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>Adicionar bloco</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Tipos de bloco</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {blockTypes.map((type) => (
          <DropdownMenuItem key={type} onSelect={() => onAddBlock(type)}>
            {getBlockTypeLabel(type)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BlockActionsMenu({
  blockId,
  onDuplicate,
  onRemove
}: {
  blockId: string;
  onDuplicate: (blockId: string) => void;
  onRemove: (blockId: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Acoes do bloco"
          size="icon"
          variant="outline"
          onClick={(event) => event.stopPropagation()}
        >
          <DotsIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onDuplicate(blockId)}>
          Duplicar bloco
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => onRemove(blockId)}
        >
          Remover bloco
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const LessonBlockCard = memo(function LessonBlockCard({
  block,
  index,
  isSelected,
  mediaAssetsById,
  mediaLoadErrorMessage,
  canMoveDown,
  canMoveUp,
  onDuplicate,
  onRememberMediaAsset,
  onMove,
  onRemove,
  onSelect,
  onUpdate
}: {
  block: EditorBlock;
  index: number;
  isSelected: boolean;
  mediaAssetsById: Record<string, ContentRendererMediaAsset>;
  mediaLoadErrorMessage: string | null;
  canMoveDown: boolean;
  canMoveUp: boolean;
  onDuplicate: (blockId: string) => void;
  onRememberMediaAsset: (asset: MediaAsset) => void;
  onMove: (blockId: string, direction: "up" | "down") => void;
  onRemove: (blockId: string) => void;
  onSelect: (blockId: string) => void;
  onUpdate: (blockId: string, updater: (current: EditorBlock) => EditorBlock) => void;
}) {
  const handleChange = useCallback(
    (updater: (current: EditorBlock) => EditorBlock) => onUpdate(block.id, updater),
    [block.id, onUpdate]
  );

  return (
    <article
      className={[
        "rounded-[1.75rem] border p-5 transition sm:p-6",
        isSelected
          ? "border-primary/45 bg-primary/10 shadow-sm"
          : "border-border/70 bg-card hover:border-input"
      ].join(" ")}
      onClick={() => onSelect(block.id)}
      onFocusCapture={() => onSelect(block.id)}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={isSelected ? "secondary" : "neutral"}>
                {getBlockTypeLabel(block.type)}
              </Badge>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Bloco {String(index + 1).padStart(2, "0")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              aria-label={`Mover bloco ${index + 1} para cima`}
              leadingIcon={<ArrowUpIcon />}
              size="sm"
              variant="outline"
              disabled={!canMoveUp}
              onClick={(event) => {
                event.stopPropagation();
                onMove(block.id, "up");
              }}
            >
              Subir
            </Button>
            <Button
              aria-label={`Mover bloco ${index + 1} para baixo`}
              leadingIcon={<ArrowDownIcon />}
              size="sm"
              variant="outline"
              disabled={!canMoveDown}
              onClick={(event) => {
                event.stopPropagation();
                onMove(block.id, "down");
              }}
            >
              Descer
            </Button>
            <BlockActionsMenu
              blockId={block.id}
              onDuplicate={onDuplicate}
              onRemove={onRemove}
            />
          </div>
        </div>
        <SelectedBlockEditor
          block={block}
          mediaAssetsById={mediaAssetsById}
          mediaLoadErrorMessage={mediaLoadErrorMessage}
          onChange={handleChange}
          onRememberMediaAsset={onRememberMediaAsset}
        />
      </div>
    </article>
  );
});

function SelectedBlockEditor({
  block,
  mediaAssetsById,
  mediaLoadErrorMessage,
  onChange,
  onRememberMediaAsset
}: {
  block: EditorBlock;
  mediaAssetsById: Record<string, ContentRendererMediaAsset>;
  mediaLoadErrorMessage: string | null;
  onChange: (updater: (current: EditorBlock) => EditorBlock) => void;
  onRememberMediaAsset: (asset: MediaAsset) => void;
}) {
  switch (block.type) {
    case "heading":
      return (
        <FieldsStack>
          <Field label="Nivel">
            <Select
              value={String(block.props.level)}
              onValueChange={(value) =>
                onChange((current) =>
                  current.type === "heading"
                    ? {
                        ...current,
                        props: {
                          ...current.props,
                          level: Number(value) as 1 | 2 | 3 | 4 | 5 | 6
                        }
                      }
                    : current
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o nivel" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((level) => (
                  <SelectItem key={level} value={String(level)}>
                    H{level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Titulo">
            <RichTextBlockEditor
              ariaLabel="Titulo"
              controls={["bold", "italic"]}
              value={block.props.text}
              onChange={(value) =>
                onChange((current) =>
                  current.type === "heading"
                    ? {
                        ...current,
                        props: {
                          ...current.props,
                          text: value
                        }
                      }
                    : current
                )
              }
            />
          </Field>
        </FieldsStack>
      );
    case "paragraph":
      return (
        <Field label="Texto">
          <RichTextBlockEditor
            ariaLabel="Texto"
            value={block.props.text}
            onChange={(value) =>
              onChange((current) =>
                current.type === "paragraph"
                  ? {
                      ...current,
                      props: {
                        ...current.props,
                        text: value
                      }
                    }
                  : current
              )
            }
          />
        </Field>
      );
    case "quote":
      return (
        <FieldsStack>
          <Field label="Citacao">
            <RichTextBlockEditor
              ariaLabel="Citacao"
              value={block.props.text}
              onChange={(value) =>
                onChange((current) =>
                  current.type === "quote"
                    ? {
                        ...current,
                        props: {
                          ...current.props,
                          text: value
                        }
                      }
                    : current
                )
              }
            />
          </Field>
          <Field label="Atribuicao">
            <Input
              value={block.props.attribution ?? ""}
              onChange={(event) =>
                onChange((current) =>
                  current.type === "quote"
                    ? {
                        ...current,
                        props: {
                          ...current.props,
                          attribution: toOptionalValue(event.target.value)
                        }
                      }
                    : current
                )
              }
            />
          </Field>
        </FieldsStack>
      );
    case "callout":
      return (
        <FieldsStack>
          <Field label="Variante">
            <Select
              value={block.props.variant}
              onValueChange={(value) =>
                onChange((current) =>
                  current.type === "callout"
                    ? {
                        ...current,
                        props: {
                          ...current.props,
                          variant: value as ReturnType<typeof getCalloutVariantOptions>[number]
                        }
                      }
                    : current
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a variante" />
              </SelectTrigger>
              <SelectContent>
                {getCalloutVariantOptions().map((variant) => (
                  <SelectItem key={variant} value={variant}>
                    {variant}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Titulo">
            <Input
              value={block.props.title ?? ""}
              onChange={(event) =>
                onChange((current) =>
                  current.type === "callout"
                    ? {
                        ...current,
                        props: {
                          ...current.props,
                          title: toOptionalValue(event.target.value)
                        }
                      }
                    : current
                )
              }
            />
          </Field>
          <Field label="Texto">
            <RichTextBlockEditor
              ariaLabel="Texto do callout"
              value={block.props.text}
              onChange={(value) =>
                onChange((current) =>
                  current.type === "callout"
                    ? {
                        ...current,
                        props: {
                          ...current.props,
                          text: value
                        }
                      }
                    : current
                )
              }
            />
          </Field>
        </FieldsStack>
      );
    case "divider":
      return (
        <FieldSurface>
          <EmptyState
            description="Este bloco nao possui campos editaveis nesta versao."
            title="Separador visual"
          />
        </FieldSurface>
      );
    case "image":
      return (
        <FieldsStack>
          <MediaSelectionField
            assetId={block.props.assetId}
            assetLabel="imagem"
            mediaAsset={block.props.assetId ? mediaAssetsById[block.props.assetId] : undefined}
            mediaLoadErrorMessage={mediaLoadErrorMessage}
            onClear={() =>
              onChange((current) =>
                current.type === "image"
                  ? {
                      ...current,
                      props: {
                        ...current.props,
                        assetId: undefined
                      }
                    }
                  : current
              )
            }
            onSelect={(asset) => {
              onRememberMediaAsset(asset);
              onChange((current) =>
                current.type === "image"
                  ? {
                      ...current,
                      props: {
                        ...current.props,
                        assetId: asset.id
                      }
                    }
                  : current
              );
            }}
          />
          <Field label="Legenda">
            <Input
              value={block.props.caption ?? ""}
              onChange={(event) =>
                onChange((current) =>
                  current.type === "image"
                    ? {
                        ...current,
                        props: {
                          ...current.props,
                          caption: toOptionalValue(event.target.value)
                        }
                      }
                    : current
                )
              }
            />
          </Field>
          <Field label="Alt text">
            <Textarea
              rows={4}
              value={block.props.alt ?? ""}
              onChange={(event) =>
                onChange((current) =>
                  current.type === "image"
                    ? {
                        ...current,
                        props: {
                          ...current.props,
                          alt: toOptionalValue(event.target.value)
                        }
                      }
                    : current
                )
              }
            />
          </Field>
        </FieldsStack>
      );
    case "video":
      return (
        <FieldsStack>
          <FieldSurface>
            <div className="rounded-2xl border border-warning/35 bg-warning/10 px-4 py-3 text-sm text-muted-foreground">
              A selecao de asset para video continua pendente. A biblioteca de midia atual so
              suporta imagens e PDFs nesta iteracao.
            </div>
          </FieldSurface>
          <Field label="Titulo">
            <Input
              value={block.props.title ?? ""}
              onChange={(event) =>
                onChange((current) =>
                  current.type === "video"
                    ? {
                        ...current,
                        props: {
                          ...current.props,
                          title: toOptionalValue(event.target.value)
                        }
                      }
                    : current
                )
              }
            />
          </Field>
          <Field label="Legenda">
            <Textarea
              rows={4}
              value={block.props.caption ?? ""}
              onChange={(event) =>
                onChange((current) =>
                  current.type === "video"
                    ? {
                        ...current,
                        props: {
                          ...current.props,
                          caption: toOptionalValue(event.target.value)
                        }
                      }
                    : current
                )
              }
            />
          </Field>
        </FieldsStack>
      );
    case "file":
      return (
        <FieldsStack>
          <MediaSelectionField
            assetId={block.props.assetId}
            assetLabel="arquivo"
            mediaAsset={block.props.assetId ? mediaAssetsById[block.props.assetId] : undefined}
            mediaLoadErrorMessage={mediaLoadErrorMessage}
            onClear={() =>
              onChange((current) =>
                current.type === "file"
                  ? {
                      ...current,
                      props: {
                        ...current.props,
                        assetId: undefined
                      }
                    }
                  : current
              )
            }
            onSelect={(asset) => {
              onRememberMediaAsset(asset);
              onChange((current) =>
                current.type === "file"
                  ? {
                      ...current,
                      props: {
                        ...current.props,
                        assetId: asset.id
                      }
                    }
                  : current
              );
            }}
          />
          <Field label="Titulo">
            <Input
              value={block.props.title ?? ""}
              onChange={(event) =>
                onChange((current) =>
                  current.type === "file"
                    ? {
                        ...current,
                        props: {
                          ...current.props,
                          title: toOptionalValue(event.target.value)
                        }
                      }
                    : current
                )
              }
            />
          </Field>
          <Field label="Legenda">
            <Textarea
              rows={4}
              value={block.props.caption ?? ""}
              onChange={(event) =>
                onChange((current) =>
                  current.type === "file"
                    ? {
                        ...current,
                        props: {
                          ...current.props,
                          caption: toOptionalValue(event.target.value)
                        }
                      }
                    : current
                )
              }
            />
          </Field>
        </FieldsStack>
      );
    default:
      return null;
  }
}

function FieldsStack({
  children
}: {
  children: ReactNode;
}) {
  return <div className="space-y-5">{children}</div>;
}

function Field({
  children,
  label
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="block space-y-3">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <FieldSurface>{children}</FieldSurface>
    </label>
  );
}

function FieldSurface({
  children
}: {
  children: ReactNode;
}) {
  return <div className="space-y-3">{children}</div>;
}

function MediaSelectionField({
  assetId,
  assetLabel,
  mediaAsset,
  mediaLoadErrorMessage,
  onClear,
  onSelect
}: {
  assetId?: string;
  assetLabel: "imagem" | "arquivo";
  mediaAsset?: ContentRendererMediaAsset;
  mediaLoadErrorMessage: string | null;
  onClear: () => void;
  onSelect: (asset: MediaAsset) => void;
}) {
  return (
    <FieldSurface>
      <div className="flex flex-wrap items-center gap-3">
        <MediaPicker
          confirmLabel={`Usar ${assetLabel}`}
          description={`Escolha uma ${assetLabel} existente da biblioteca para este bloco.`}
          onSelect={onSelect}
          title={`Selecionar ${assetLabel}`}
          trigger={
            <Button type="button" variant="outline">
              {assetId ? `Trocar ${assetLabel}` : `Selecionar ${assetLabel}`}
            </Button>
          }
        />
        <Button
          type="button"
          variant="ghost"
          disabled={!assetId}
          onClick={onClear}
        >
          Remover selecao
        </Button>
      </div>

      {mediaLoadErrorMessage ? (
        <p className="text-sm text-warning">
          A biblioteca nao foi carregada na abertura desta tela. O preview pode ficar incompleto
          ate a proxima atualizacao.
        </p>
      ) : null}

      {assetId ? (
        mediaAsset ? (
          <div className="rounded-2xl border border-border/70 bg-muted/25 p-4 text-sm">
            <p className="font-medium text-card-foreground">{mediaAsset.originalName}</p>
            <p className="mt-1 text-muted-foreground">
              {formatMediaType(mediaAsset.mimeType)} · {formatFileSize(mediaAsset.sizeBytes)}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-warning/35 bg-warning/10 p-4 text-sm text-muted-foreground">
            O asset selecionado nao esta disponivel no momento. Referencia atual: {assetId}
          </div>
        )
      ) : (
        <p className="text-sm text-muted-foreground">
          {assetLabel === "imagem"
            ? "Nenhuma imagem selecionada ainda."
            : "Nenhum arquivo selecionado ainda."}
        </p>
      )}
    </FieldSurface>
  );
}

function toOptionalValue(value: string) {
  return value.trim() ? value : undefined;
}
