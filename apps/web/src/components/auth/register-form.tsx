"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@eduflow/ui";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { registerSchema, type RegisterSchema } from "@/lib/auth/auth-schemas";

type RegisterFormProps = {
  initialEmail?: string;
  layout?: "card" | "plain";
  onSubmit: (values: RegisterSchema) => Promise<void>;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionText?: string;
};

export function RegisterForm({
  initialEmail,
  layout = "card",
  onSecondaryAction,
  onSubmit,
  secondaryActionLabel = "Fazer login",
  secondaryActionText = "Ja tem acesso?"
}: RegisterFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError
  } = useForm<RegisterSchema>({
    defaultValues: {
      email: initialEmail ?? "",
      name: "",
      password: ""
    },
    resolver: zodResolver(registerSchema)
  });

  async function handleFormSubmit(values: RegisterSchema) {
    setError("root", { message: "" });

    try {
      await onSubmit(values);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel concluir o cadastro";
      setError("root", {
        message
      });
    }
  }

  const content = (
    <>
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl tracking-[-0.05em]">Criar conta</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Abra seu acesso inicial e siga para a criacao da primeira organizacao.
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" noValidate onSubmit={handleSubmit(handleFormSubmit)}>
          <AuthFormField error={errors.name?.message} htmlFor="name" label="Nome completo">
            <Input
              aria-describedby={errors.name ? "name-error" : undefined}
              aria-invalid={errors.name ? "true" : "false"}
              autoComplete="name"
              id="name"
              placeholder="Seu nome"
              {...register("name")}
            />
          </AuthFormField>

          <AuthFormField error={errors.email?.message} htmlFor="email" label="Email">
            <Input
              aria-describedby={errors.email ? "email-error" : undefined}
              aria-invalid={errors.email ? "true" : "false"}
              autoComplete="email"
              id="email"
              placeholder="voce@empresa.com"
              type="email"
              {...register("email")}
            />
          </AuthFormField>

          <AuthFormField error={errors.password?.message} htmlFor="password" label="Senha">
            <Input
              aria-describedby={errors.password ? "password-error" : undefined}
              aria-invalid={errors.password ? "true" : "false"}
              autoComplete="new-password"
              id="password"
              placeholder="Minimo de 8 caracteres"
              type="password"
              {...register("password")}
            />
          </AuthFormField>

          {errors.root?.message ? (
            <p className="rounded-2xl border border-destructive/35 bg-destructive/12 px-4 py-3 text-sm text-destructive" role="alert">
              {errors.root.message}
            </p>
          ) : null}

          <Button className="w-full" loading={isSubmitting} type="submit">
            Criar conta
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          {secondaryActionText}{" "}
          {onSecondaryAction ? (
            <button
              className="rounded-md font-semibold text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              type="button"
              onClick={onSecondaryAction}
            >
              {secondaryActionLabel}
            </button>
          ) : (
            <Link
              className="rounded-md font-semibold text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              href="/login"
            >
              {secondaryActionLabel}
            </Link>
          )}
        </p>
      </CardContent>
    </>
  );

  if (layout === "plain") {
    return <div>{content}</div>;
  }

  return (
    <Card className="border-border bg-card shadow-lg">
      {content}
    </Card>
  );
}
