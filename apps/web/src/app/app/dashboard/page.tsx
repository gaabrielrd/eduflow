import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  PageHeader,
  Progress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@eduflow/ui";

import { RouteGuard } from "@/components/auth/route-guard";
import { DashboardIdentity } from "@/components/dashboard/dashboard-identity";

const dashboardTiles = [
  {
    label: "Cursos ativos",
    value: "00",
    detail: "Placeholder para KPIs de autoria e operacao."
  },
  {
    label: "Publicacoes",
    value: "00",
    detail: "Estrutura pronta para cards de status e versao."
  },
  {
    label: "Alunos",
    value: "00",
    detail: "Espaco reservado para matriculas e progresso."
  }
];

export default function DashboardPage() {
  return (
    <RouteGuard variant="session-with-organization">
      <section className="space-y-8">
        <PageHeader
          actions={<Badge variant="success">Sessao autenticada</Badge>}
          description="O dashboard agora valida a presenca de sessao e de organizacao ativa antes de liberar a navegação."
          eyebrow="Dashboard"
          title="Painel inicial do workspace"
        />

        <DashboardIdentity />

        <div className="grid gap-4 lg:grid-cols-3">
          {dashboardTiles.map((tile) => (
            <Card key={tile.label}>
              <CardHeader className="pb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {tile.label}
                </p>
                <p className="text-4xl font-semibold tracking-[-0.06em] text-slate-950">
                  {tile.value}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-600">{tile.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs className="space-y-6" defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Publicacao media
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Fluxo editorial preenchido</span>
                  <span>42%</span>
                </div>
                <Progress value={42} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pipeline">
            <Card>
              <CardHeader>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Etapas futuras
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Area</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Observacao</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Autoria</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Proxima sprint</Badge>
                      </TableCell>
                      <TableCell>CRUD de cursos, modulos e aulas.</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Operacao</TableCell>
                      <TableCell>
                        <Badge>Base pronta</Badge>
                      </TableCell>
                      <TableCell>Estados e primitives compartilhados publicados no pacote.</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <EmptyState
          description="Sem dados reais ainda, mas a autenticacao e o onboarding inicial ja conectam o usuario ao contexto do workspace."
          title="Nenhum curso conectado a este ambiente"
        />
      </section>
    </RouteGuard>
  );
}
