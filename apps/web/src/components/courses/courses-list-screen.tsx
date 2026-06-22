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
import { useAppBreadcrumbs } from "@/components/breadcrumb-context";
import { useSession } from "@/hooks/use-session";
import {
  formatCourseDate,
  formatCourseStatus,
  getCourseStatusVariant
} from "@/lib/courses/course-formatters";
import { listCourses } from "@/lib/courses/course-service";
import type { Course } from "@/lib/courses/course-types";

const authoringRoles = new Set(["OWNER", "ADMIN", "MANAGER"]);

export function CoursesListScreen() {
  const { activeOrganizationId, organizations } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const breadcrumbItems = useMemo(
    () => [
      { href: "/app/dashboard", label: "App" },
      { label: "Cursos" }
    ],
    []
  );

  useAppBreadcrumbs(breadcrumbItems);

  const activeOrganization = useMemo(
    () =>
      organizations.find((organization) => organization.id === activeOrganizationId) ??
      null,
    [activeOrganizationId, organizations]
  );
  const canManageCourses = authoringRoles.has(activeOrganization?.role ?? "");

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextCourses = await listCourses();
      setCourses(nextCourses);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar os cursos"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  if (isLoading) {
    return (
      <LoadingState
        description="Buscando os cursos conectados a organizacao ativa."
        title="Carregando catalogo de cursos"
      />
    );
  }

  if (errorMessage) {
    return (
      <ErrorState
        action={<Button onClick={() => void loadCourses()}>Tentar novamente</Button>}
        description={errorMessage}
        title="Nao foi possivel carregar os cursos"
      />
    );
  }

  return (
    <section className="space-y-8">
      <PageHeader
        actions={
          canManageCourses ? (
            <Button asChild>
              <Link href="/app/courses/new">Novo curso</Link>
            </Button>
          ) : null
        }
        description={`Acompanhe os cursos de ${
          activeOrganization?.name ?? "sua organizacao"
        } e abra cada fluxo de autoria a partir daqui.`}
        eyebrow="Cursos"
        title="Catalogo de cursos"
      />

      {courses.length === 0 ? (
        <EmptyState
          action={
            canManageCourses ? (
              <Button asChild>
                <Link href="/app/courses/new">Criar primeiro curso</Link>
              </Button>
            ) : null
          }
          description={
            canManageCourses
              ? "Ainda nao existe nenhum curso cadastrado para esta organizacao."
              : "Ainda nao existe nenhum curso disponivel para esta organizacao."
          }
          title="Nenhum curso encontrado"
        />
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold tracking-[-0.04em] text-card-foreground">
                      {course.title}
                    </h2>
                    <Badge variant={getCourseStatusVariant(course.status)}>
                      {formatCourseStatus(course.status)}
                    </Badge>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {course.description?.trim() || "Sem descricao cadastrada ate o momento."}
                  </p>
                </div>

                <Button asChild variant="secondary">
                  <Link href={`/app/courses/${course.id}`}>Abrir detalhes</Link>
                </Button>
              </CardHeader>

              <CardContent className="grid gap-3 border-t border-border/70 pt-5 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Slug
                  </p>
                  <p className="mt-2 text-sm text-foreground">{course.slug}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Ultima atualizacao
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    {formatCourseDate(course.updatedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Criado em
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    {formatCourseDate(course.createdAt)}
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
