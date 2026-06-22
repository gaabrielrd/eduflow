"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  PageHeader
} from "@eduflow/ui";
import { useAppBreadcrumbs } from "@/components/breadcrumb-context";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { useSession } from "@/hooks/use-session";
import {
  lessonTitleSchema,
  moduleTitleSchema,
  type LessonTitleSchema,
  type ModuleTitleSchema
} from "@/lib/courses/course-schemas";
import {
  archiveLesson,
  archiveModule,
  createLesson,
  createModule,
  getCourseCurriculum,
  updateLesson,
  updateModule
} from "@/lib/courses/course-service";
import type {
  CourseCurriculum,
  CourseModuleNode,
  LessonNode
} from "@/lib/courses/course-types";

const authoringRoles = new Set(["OWNER", "ADMIN", "MANAGER"]);

function GripIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16" fill="none">
      <path
        d="M5 4H5.01M5 8H5.01M5 12H5.01M11 4H11.01M11 8H11.01M11 12H11.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16" fill="none">
      <path
        d="M11.833 2.833A1.65 1.65 0 1 1 14.167 5.167L5 14.333L1.667 15L2.333 11.667L11.833 2.833Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16" fill="none">
      <path
        d="M2.667 4H13.333M6 7V11.333M10 7V11.333M4.667 4L5.333 13.333H10.667L11.333 4M6 4V2.667H10V4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 3.333V12.667M3.333 8H12.667"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

type TitleDialogProps = {
  description: string;
  initialTitle?: string;
  label: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { title: string }) => Promise<void>;
  open: boolean;
  submitLabel: string;
  title: string;
  type: "lesson" | "module";
};

function TitleDialog({
  description,
  initialTitle = "",
  label,
  onOpenChange,
  onSubmit,
  open,
  submitLabel,
  title,
  type
}: TitleDialogProps) {
  const resolver = zodResolver(type === "module" ? moduleTitleSchema : lessonTitleSchema);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError
  } = useForm<ModuleTitleSchema | LessonTitleSchema>({
    defaultValues: {
      title: initialTitle
    },
    resolver
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      title: initialTitle
    });
  }, [initialTitle, open, reset]);

  async function handleFormSubmit(values: ModuleTitleSchema | LessonTitleSchema) {
    setError("root", { message: "" });

    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (error) {
      setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel salvar agora"
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-5" noValidate onSubmit={handleSubmit(handleFormSubmit)}>
          <AuthFormField error={errors.title?.message} htmlFor={`${type}-title`} label={label}>
            <Input
              aria-describedby={errors.title ? `${type}-title-error` : undefined}
              aria-invalid={errors.title ? "true" : "false"}
              id={`${type}-title`}
              placeholder={type === "module" ? "Novo modulo" : "Nova aula"}
              {...register("title")}
            />
          </AuthFormField>

          {errors.root?.message ? (
            <p className="rounded-2xl border border-destructive/35 bg-destructive/12 px-4 py-3 text-sm text-destructive" role="alert">
              {errors.root.message}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button loading={isSubmitting} type="submit">
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ConfirmDialogProps = {
  confirmLabel: string;
  description: string;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
};

function ConfirmDialog({
  confirmLabel,
  description,
  onConfirm,
  onOpenChange,
  open,
  title
}: ConfirmDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setErrorMessage(null);
      setIsSubmitting(false);
    }

    onOpenChange(nextOpen);
  }

  async function handleConfirm() {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Nao foi possivel concluir a remocao"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <p className="rounded-2xl border border-destructive/35 bg-destructive/12 px-4 py-3 text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button loading={isSubmitting} type="button" variant="destructive" onClick={() => void handleConfirm()}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getLessonCountLabel(count: number) {
  return count === 1 ? "1 aula" : `${count} aulas`;
}

function replaceModuleInCurriculum(
  curriculum: CourseCurriculum,
  nextModule: CourseModuleNode
) {
  return {
    ...curriculum,
    modules: curriculum.modules.map((module) =>
      module.id === nextModule.id
        ? {
            ...module,
            ...nextModule,
            lessons: module.lessons
          }
        : module
    )
  };
}

function replaceLessonInCurriculum(
  curriculum: CourseCurriculum,
  nextLesson: LessonNode
) {
  return {
    ...curriculum,
    modules: curriculum.modules.map((module) =>
      module.id === nextLesson.moduleId
        ? {
            ...module,
            lessons: module.lessons.map((lesson) =>
              lesson.id === nextLesson.id ? nextLesson : lesson
            )
          }
        : module
    )
  };
}

export function CourseCurriculumScreen({ courseId }: { courseId: string }) {
  const { activeOrganizationId, organizations } = useSession();
  const [curriculum, setCurriculum] = useState<CourseCurriculum | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModuleOpen, setIsCreateModuleOpen] = useState(false);
  const [moduleToEdit, setModuleToEdit] = useState<CourseModuleNode | null>(null);
  const [moduleToRemove, setModuleToRemove] = useState<CourseModuleNode | null>(null);
  const [moduleForLessonCreate, setModuleForLessonCreate] = useState<CourseModuleNode | null>(null);
  const [lessonToEdit, setLessonToEdit] = useState<LessonNode | null>(null);
  const [lessonToRemove, setLessonToRemove] = useState<LessonNode | null>(null);

  const activeOrganization = useMemo(
    () =>
      organizations.find((organization) => organization.id === activeOrganizationId) ??
      null,
    [activeOrganizationId, organizations]
  );
  const canManageCurriculum = authoringRoles.has(activeOrganization?.role ?? "");

  const loadCurriculum = useCallback(async () => {
    try {
      const nextCurriculum = await getCourseCurriculum(courseId);
      setCurriculum(nextCurriculum);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar a estrutura do curso"
      );
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void loadCurriculum();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadCurriculum]);

  function handleRetryLoadCurriculum() {
    setIsLoading(true);
    setErrorMessage(null);
    void loadCurriculum();
  }

  const breadcrumbItems = useMemo(
    () => [
      { href: "/app/dashboard", label: "App" },
      { href: "/app/courses", label: "Cursos" },
      {
        href: `/app/courses/${courseId}`,
        label: curriculum?.title ?? "Curso"
      },
      { label: "Curriculo" }
    ],
    [courseId, curriculum?.title]
  );

  useAppBreadcrumbs(breadcrumbItems);

  async function handleCreateModule(values: { title: string }) {
    const nextModule = await createModule(courseId, values);

    setCurriculum((current) =>
      current
        ? {
            ...current,
            modules: [...current.modules, { ...nextModule, lessons: [] }]
          }
        : current
    );
    setFeedbackMessage("Modulo criado com sucesso.");
  }

  async function handleEditModule(values: { title: string }) {
    if (!moduleToEdit) {
      return;
    }

    const nextModule = await updateModule(courseId, moduleToEdit.id, values);

    setCurriculum((current) =>
      current ? replaceModuleInCurriculum(current, nextModule) : current
    );
    setFeedbackMessage("Titulo do modulo atualizado.");
  }

  async function handleRemoveModule() {
    if (!moduleToRemove) {
      return;
    }

    await archiveModule(courseId, moduleToRemove.id);

    setCurriculum((current) =>
      current
        ? {
            ...current,
            modules: current.modules.filter((module) => module.id !== moduleToRemove.id)
          }
        : current
    );
    setFeedbackMessage("Modulo removido da estrutura.");
  }

  async function handleCreateLesson(values: { title: string }) {
    if (!moduleForLessonCreate) {
      return;
    }

    const nextLesson = await createLesson(moduleForLessonCreate.id, {
      contentJson: {
        content: [],
        type: "doc"
      },
      contentType: "TEXT",
      title: values.title
    });

    setCurriculum((current) =>
      current
        ? {
            ...current,
            modules: current.modules.map((module) =>
              module.id === moduleForLessonCreate.id
                ? {
                    ...module,
                    lessons: [...module.lessons, nextLesson]
                  }
                : module
            )
          }
        : current
    );
    setFeedbackMessage("Aula criada com sucesso.");
  }

  async function handleEditLesson(values: { title: string }) {
    if (!lessonToEdit) {
      return;
    }

    const nextLesson = await updateLesson(lessonToEdit.id, values);

    setCurriculum((current) =>
      current ? replaceLessonInCurriculum(current, nextLesson) : current
    );
    setFeedbackMessage("Titulo da aula atualizado.");
  }

  async function handleRemoveLesson() {
    if (!lessonToRemove) {
      return;
    }

    await archiveLesson(lessonToRemove.id);

    setCurriculum((current) =>
      current
        ? {
            ...current,
            modules: current.modules.map((module) => ({
              ...module,
              lessons: module.lessons.filter((lesson) => lesson.id !== lessonToRemove.id)
            }))
          }
        : current
    );
    setFeedbackMessage("Aula removida da estrutura.");
  }

  if (isLoading) {
    return (
      <LoadingState
        description="Buscando modulos e aulas em ordem para montar o curriculo deste curso."
        title="Carregando curriculo do curso"
      />
    );
  }

  if (errorMessage || !curriculum) {
    return (
      <ErrorState
        action={<Button onClick={handleRetryLoadCurriculum}>Tentar novamente</Button>}
        description={errorMessage ?? "Nao foi possivel localizar o curriculo solicitado."}
        title="Nao foi possivel carregar o curriculo"
      />
    );
  }

  return (
    <section className="space-y-8">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href={`/app/courses/${courseId}`}>Voltar para detalhes</Link>
            </Button>
            {canManageCurriculum ? (
              <Button onClick={() => setIsCreateModuleOpen(true)}>Criar modulo</Button>
            ) : null}
          </div>
        }
        description="Gerencie a estrutura do curso em modulos e aulas. A ordenacao visual ja esta preparada para a proxima sprint."
        eyebrow="Curriculo"
        title={curriculum.title}
      />

      {feedbackMessage ? (
        <p className="rounded-2xl border border-success/35 bg-success/12 px-4 py-3 text-sm text-success">
          {feedbackMessage}
        </p>
      ) : null}

      {curriculum.modules.length === 0 ? (
        <EmptyState
          action={
            canManageCurriculum ? (
              <Button onClick={() => setIsCreateModuleOpen(true)}>Criar primeiro modulo</Button>
            ) : null
          }
          description={
            canManageCurriculum
              ? "Comece a estrutura deste curso criando o primeiro modulo."
              : "Este curso ainda nao possui modulos visiveis."
          }
          title="Nenhum modulo criado ainda"
        />
      ) : (
        <div className="space-y-4">
          {curriculum.modules.map((module) => (
            <Card key={module.id}>
              <CardHeader className="gap-4 border-b border-border/70 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      aria-label={`Ordenacao futura do modulo ${module.title}`}
                      disabled
                      size="icon"
                      variant="outline"
                    >
                      <GripIcon />
                    </Button>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        Modulo {String(module.position).padStart(2, "0")}
                      </p>
                      <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-card-foreground">
                        {module.title}
                      </h2>
                    </div>
                    <Badge variant="secondary">{getLessonCountLabel(module.lessons.length)}</Badge>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {module.description?.trim() ||
                      "Sem descricao cadastrada para este modulo nesta primeira versao."}
                  </p>
                </div>

                {canManageCurriculum ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      leadingIcon={<PlusIcon />}
                      variant="secondary"
                      onClick={() => setModuleForLessonCreate(module)}
                    >
                      Criar aula
                    </Button>
                    <Button
                      leadingIcon={<PencilIcon />}
                      variant="outline"
                      onClick={() => setModuleToEdit(module)}
                    >
                      Editar titulo
                    </Button>
                    <Button
                      leadingIcon={<TrashIcon />}
                      variant="outline"
                      onClick={() => setModuleToRemove(module)}
                    >
                      Remover
                    </Button>
                  </div>
                ) : null}
              </CardHeader>

              <CardContent className="space-y-3 pt-5">
                {module.lessons.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-5">
                    <p className="text-sm font-medium text-foreground">
                      Este modulo ainda nao possui aulas.
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Quando as aulas forem criadas, elas aparecerao aqui em ordem de exibicao.
                    </p>
                    {canManageCurriculum ? (
                      <Button
                        className="mt-4"
                        leadingIcon={<PlusIcon />}
                        variant="secondary"
                        onClick={() => setModuleForLessonCreate(module)}
                      >
                        Criar primeira aula
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  module.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex flex-col gap-3 rounded-2xl border border-border/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <Button
                          aria-label={`Ordenacao futura da aula ${lesson.title}`}
                          disabled
                          size="icon"
                          variant="outline"
                        >
                          <GripIcon />
                        </Button>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="text-sm font-semibold text-foreground">
                              {lesson.title}
                            </p>
                            <Badge variant="neutral">
                              Aula {String(lesson.position).padStart(2, "0")}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Rascunho {lesson.contentType.toLowerCase()} preparado para futura ordenacao.
                          </p>
                        </div>
                      </div>

                      {canManageCurriculum ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            leadingIcon={<PencilIcon />}
                            variant="outline"
                            onClick={() => setLessonToEdit(lesson)}
                          >
                            Editar titulo
                          </Button>
                          <Button
                            leadingIcon={<TrashIcon />}
                            variant="outline"
                            onClick={() => setLessonToRemove(lesson)}
                          >
                            Remover
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TitleDialog
        description="Defina um titulo curto e claro para o novo modulo deste curso."
        label="Titulo do modulo"
        onOpenChange={setIsCreateModuleOpen}
        onSubmit={handleCreateModule}
        open={isCreateModuleOpen}
        submitLabel="Criar modulo"
        title="Criar modulo"
        type="module"
      />

      <TitleDialog
        description="Atualize apenas o titulo deste modulo nesta primeira versao."
        initialTitle={moduleToEdit?.title}
        label="Titulo do modulo"
        onOpenChange={(open) => {
          if (!open) {
            setModuleToEdit(null);
          }
        }}
        onSubmit={handleEditModule}
        open={Boolean(moduleToEdit)}
        submitLabel="Salvar titulo"
        title="Editar titulo do modulo"
        type="module"
      />

      <ConfirmDialog
        confirmLabel="Remover modulo"
        description={`O modulo "${moduleToRemove?.title ?? ""}" sera arquivado e suas aulas deixarao de aparecer no curriculo.`}
        onConfirm={handleRemoveModule}
        onOpenChange={(open) => {
          if (!open) {
            setModuleToRemove(null);
          }
        }}
        open={Boolean(moduleToRemove)}
        title="Remover modulo"
      />

      <TitleDialog
        description={`A nova aula sera criada como rascunho de texto dentro de "${
          moduleForLessonCreate?.title ?? "este modulo"
        }".`}
        label="Titulo da aula"
        onOpenChange={(open) => {
          if (!open) {
            setModuleForLessonCreate(null);
          }
        }}
        onSubmit={handleCreateLesson}
        open={Boolean(moduleForLessonCreate)}
        submitLabel="Criar aula"
        title="Criar aula"
        type="lesson"
      />

      <TitleDialog
        description="Atualize apenas o titulo da aula nesta primeira versao."
        initialTitle={lessonToEdit?.title}
        label="Titulo da aula"
        onOpenChange={(open) => {
          if (!open) {
            setLessonToEdit(null);
          }
        }}
        onSubmit={handleEditLesson}
        open={Boolean(lessonToEdit)}
        submitLabel="Salvar titulo"
        title="Editar titulo da aula"
        type="lesson"
      />

      <ConfirmDialog
        confirmLabel="Remover aula"
        description={`A aula "${lessonToRemove?.title ?? ""}" sera arquivada e deixara de aparecer neste modulo.`}
        onConfirm={handleRemoveLesson}
        onOpenChange={(open) => {
          if (!open) {
            setLessonToRemove(null);
          }
        }}
        open={Boolean(lessonToRemove)}
        title="Remover aula"
      />
    </section>
  );
}
