"use client";

import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { RouteGuard } from "@/components/auth/route-guard";
import { useSession } from "@/hooks/use-session";
import { resolvePostAuthDestination } from "@/lib/auth/auth-redirects";
import type { LoginSchema } from "@/lib/auth/auth-schemas";

export function LoginScreen() {
  const router = useRouter();
  const { login } = useSession();

  async function handleSubmit(values: LoginSchema) {
    const session = await login(values);
    router.push(resolvePostAuthDestination(session));
  }

  return (
    <RouteGuard variant="public-auth">
      <AuthShell
        description="Autentique usuarios existentes e leve cada sessao para o proximo passo correto sem depender de estado espalhado."
        eyebrow="Login"
        title="Acesso direto para equipes e autores."
      >
        <LoginForm onSubmit={handleSubmit} />
      </AuthShell>
    </RouteGuard>
  );
}
