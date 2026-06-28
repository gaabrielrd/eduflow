"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Badge,
  Button,
  ContentRenderer,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Progress,
  type ContentRendererMediaAsset
} from "@eduflow/ui";
import { useAppBreadcrumbs } from "@/components/breadcrumb-context";
import {
  formatEnrollmentStatus,
  formatLessonProgressStatus,
  getEnrollmentStatusVariant,
  getLessonProgressStatusVariant
} from "@/lib/learning/learning-formatters";
import {
  completeLearningLesson,
  getLearningEnrollment
} from "@/lib/learning/learning-service";
import type {
  LearningEnrollmentDetail,
  LearningLesson,
  LearningLessonDetail,
  LearningProgressSummary
} from "@/lib/learning/learning-types";

type LearningPlayerScreenProps = {
  enrollmentId: string;
  lessonId?: string;
};

export function LearningPlayerScreen({
  enrollmentId,
  lessonId
}: LearningPlayerScreenProps) {
  const [enrollment, setEnrollment] = useState<LearningEnrollmentDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const lessonDetailsById = useMemo(
    () =>
      new Map(
        (enrollment?.lessonDetails ?? []).map((lessonDetail) => [
          lessonDetail.id,
          lessonDetail
        ])
      ),
    [enrollment?.lessonDetails]
  );

  const lessonsByModuleId = useMemo(() => {
    const grouped = new Map<string, LearningLesson[]>();

    for (const lesson of enrollment?.lessons ?? []) {
      const currentLessons = grouped.get(lesson.moduleId) ?? [];
      grouped.set(lesson.moduleId, [...currentLessons, lesson]);
    }

    for (const lessons of grouped.values()) {
      lessons.sort((first, second) => first.position - second.position);
    }

    return grouped;
  }, [enrollment?.lessons]);

  const selectedLesson = useMemo(() => {
    if (!enrollment || enrollment.lessons.length === 0) {
      return null;
    }

    return (
      enrollment.lessons.find((lesson) => lesson.id === lessonId) ??
      (lessonId ? null : enrollment.lessons[0])
    );
  }, [enrollment, lessonId]);

  const selectedLessonDetail = selectedLesson
    ? lessonDetailsById.get(selectedLesson.id) ?? null
    : null;
  const selectedLessonIndex = selectedLesson
    ? enrollment?.lessons.findIndex((lesson) => lesson.id === selectedLesson.id) ?? -1
    : -1;
  const previousLesson =
    selectedLessonIndex > 0 && enrollment
      ? enrollment.lessons[selectedLessonIndex - 1]
      : null;
  const nextLesson =
    enrollment && selectedLessonIndex >= 0
      ? enrollment.lessons[selectedLessonIndex + 1] ?? null
      : null;
  const selectedProgress = selectedLesson
    ? enrollment?.lessonProgress[selectedLesson.id]
    : undefined;
  const course = enrollment?.snapshotMetadata.course;

  const breadcrumbItems = useMemo(
    () => [
      { href: "/app/dashboard", label: "App" },
      { href: "/app/learn", label: "Aprender" },
      {
        href: `/app/learn/${enrollmentId}`,
        label: course?.title ?? "Player"
      },
      ...(selectedLesson ? [{ label: selectedLesson.title }] : [])
    ],
    [course?.title, enrollmentId, selectedLesson]
  );

  useAppBreadcrumbs(breadcrumbItems);

  const loadEnrollment = useCallback(async () => {
    try {
      const nextEnrollment = await getLearningEnrollment(enrollmentId);
      setEnrollment(nextEnrollment);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar este curso"
      );
    } finally {
      setIsLoading(false);
    }
  }, [enrollmentId]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void loadEnrollment();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadEnrollment]);

  function handleRetryLoadEnrollment() {
    setIsLoading(true);
    setErrorMessage(null);
    void loadEnrollment();
  }

  async function handleCompleteLesson() {
    if (!selectedLesson || selectedProgress?.status === "COMPLETED") {
      return;
    }

    setIsCompleting(true);

    try {
      const progress = await completeLearningLesson(enrollmentId, selectedLesson.id);
      setEnrollment((currentEnrollment) =>
        currentEnrollment ? applyProgressSummary(currentEnrollment, progress) : currentEnrollment
      );
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel concluir esta aula"
      );
    } finally {
      setIsCompleting(false);
    }
  }

  if (isLoading) {
    return (
      <LoadingState
        description="Preparando o curso publicado e seu progresso."
        title="Carregando player"
      />
    );
  }

  if (errorMessage && !enrollment) {
    return (
      <ErrorState
        action={<Button onClick={handleRetryLoadEnrollment}>Tentar novamente</Button>}
        description={errorMessage}
        title="Nao foi possivel abrir o curso"
      />
    );
  }

  if (!enrollment || !course) {
    return (
      <EmptyState
        description="A matricula solicitada nao esta disponivel para esta sessao."
        title="Curso nao encontrado"
      />
    );
  }

  if (enrollment.lessons.length === 0) {
    return (
      <section className="space-y-8">
        <PlayerHeader enrollment={enrollment} />
        <EmptyState
          description="Esta versao publicada ainda nao possui aulas para exibicao."
          title="Nenhuma aula publicada"
        />
      </section>
    );
  }

  if (!selectedLesson || !selectedLessonDetail) {
    return (
      <section className="space-y-8">
        <PlayerHeader enrollment={enrollment} />
        <ErrorState
          action={
            <Button asChild>
              <Link href={`/app/learn/${enrollment.id}`}>Abrir primeira aula</Link>
            </Button>
          }
          description="A aula solicitada nao faz parte do snapshot publicado desta matricula."
          title="Aula nao encontrada"
        />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PlayerHeader enrollment={enrollment} />

      {errorMessage ? (
        <ErrorState
          action={<Button onClick={handleRetryLoadEnrollment}>Recarregar curso</Button>}
          description={errorMessage}
          title="Nao foi possivel atualizar o progresso"
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <LessonSidebar
          enrollment={enrollment}
          lessonsByModuleId={lessonsByModuleId}
          selectedLessonId={selectedLesson.id}
        />

        <article className="min-w-0 space-y-6">
          <div className="rounded-xl border border-border bg-card px-5 py-5 text-card-foreground shadow-sm sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <Badge variant={getLessonProgressStatusVariant(selectedProgress?.status)}>
                  {formatLessonProgressStatus(selectedProgress?.status)}
                </Badge>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Aula atual
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-card-foreground">
                    {selectedLesson.title}
                  </h2>
                </div>
                {selectedLesson.description ? (
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    {selectedLesson.description}
                  </p>
                ) : null}
              </div>

              <Button
                disabled={selectedProgress?.status === "COMPLETED"}
                loading={isCompleting}
                onClick={() => void handleCompleteLesson()}
              >
                {selectedProgress?.status === "COMPLETED"
                  ? "Aula concluida"
                  : "Marcar como concluida"}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card px-5 py-6 shadow-sm sm:px-6">
            {selectedLessonDetail.contentJson.blocks.length === 0 ? (
              <EmptyState
                description="A versao publicada desta aula ainda nao possui blocos de conteudo."
                title="Aula sem conteudo"
              />
            ) : (
              <ContentRenderer
                className="max-w-none"
                content={selectedLessonDetail.contentJson}
                mediaAssetsById={toMediaAssetsById(selectedLessonDetail)}
              />
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            {previousLesson ? (
              <Button asChild variant="outline">
                <Link href={getLessonHref(enrollment.id, previousLesson.id)}>
                  Aula anterior
                </Link>
              </Button>
            ) : (
              <Button disabled variant="outline">
                Aula anterior
              </Button>
            )}

            {nextLesson ? (
              <Button asChild>
                <Link href={getLessonHref(enrollment.id, nextLesson.id)}>
                  Proxima aula
                </Link>
              </Button>
            ) : (
              <Button disabled>Proxima aula</Button>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}

function PlayerHeader({ enrollment }: { enrollment: LearningEnrollmentDetail }) {
  const course = enrollment.snapshotMetadata.course;

  return (
    <div className="space-y-5">
      <PageHeader
        actions={
          <Badge variant={getEnrollmentStatusVariant(enrollment.status)}>
            {formatEnrollmentStatus(enrollment.status)}
          </Badge>
        }
        description={
          course.description?.trim() ||
          "Este curso ainda nao possui descricao publicada."
        }
        eyebrow="Player"
        title={course.title}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="font-medium text-foreground">Progresso do curso</p>
          <p className="text-muted-foreground">{enrollment.progressPercentage}%</p>
        </div>
        <Progress
          aria-label={`Progresso de ${course.title}`}
          value={enrollment.progressPercentage}
        />
      </div>
    </div>
  );
}

function LessonSidebar({
  enrollment,
  lessonsByModuleId,
  selectedLessonId
}: {
  enrollment: LearningEnrollmentDetail;
  lessonsByModuleId: Map<string, LearningLesson[]>;
  selectedLessonId: string;
}) {
  return (
    <aside className="rounded-xl border border-border bg-card text-card-foreground shadow-sm lg:sticky lg:top-6 lg:self-start">
      <div className="border-b border-border px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Aulas
        </p>
      </div>
      <nav aria-label="Aulas do curso" className="max-h-[70svh] overflow-y-auto px-3 py-3">
        <div className="space-y-4">
          {enrollment.modules.map((module) => {
            const lessons = lessonsByModuleId.get(module.id) ?? [];

            return (
              <section className="space-y-2" key={module.id}>
                <h3 className="px-2 text-sm font-semibold text-foreground">
                  {module.title}
                </h3>
                <ol className="space-y-1">
                  {lessons.map((lesson) => {
                    const isSelected = lesson.id === selectedLessonId;
                    const progress = enrollment.lessonProgress[lesson.id];

                    return (
                      <li key={lesson.id}>
                        <Link
                          aria-current={isSelected ? "page" : undefined}
                          className={[
                            "block rounded-lg border px-3 py-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                            isSelected
                              ? "border-primary/40 bg-primary/12 text-foreground"
                              : "border-transparent text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground"
                          ].join(" ")}
                          href={getLessonHref(enrollment.id, lesson.id)}
                        >
                          <span className="block font-medium">{lesson.title}</span>
                          <span className="mt-1 block text-xs">
                            {formatLessonProgressStatus(progress?.status)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}

function applyProgressSummary(
  enrollment: LearningEnrollmentDetail,
  progress: LearningProgressSummary
): LearningEnrollmentDetail {
  return {
    ...enrollment,
    completedAt: progress.completedAt,
    lessonProgress: progress.lessonProgress,
    progressPercentage: progress.percentage,
    status: progress.status
  };
}

function toMediaAssetsById(
  lessonDetail: LearningLessonDetail
): Record<string, ContentRendererMediaAsset> {
  return Object.fromEntries(
    lessonDetail.media.map((media) => [
      media.id,
      {
        id: media.id,
        mimeType: media.mimeType,
        originalName: media.originalName,
        readUrl: media.url,
        sizeBytes: media.sizeBytes
      }
    ])
  );
}

function getLessonHref(enrollmentId: string, lessonId: string) {
  return `/app/learn/${enrollmentId}/lessons/${lessonId}`;
}
