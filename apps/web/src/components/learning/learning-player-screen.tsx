"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Progress
} from "@eduflow/ui";
import { useAppBreadcrumbs } from "@/components/breadcrumb-context";
import {
  formatEnrollmentStatus,
  formatLessonProgressStatus,
  formatLearningDate,
  formatOptionalLearningDate,
  getEnrollmentStatusVariant,
  getLessonProgressStatusVariant
} from "@/lib/learning/learning-formatters";
import { getLearningEnrollment } from "@/lib/learning/learning-service";
import type {
  LearningEnrollmentDetail,
  LearningLesson
} from "@/lib/learning/learning-types";

type LearningPlayerScreenProps = {
  enrollmentId: string;
};

export function LearningPlayerScreen({ enrollmentId }: LearningPlayerScreenProps) {
  const [enrollment, setEnrollment] = useState<LearningEnrollmentDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const breadcrumbItems = useMemo(
    () => [
      { href: "/app/dashboard", label: "App" },
      { href: "/app/learn", label: "Aprender" },
      { label: enrollment?.snapshotMetadata.course.title ?? "Player" }
    ],
    [enrollment?.snapshotMetadata.course.title]
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

  function handleRetryLoadEnrollment() {
    setIsLoading(true);
    setErrorMessage(null);
    void loadEnrollment();
  }

  if (isLoading) {
    return (
      <LoadingState
        description="Preparando o curso publicado e seu progresso."
        title="Carregando player"
      />
    );
  }

  if (errorMessage) {
    return (
      <ErrorState
        action={<Button onClick={handleRetryLoadEnrollment}>Tentar novamente</Button>}
        description={errorMessage}
        title="Nao foi possivel abrir o curso"
      />
    );
  }

  if (!enrollment) {
    return (
      <EmptyState
        description="A matricula solicitada nao esta disponivel para esta sessao."
        title="Curso nao encontrado"
      />
    );
  }

  const course = enrollment.snapshotMetadata.course;

  return (
    <section className="space-y-8">
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

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Progresso geral
            </p>
            <p className="text-3xl font-semibold tracking-tight text-card-foreground">
              {enrollment.progressPercentage}%
            </p>
          </div>
          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-[0.22em]">
                Matricula
              </span>
              <span className="mt-1 block text-foreground">
                {formatLearningDate(enrollment.enrolledAt)}
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-[0.22em]">
                Conclusao
              </span>
              <span className="mt-1 block text-foreground">
                {formatOptionalLearningDate(enrollment.completedAt)}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress
            aria-label={`Progresso de ${course.title}`}
            value={enrollment.progressPercentage}
          />
        </CardContent>
      </Card>

      {enrollment.lessons.length === 0 ? (
        <EmptyState
          description="Esta versao publicada ainda nao possui aulas para exibicao."
          title="Nenhuma aula publicada"
        />
      ) : (
        <div className="space-y-4">
          {enrollment.modules.map((module) => {
            const lessons = lessonsByModuleId.get(module.id) ?? [];

            return (
              <Card key={module.id}>
                <CardHeader>
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold tracking-tight text-card-foreground">
                      {module.title}
                    </h2>
                    {module.description ? (
                      <p className="text-sm leading-6 text-muted-foreground">
                        {module.description}
                      </p>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 border-t border-border/70 pt-5">
                  {lessons.map((lesson) => {
                    const progress = enrollment.lessonProgress[lesson.id];

                    return (
                      <div
                        className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        key={lesson.id}
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{lesson.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {lesson.description?.trim() ||
                              "Aula publicada no snapshot do curso."}
                          </p>
                        </div>
                        <Badge
                          variant={getLessonProgressStatusVariant(progress?.status)}
                        >
                          {formatLessonProgressStatus(progress?.status)}
                        </Badge>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
