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
  PageHeader
} from "@eduflow/ui";
import type { BadgeProps } from "@eduflow/ui";
import { useAppBreadcrumbs } from "@/components/breadcrumb-context";
import { formatCourseDate } from "@/lib/courses/course-formatters";
import {
  getCourseById,
  listCourseVersions
} from "@/lib/courses/course-service";
import type {
  Course,
  CourseVersionMetadata
} from "@/lib/courses/course-types";

function getCourseVersionStatusVariant(
  status: CourseVersionMetadata["status"]
): NonNullable<BadgeProps["variant"]> {
  return status === "PUBLISHED" ? "success" : "neutral";
}

export function CourseVersionsScreen({ courseId }: { courseId: string }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [versions, setVersions] = useState<CourseVersionMetadata[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadVersions = useCallback(async () => {
    try {
      const [nextCourse, nextVersions] = await Promise.all([
        getCourseById(courseId),
        listCourseVersions(courseId)
      ]);

      setCourse(nextCourse);
      setVersions(nextVersions);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar o historico de versoes"
      );
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void loadVersions();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadVersions]);

  function handleRetryLoadVersions() {
    setIsLoading(true);
    setErrorMessage(null);
    void loadVersions();
  }

  const breadcrumbItems = useMemo(
    () =>
      course
        ? [
            { href: "/app/dashboard", label: "App" },
            { href: "/app/courses", label: "Cursos" },
            { href: `/app/courses/${course.id}`, label: course.title },
            { label: "Versoes" }
          ]
        : null,
    [course]
  );

  useAppBreadcrumbs(breadcrumbItems);

  if (isLoading) {
    return (
      <LoadingState
        description="Buscando as versoes publicadas do curso."
        title="Carregando historico de versoes"
      />
    );
  }

  if (errorMessage || !course) {
    return (
      <ErrorState
        action={<Button onClick={handleRetryLoadVersions}>Tentar novamente</Button>}
        description={
          errorMessage ?? "Nao foi possivel localizar o curso solicitado."
        }
        title="Nao foi possivel carregar as versoes"
      />
    );
  }

  return (
    <section className="space-y-8">
      <PageHeader
        actions={
          <Button asChild variant="secondary">
            <Link href={`/app/courses/${course.id}`}>Voltar para detalhes</Link>
          </Button>
        }
        description="Consulte as publicacoes imutaveis criadas a partir do estado do curso."
        eyebrow="Curso"
        title={`Versoes de ${course.title}`}
      />

      {versions.length === 0 ? (
        <EmptyState
          action={
            <Button asChild variant="secondary">
              <Link href={`/app/courses/${course.id}`}>Voltar para detalhes</Link>
            </Button>
          }
          description="Este curso ainda nao possui uma versao publicada."
          title="Nenhuma versao publicada"
        />
      ) : (
        <div className="grid gap-4">
          {versions.map((version) => (
            <Card key={version.id}>
              <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold text-card-foreground">
                      Versao {version.versionNumber}
                    </h2>
                    <Badge variant={getCourseVersionStatusVariant(version.status)}>
                      {version.status}
                    </Badge>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {version.title}
                  </p>
                </div>
                <Button asChild variant="secondary">
                  <Link
                    href={`/app/courses/${course.id}/versions/${version.id}`}
                  >
                    Inspecionar metadados
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="grid gap-3 border-t border-border/70 pt-5 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Publicada em
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    {formatCourseDate(version.publishedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Publicada por
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    {version.publishedBy?.name ?? version.publishedById}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Status
                  </p>
                  <p className="mt-2 text-sm text-foreground">{version.status}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
