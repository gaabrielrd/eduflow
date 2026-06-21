"use client";

import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { RouteGuard } from "@/components/auth/route-guard";
import { useSession } from "@/hooks/use-session";
import { resolvePostAuthDestination } from "@/lib/auth/auth-redirects";
import type { RegisterSchema } from "@/lib/auth/auth-schemas";

export function RegisterScreen() {
  const router = useRouter();
  const { register } = useSession();

  async function handleSubmit(values: RegisterSchema) {
    const session = await register(values);
    router.push(resolvePostAuthDestination(session));
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
