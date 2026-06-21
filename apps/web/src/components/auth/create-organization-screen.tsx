"use client";

import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { CreateOrganizationForm } from "@/components/auth/create-organization-form";
import { RouteGuard } from "@/components/auth/route-guard";
import { useSession } from "@/hooks/use-session";
import type { CreateOrganizationSchema } from "@/lib/auth/auth-schemas";

export function CreateOrganizationScreen() {
  const router = useRouter();
  const { createOrganization } = useSession();

  async function handleSubmit(values: CreateOrganizationSchema) {
    await createOrganization(values);
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
