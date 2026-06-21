"use client";

import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { RouteGuard } from "@/components/auth/route-guard";
import { useAuth } from "@/hooks/use-auth";
import { resolvePostAuthDestination } from "@/lib/auth/auth-redirects";
import { loginUser, listOrganizations } from "@/lib/auth/auth-service";
import type { LoginSchema } from "@/lib/auth/auth-schemas";

export function LoginScreen() {
  const router = useRouter();
  const { activeOrganizationId, setActiveOrganizationId, setSession } = useAuth();

  async function handleSubmit(values: LoginSchema) {
    const authResponse = await loginUser(values);
    const organizations = await listOrganizations(authResponse.accessToken);
    const destination = resolvePostAuthDestination(organizations, activeOrganizationId);

    setSession(authResponse);
    setActiveOrganizationId(destination.activeOrganizationId);
    router.push(destination.redirectTo);
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
