"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@eduflow/ui";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useSession } from "@/hooks/use-session";

export function DashboardIdentity() {
  const user = useCurrentUser();
  const { activeOrganizationId } = useSession();

  return (
    <Card className="border-border bg-background text-foreground shadow-lg">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Sessao ativa
          </p>
          <CardTitle className="mt-2 text-foreground">Fluxo autenticado conectado</CardTitle>
        </div>
        <Badge variant="success">Organization context pronta</Badge>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Usuario
          </p>
          <p className="mt-2 font-medium text-foreground">{user?.name ?? "Sem sessao"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Email
          </p>
          <p className="mt-2 font-medium text-foreground">{user?.email ?? "Sem email"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Organizacao ativa
          </p>
          <p className="mt-2 break-all font-medium text-foreground">
            {activeOrganizationId ?? "Nenhuma organizacao ativa"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
