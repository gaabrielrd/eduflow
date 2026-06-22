"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@eduflow/ui";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { loginSchema, type LoginSchema } from "@/lib/auth/auth-schemas";

type LoginFormProps = {
  initialEmail?: string;
  layout?: "card" | "plain";
  onSubmit: (values: LoginSchema) => Promise<void>;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionText?: string;
};

export function LoginForm({
  initialEmail,
  layout = "card",
  onSecondaryAction,
  onSubmit,
  secondaryActionLabel = "Criar acesso",
  secondaryActionText = "Ainda nao tem conta?"
}: LoginFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError
  } = useForm<LoginSchema>({
    defaultValues: {
      email: initialEmail ?? "",
      password: ""
    },
    resolver: zodResolver(loginSchema)
  });

  async function handleFormSubmit(values: LoginSchema) {
    setError("root", { message: "" });

    try {
      await onSubmit(values);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel entrar";
      setError("root", {
        message
      });
    }
  }

  const content = (
    <>
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl tracking-[-0.05em]">Entrar no EduFlow</CardTitle>
        <p className="text-sm leading-6 text-slate-600">
          Use seu email e sua senha para continuar para a area autenticada.
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" noValidate onSubmit={handleSubmit(handleFormSubmit)}>
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
              autoComplete="current-password"
              id="password"
              placeholder="Sua senha"
              type="password"
              {...register("password")}
            />
          </AuthFormField>

          {errors.root?.message ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
              {errors.root.message}
            </p>
          ) : null}

          <Button className="w-full" loading={isSubmitting} type="submit">
            Entrar
          </Button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          {secondaryActionText}{" "}
          {onSecondaryAction ? (
            <button
              className="font-semibold text-slate-950 underline-offset-4 hover:underline"
              type="button"
              onClick={onSecondaryAction}
            >
              {secondaryActionLabel}
            </button>
      ) : (
            <Link className="font-semibold text-slate-950 underline-offset-4 hover:underline" href="/register">
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
    <Card className="border-white/70 bg-white/92 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      {content}
    </Card>
  );
}
