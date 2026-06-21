"use client";

import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { CreateOrganizationForm } from "@/components/auth/create-organization-form";
import { RouteGuard } from "@/components/auth/route-guard";
import { useAuth } from "@/hooks/use-auth";
import { createOrganization } from "@/lib/auth/auth-service";
import type { CreateOrganizationSchema } from "@/lib/auth/auth-schemas";

export function CreateOrganizationScreen() {
  const router = useRouter();
  const { accessToken, refreshToken, setActiveOrganizationId, user } = useAuth();

  async function handleSubmit(values: CreateOrganizationSchema) {
    if (!user || !accessToken || !refreshToken) {
      throw new Error("Sua sessao expirou. Entre novamente.");
    }

    const organization = await createOrganization(
      {
        accessToken,
        refreshToken,
        user
      },
      values
    );

    setActiveOrganizationId(organization.id);
    router.push("/app/dashboard");
  }

  return (
    <RouteGuard variant="session-without-organization">
      <AuthShell
        description="Depois do primeiro acesso, criamos a organizacao inicial e liberamos o dashboard imediatamente."
        eyebrow="Onboarding"
        title="Conecte a primeira organizacao ao seu acesso."
      >
        <CreateOrganizationForm onSubmit={handleSubmit} />
      </AuthShell>
    </RouteGuard>
  );
}
