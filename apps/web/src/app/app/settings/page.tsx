import Link from "next/link";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, PageHeader } from "@eduflow/ui";

export default function SettingsPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        actions={<Badge variant="secondary">Base pronta</Badge>}
        eyebrow="Configuracoes"
        title="Area inicial de configuracoes"
        description="Centralize preferencias, pessoas e administracao do workspace a partir desta secao."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Membros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Gestao de equipe e convites do MVP autenticado.
            </p>
            <Button asChild variant="secondary">
              <Link href="/app/settings/members">Abrir membros</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organizacao</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Outras preferencias administrativas, billing e politicas entram aqui em fases futuras.
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
