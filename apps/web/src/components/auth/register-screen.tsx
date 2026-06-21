"use client";

import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { RouteGuard } from "@/components/auth/route-guard";
import { useAuth } from "@/hooks/use-auth";
import { resolvePostAuthDestination } from "@/lib/auth/auth-redirects";
import { listOrganizations, registerUser } from "@/lib/auth/auth-service";
import type { RegisterSchema } from "@/lib/auth/auth-schemas";

export function RegisterScreen() {
  const router = useRouter();
  const { activeOrganizationId, setActiveOrganizationId, setSession } = useAuth();

  async function handleSubmit(values: RegisterSchema) {
    const authResponse = await registerUser(values);
    const organizations = await listOrganizations(authResponse.accessToken);
    const destination = resolvePostAuthDestination(organizations, activeOrganizationId);

    setSession(authResponse);
    setActiveOrganizationId(destination.activeOrganizationId);
    router.push(destination.redirectTo);
  }

  return (
    <RouteGuard variant="public-auth">
      <AuthShell
        description="Abra o acesso inicial do workspace com validacao client-side, tratamento claro de erro e redirecionamento consistente."
        eyebrow="Cadastro"
        title="Crie a conta que inicia o workspace."
      >
        <RegisterForm onSubmit={handleSubmit} />
      </AuthShell>
    </RouteGuard>
  );
}
