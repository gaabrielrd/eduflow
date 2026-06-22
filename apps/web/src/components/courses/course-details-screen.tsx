"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
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
import { getCourseById } from "@/lib/courses/course-service";
import type { Course } from "@/lib/courses/course-types";

const authoringRoles = new Set(["OWNER", "ADMIN", "MANAGER"]);

export function CourseDetailsScreen({ courseId }: { courseId: string }) {
  const { activeOrganizationId, organizations } = useSession();
  const [course, setCourse] = useState<Course | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const activeOrganization = useMemo(
    () =>
      organizations.find((organization) => organization.id === activeOrganizationId) ??
      null,
    [activeOrganizationId, organizations]
  );
  const canManageCourses = authoringRoles.has(activeOrganization?.role ?? "");

  const loadCourse = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextCourse = await getCourseById(courseId);
      setCourse(nextCourse);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar o curso"
      );
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void loadCourse();
  }, [loadCourse]);

  const breadcrumbItems = useMemo(
    () =>
      course
        ? [
            { href: "/app/dashboard", label: "App" },
            { href: "/app/courses", label: "Cursos" },
            { label: course.title }
          ]
        : null,
    [course]
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
        action={<Button onClick={() => void loadCourse()}>Tentar novamente</Button>}
        description={errorMessage ?? "Nao foi possivel localizar o curso solicitado."}
        title="Nao foi possivel carregar o curso"
      />
    );
  }

  return (
    <section className="space-y-8">
      <PageHeader
        actions={
          canManageCourses ? (
            <Button asChild variant="secondary">
              <Link href={`/app/courses/${course.id}/settings`}>Editar campos basicos</Link>
            </Button>
          ) : null
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
              Campos iniciais do curso para orientar catalogo e autoria nesta sprint.
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
    </section>
  );
}
