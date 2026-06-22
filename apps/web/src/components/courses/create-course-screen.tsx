"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { PageHeader } from "@eduflow/ui";
import { useAppBreadcrumbs } from "@/components/breadcrumb-context";
import { CourseForm } from "@/components/courses/course-form";
import { createCourse } from "@/lib/courses/course-service";
import type { CreateCourseSchema } from "@/lib/courses/course-schemas";

export function CreateCourseScreen() {
  const router = useRouter();
  const breadcrumbItems = useMemo(
    () => [
      { href: "/app/dashboard", label: "App" },
      { href: "/app/courses", label: "Cursos" },
      { label: "Novo curso" }
    ],
    []
  );

  useAppBreadcrumbs(breadcrumbItems);

  async function handleSubmit(values: CreateCourseSchema) {
    const course = await createCourse({
      description: values.description,
      slug: values.slug,
      title: values.title
    });

    router.push(`/app/courses/${course.id}`);
  }

  return (
    <section className="space-y-8">
      <PageHeader
        description="Comece pelo basico: nome, identificador e uma descricao curta para orientar a equipe."
        eyebrow="Cursos"
        title="Criar novo curso"
      />

      <div className="max-w-3xl">
        <CourseForm
          description="Esses campos formam a base do catalogo inicial e podem ser ajustados depois em configuracoes."
          onSubmit={handleSubmit}
          submitLabel="Criar curso"
          title="Dados iniciais do curso"
        />
      </div>
    </section>
  );
}
