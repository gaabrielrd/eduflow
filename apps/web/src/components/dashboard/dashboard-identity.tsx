"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@eduflow/ui";

import { useAuth } from "@/hooks/use-auth";

export function DashboardIdentity() {
  const { activeOrganizationId, user } = useAuth();

  return (
    <Card className="border-slate-900 bg-slate-950 text-white shadow-[0_18px_48px_rgba(15,23,42,0.18)]">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Sessao ativa
          </p>
          <CardTitle className="mt-2 text-white">Fluxo autenticado conectado</CardTitle>
        </div>
        <Badge variant="success">Organization context pronta</Badge>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Usuario
          </p>
          <p className="mt-2 font-medium text-white">{user?.name ?? "Sem sessao"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Email
          </p>
          <p className="mt-2 font-medium text-white">{user?.email ?? "Sem email"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Organizacao ativa
          </p>
          <p className="mt-2 break-all font-medium text-white">
            {activeOrganizationId ?? "Nenhuma organizacao ativa"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
