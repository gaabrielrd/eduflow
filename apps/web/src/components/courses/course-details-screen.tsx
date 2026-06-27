"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  ErrorState,
  LoadingState,
  PageHeader,
} from "@eduflow/ui";
import { useAppBreadcrumbs } from "@/components/breadcrumb-context";
import { useSession } from "@/hooks/use-session";
import { ApiError } from "@/lib/api/api-client";
import {
  formatCourseDate,
  formatCourseStatus,
  getCourseStatusVariant,
} from "@/lib/courses/course-formatters";
import {
  getCourseById,
  publishCourse,
  validateCoursePublish,
} from "@/lib/courses/course-service";
import type {
  Course,
  CoursePublishValidationError,
  CoursePublishValidationErrorCode,
  CoursePublishValidationResult,
  CourseVersionMetadata,
} from "@/lib/courses/course-types";

const authoringRoles = new Set(["OWNER", "ADMIN", "INSTRUCTOR", "MANAGER"]);

const validationLabels: Record<CoursePublishValidationErrorCode, string> = {
  COURSE_ARCHIVED: "Reativar o curso antes de publicar",
  COURSE_TITLE_REQUIRED: "Adicionar titulo do curso",
  COURSE_WITHOUT_MODULES: "Criar pelo menos um modulo",
  LESSON_CONTENT_INVALID: "Corrigir conteudo das aulas",
  LESSON_TITLE_REQUIRED: "Preencher titulos das aulas",
  MEDIA_ASSET_MISSING: "Selecionar midias existentes",
  MEDIA_ASSET_UNAVAILABLE: "Aguardar ou trocar midias indisponiveis",
  MEDIA_ASSET_WRONG_ORGANIZATION: "Trocar midias de outra organizacao",
  MODULE_WITHOUT_LESSONS: "Adicionar aulas aos modulos vazios",
};

function getValidationLabel(code: CoursePublishValidationErrorCode) {
  return validationLabels[code] ?? "Revisar pendencia";
}

function getValidationFromError(error: unknown) {
  if (
    error instanceof ApiError &&
    error.payload &&
    typeof error.payload === "object" &&
    "validation" in error.payload
  ) {
    return error.payload.validation as CoursePublishValidationResult;
  }

  return null;
}

type CoursePublishDialogProps = {
  courseId: string;
  courseTitle: string;
  onPublished: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

function CoursePublishDialog({
  courseId,
  courseTitle,
  onPublished,
  onOpenChange,
  open,
}: CoursePublishDialogProps) {
  const [validation, setValidation] =
    useState<CoursePublishValidationResult | null>(null);
  const [validationLoadError, setValidationLoadError] = useState<string | null>(
    null,
  );
  const [isLoadingValidation, setIsLoadingValidation] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishErrorMessage, setPublishErrorMessage] = useState<string | null>(
    null,
  );
  const [publishedVersion, setPublishedVersion] =
    useState<CourseVersionMetadata | null>(null);

  const loadValidation = useCallback(async () => {
    setPublishedVersion(null);
    setValidation(null);
    setPublishErrorMessage(null);

    setIsLoadingValidation(true);
    setValidationLoadError(null);

    try {
      const nextValidation = await validateCoursePublish(courseId);
      setValidation(nextValidation);
    } catch (error) {
      setValidation(null);
      setValidationLoadError(
        error instanceof Error
          ? error.message
          : "Nao foi possivel verificar a publicacao",
      );
    } finally {
      setIsLoadingValidation(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void loadValidation();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadValidation, open]);

  function handleOpenChange(nextOpen: boolean) {
    if (isPublishing) {
      return;
    }

    onOpenChange(nextOpen);
  }

  async function handlePublish() {
    if (!validation?.valid || isPublishing) {
      return;
    }

    setIsPublishing(true);
    setPublishErrorMessage(null);

    try {
      const nextVersion = await publishCourse(courseId);
      setPublishedVersion(nextVersion);
      await onPublished();
    } catch (error) {
      const nextValidation = getValidationFromError(error);

      if (nextValidation) {
        setValidation(nextValidation);
      }

      setPublishErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel publicar o curso",
      );
    } finally {
      setIsPublishing(false);
    }
  }

  const isReady = validation?.valid === true;
  const validationErrors = validation?.errors ?? [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Publicar curso</DialogTitle>
          <DialogDescription>
            Revise a prontidao de {courseTitle} antes de criar uma nova versao
            publicada.
          </DialogDescription>
        </DialogHeader>

        {publishedVersion ? (
          <div className="space-y-5">
            <div className="rounded-md border border-success/35 bg-success/12 px-4 py-3">
              <p className="text-sm font-semibold text-success">
                Curso publicado
              </p>
              <p className="mt-1 text-sm text-foreground">
                Versao {publishedVersion.versionNumber} criada com sucesso.
              </p>
            </div>

            <DialogFooter>
              <Button asChild variant="outline">
                <Link href={`/app/courses/${courseId}`}>
                  Voltar para detalhes
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/app/courses/${courseId}/versions`}>
                  Ver historico de versoes
                </Link>
              </Button>
            </DialogFooter>
          </div>
        ) : validationLoadError ? (
          <ErrorState
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => void loadValidation()}>
                  Tentar novamente
                </Button>
              </div>
            }
            description={validationLoadError}
            title="Nao foi possivel validar o curso"
          />
        ) : isLoadingValidation || !validation ? (
          <LoadingState
            description="Consultando as regras de publicacao do curso."
            title="Verificando prontidao"
          />
        ) : (
          <div className="space-y-5">
            {publishErrorMessage ? (
              <p
                className="rounded-md border border-destructive/35 bg-destructive/12 px-4 py-3 text-sm text-destructive"
                role="alert"
              >
                {publishErrorMessage}
              </p>
            ) : null}

            <PublishChecklist errors={validationErrors} valid={isReady} />

            <DialogFooter>
              <Button
                disabled={isPublishing}
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                disabled={!isReady}
                loading={isPublishing}
                type="button"
                onClick={() => void handlePublish()}
              >
                Confirmar publicacao
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PublishChecklist({
  errors,
  valid,
}: {
  errors: CoursePublishValidationError[];
  valid: boolean;
}) {
  if (valid) {
    return (
      <div className="rounded-md border border-success/35 bg-success/12 px-4 py-3">
        <p className="text-sm font-semibold text-success">Checklist aprovado</p>
        <p className="mt-1 text-sm text-foreground">
          O backend confirmou que o curso esta pronto para publicacao.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Pendencias antes de publicar
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Corrija os itens abaixo e valide novamente.
        </p>
      </div>

      <ul className="space-y-3">
        {errors.map((error, index) => (
          <li
            className="rounded-md border border-border bg-muted/30 px-4 py-3"
            key={`${error.code}-${error.path}-${index}`}
          >
            <p className="text-sm font-semibold text-foreground">
              {getValidationLabel(error.code)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error.message}
            </p>
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              {error.path}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CourseDetailsScreen({ courseId }: { courseId: string }) {
  const { activeOrganizationId, organizations } = useSession();
  const [course, setCourse] = useState<Course | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);

  const activeOrganization = useMemo(
    () =>
      organizations.find(
        (organization) => organization.id === activeOrganizationId,
      ) ?? null,
    [activeOrganizationId, organizations],
  );
  const canManageCourses = authoringRoles.has(activeOrganization?.role ?? "");

  const loadCourse = useCallback(async () => {
    try {
      const nextCourse = await getCourseById(courseId);
      setCourse(nextCourse);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar o curso",
      );
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void loadCourse();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadCourse]);

  function handleRetryLoadCourse() {
    setIsLoading(true);
    setErrorMessage(null);
    void loadCourse();
  }

  const breadcrumbItems = useMemo(
    () =>
      course
        ? [
            { href: "/app/dashboard", label: "App" },
            { href: "/app/courses", label: "Cursos" },
            { label: course.title },
          ]
        : null,
    [course],
  );

  useAppBreadcrumbs(breadcrumbItems);

  if (isLoading) {
    return (
      <LoadingState
        description="Buscando os dados basicos do curso selecionado."
        title="Carregando detalhes do curso"
      />
    );
  }

  if (errorMessage || !course) {
    return (
      <ErrorState
        action={
          <Button onClick={handleRetryLoadCourse}>Tentar novamente</Button>
        }
        description={
          errorMessage ?? "Nao foi possivel localizar o curso solicitado."
        }
        title="Nao foi possivel carregar o curso"
      />
    );
  }

  return (
    <section className="space-y-8">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href={`/app/courses/${course.id}/curriculum`}>
                Ver curriculo
              </Link>
            </Button>
            {canManageCourses ? (
              <>
                <Button asChild variant="secondary">
                  <Link href={`/app/courses/${course.id}/settings`}>
                    Editar campos basicos
                  </Link>
                </Button>
                <Button onClick={() => setIsPublishDialogOpen(true)}>
                  Publicar
                </Button>
              </>
            ) : null}
          </div>
        }
        description={
          course.description?.trim() ||
          "Este curso ainda nao possui uma descricao publicada para a equipe."
        }
        eyebrow="Curso"
        title={course.title}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <Card>
          <CardHeader className="space-y-2">
            <h2 className="text-lg font-semibold tracking-[-0.04em] text-card-foreground">
              Visao geral
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Campos iniciais do curso para orientar catalogo e autoria nesta
              sprint.
            </p>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Nome
              </p>
              <p className="mt-2 text-sm text-foreground">{course.title}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Slug
              </p>
              <p className="mt-2 text-sm text-foreground">{course.slug}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Descricao
              </p>
              <p className="mt-2 text-sm leading-7 text-foreground">
                {course.description?.trim() || "Sem descricao cadastrada."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <h2 className="text-lg font-semibold tracking-[-0.04em] text-card-foreground">
              Metadados
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Estado editorial e datas importantes para acompanhamento interno.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Status
              </p>
              <div className="mt-2">
                <Badge variant={getCourseStatusVariant(course.status)}>
                  {formatCourseStatus(course.status)}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Criado em
              </p>
              <p className="mt-2 text-sm text-foreground">
                {formatCourseDate(course.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Ultima atualizacao
              </p>
              <p className="mt-2 text-sm text-foreground">
                {formatCourseDate(course.updatedAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <CoursePublishDialog
        courseId={course.id}
        courseTitle={course.title}
        onOpenChange={setIsPublishDialogOpen}
        onPublished={loadCourse}
        open={isPublishDialogOpen}
      />
    </section>
  );
}
