"use client";

import Link from "next/link";
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
  formatLearningDate,
  formatOptionalLearningDate,
  getEnrollmentStatusVariant
} from "@/lib/learning/learning-formatters";
import { listMyLearningCourses } from "@/lib/learning/learning-service";
import type { MyCourseEnrollment } from "@/lib/learning/learning-types";

export function LearnerCoursesScreen() {
  const [enrollments, setEnrollments] = useState<MyCourseEnrollment[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const breadcrumbItems = useMemo(
    () => [
      { href: "/app/dashboard", label: "App" },
      { label: "Aprender" }
    ],
    []
  );

  useAppBreadcrumbs(breadcrumbItems);

  const loadEnrollments = useCallback(async () => {
    try {
      const nextEnrollments = await listMyLearningCourses();
      setEnrollments(nextEnrollments);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar suas matriculas"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void loadEnrollments();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadEnrollments]);

  function handleRetryLoadEnrollments() {
    setIsLoading(true);
    setErrorMessage(null);
    void loadEnrollments();
  }

  if (isLoading) {
    return (
      <LoadingState
        description="Buscando suas matriculas na organizacao ativa."
        title="Carregando seus cursos"
      />
    );
  }

  if (errorMessage) {
    return (
      <ErrorState
        action={<Button onClick={handleRetryLoadEnrollments}>Tentar novamente</Button>}
        description={errorMessage}
        title="Nao foi possivel carregar seus cursos"
      />
    );
  }

  return (
    <section className="space-y-8">
      <PageHeader
        description="Continue os cursos em que voce esta matriculado e acompanhe seu progresso."
        eyebrow="Aprender"
        title="Meus cursos"
      />

      {enrollments.length === 0 ? (
        <EmptyState
          description="Voce ainda nao possui matriculas nesta organizacao."
          title="Nenhum curso matriculado"
        />
      ) : (
        <div className="grid gap-4">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id}>
              <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold tracking-tight text-card-foreground">
                      {enrollment.courseTitle}
                    </h2>
                    <Badge variant={getEnrollmentStatusVariant(enrollment.status)}>
                      {formatEnrollmentStatus(enrollment.status)}
                    </Badge>
                    <Badge variant="outline">Versao {enrollment.versionNumber}</Badge>
                  </div>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    {enrollment.courseDescription?.trim() ||
                      "Este curso ainda nao possui descricao publicada."}
                  </p>
                </div>

                <Button asChild>
                  <Link href={`/app/learn/${enrollment.id}`}>Continuar</Link>
                </Button>
              </CardHeader>

              <CardContent className="grid gap-5 border-t border-border/70 pt-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <p className="font-medium text-foreground">Progresso</p>
                    <p className="text-muted-foreground">
                      {enrollment.progressPercentage}%
                    </p>
                  </div>
                  <Progress
                    aria-label={`Progresso de ${enrollment.courseTitle}`}
                    value={enrollment.progressPercentage}
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Matriculado em
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    {formatLearningDate(enrollment.enrolledAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Conclusao
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    {formatOptionalLearningDate(enrollment.completedAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
