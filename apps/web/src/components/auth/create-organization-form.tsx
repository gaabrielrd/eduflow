"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@eduflow/ui";
import { AuthFormField } from "@/components/auth/auth-form-field";
import {
  createOrganizationSchema,
  type CreateOrganizationSchema
} from "@/lib/auth/auth-schemas";

type CreateOrganizationFormProps = {
  onSubmit: (values: CreateOrganizationSchema) => Promise<void>;
};

export function CreateOrganizationForm({
  onSubmit
}: CreateOrganizationFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError
  } = useForm<CreateOrganizationSchema>({
    defaultValues: {
      name: "",
      slug: ""
    },
    resolver: zodResolver(createOrganizationSchema)
  });

  async function handleFormSubmit(values: CreateOrganizationSchema) {
    setError("root", { message: "" });

    try {
      await onSubmit(values);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel criar a organizacao";

      setError("root", {
        message
      });
    }
  }

  return (
    <Card className="border-white/70 bg-white/92 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl tracking-[-0.05em]">
          Criar organizacao inicial
        </CardTitle>
        <p className="text-sm leading-6 text-slate-600">
          Defina o nome da sua organizacao e um identificador curto para continuar.
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" noValidate onSubmit={handleSubmit(handleFormSubmit)}>
          <AuthFormField error={errors.name?.message} htmlFor="organization-name" label="Nome da organizacao">
            <Input
              aria-describedby={errors.name ? "organization-name-error" : undefined}
              aria-invalid={errors.name ? "true" : "false"}
              autoComplete="organization"
              id="organization-name"
              placeholder="EduFlow Studio"
              {...register("name")}
            />
          </AuthFormField>

          <AuthFormField
            error={errors.slug?.message}
            hint="Pode incluir letras, numeros, espacos, hifens ou underscore. A API normaliza o valor final."
            htmlFor="organization-slug"
            label="Identificador"
          >
            <Input
              aria-describedby={
                errors.slug
                  ? "organization-slug-hint organization-slug-error"
                  : "organization-slug-hint"
              }
              aria-invalid={errors.slug ? "true" : "false"}
              autoCapitalize="none"
              autoCorrect="off"
              id="organization-slug"
              placeholder="eduflow-studio"
              {...register("slug")}
            />
          </AuthFormField>

          {errors.root?.message ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
              {errors.root.message}
            </p>
          ) : null}

          <Button className="w-full" loading={isSubmitting} type="submit">
            Criar organizacao
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
