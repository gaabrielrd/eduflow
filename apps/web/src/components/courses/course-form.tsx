"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Textarea
} from "@eduflow/ui";
import { AuthFormField } from "@/components/auth/auth-form-field";
import {
  createCourseSchema,
  type CreateCourseSchema
} from "@/lib/courses/course-schemas";

type CourseFormProps = {
  description?: string;
  initialValues?: CreateCourseSchema;
  submitLabel: string;
  title: string;
  onSubmit: (values: CreateCourseSchema) => Promise<void>;
};

const defaultValues: CreateCourseSchema = {
  description: "",
  slug: "",
  title: ""
};

export function CourseForm({
  description,
  initialValues,
  onSubmit,
  submitLabel,
  title
}: CourseFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError
  } = useForm<CreateCourseSchema>({
    defaultValues: initialValues ?? defaultValues,
    resolver: zodResolver(createCourseSchema)
  });

  useEffect(() => {
    reset(initialValues ?? defaultValues);
  }, [initialValues, reset]);

  async function handleFormSubmit(values: CreateCourseSchema) {
    setError("root", { message: "" });

    try {
      await onSubmit(values);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel salvar o curso";

      setError("root", {
        message
      });
    }
  }

  return (
    <Card className="border-border bg-card shadow-lg">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl tracking-[-0.05em]">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <form className="space-y-5" noValidate onSubmit={handleSubmit(handleFormSubmit)}>
          <AuthFormField error={errors.title?.message} htmlFor="course-title" label="Nome do curso">
            <Input
              aria-describedby={errors.title ? "course-title-error" : undefined}
              aria-invalid={errors.title ? "true" : "false"}
              id="course-title"
              placeholder="Fundamentos de onboarding"
              {...register("title")}
            />
          </AuthFormField>

          <AuthFormField
            error={errors.slug?.message}
            hint="Pode incluir letras, numeros, espacos, hifens ou underscore. A API normaliza o valor salvo."
            htmlFor="course-slug"
            label="Identificador"
          >
            <Input
              aria-describedby={
                errors.slug
                  ? "course-slug-hint course-slug-error"
                  : "course-slug-hint"
              }
              aria-invalid={errors.slug ? "true" : "false"}
              autoCapitalize="none"
              autoCorrect="off"
              id="course-slug"
              placeholder="fundamentos-onboarding"
              {...register("slug")}
            />
          </AuthFormField>

          <AuthFormField
            error={errors.description?.message}
            hint="Resumo opcional para orientar autores e administradores sobre o escopo do curso."
            htmlFor="course-description"
            label="Descricao"
          >
            <Textarea
              aria-describedby={
                errors.description
                  ? "course-description-hint course-description-error"
                  : "course-description-hint"
              }
              aria-invalid={errors.description ? "true" : "false"}
              id="course-description"
              placeholder="Descreva o objetivo principal, o publico e o resultado esperado."
              rows={6}
              {...register("description")}
            />
          </AuthFormField>

          {errors.root?.message ? (
            <p className="rounded-2xl border border-destructive/35 bg-destructive/12 px-4 py-3 text-sm text-destructive" role="alert">
              {errors.root.message}
            </p>
          ) : null}

          <Button className="w-full sm:w-auto" loading={isSubmitting} type="submit">
            {submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
