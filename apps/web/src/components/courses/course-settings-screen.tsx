"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button, ErrorState, LoadingState, PageHeader } from "@eduflow/ui";
import { useAppBreadcrumbs } from "@/components/breadcrumb-context";
import { CourseForm } from "@/components/courses/course-form";
import { getCourseById, updateCourse } from "@/lib/courses/course-service";
import type { CreateCourseSchema } from "@/lib/courses/course-schemas";
import type { Course } from "@/lib/courses/course-types";

export function CourseSettingsScreen({ courseId }: { courseId: string }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
            { href: `/app/courses/${course.id}`, label: course.title },
            { label: "Configuracoes" }
          ]
        : null,
    [course]
  );
  const initialValues = useMemo(
    () =>
      course
        ? {
            description: course.description ?? "",
            slug: course.slug,
            title: course.title
          }
        : undefined,
    [course]
  );

  useAppBreadcrumbs(breadcrumbItems);

  async function handleSubmit(values: CreateCourseSchema) {
    const updatedCourse = await updateCourse(courseId, {
      description: values.description,
      slug: values.slug,
      title: values.title
    });

    setCourse(updatedCourse);
    setSuccessMessage("Campos basicos atualizados com sucesso.");
  }

  if (isLoading) {
    return (
      <LoadingState
        description="Buscando o curso para liberar a edicao dos campos basicos."
        title="Carregando configuracoes do curso"
      />
    );
  }

  if (errorMessage || !course) {
    return (
      <ErrorState
        action={<Button onClick={() => void loadCourse()}>Tentar novamente</Button>}
        description={errorMessage ?? "Nao foi possivel localizar o curso solicitado."}
        title="Nao foi possivel carregar as configuracoes"
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
        description="Atualize os campos basicos que sustentam o catalogo e a identificacao do curso."
        eyebrow="Curso"
        title={`Configuracoes de ${course.title}`}
      />

      {successMessage ? (
        <p className="rounded-2xl border border-success/35 bg-success/12 px-4 py-3 text-sm text-success">
          {successMessage}
        </p>
      ) : null}

      <div className="max-w-3xl">
        <CourseForm
          description="As alteracoes sao salvas diretamente no curso atual e refletem na listagem e na pagina de detalhes."
          initialValues={initialValues}
          onSubmit={handleSubmit}
          submitLabel="Salvar alteracoes"
          title="Campos basicos"
        />
      </div>
    </section>
  );
}
