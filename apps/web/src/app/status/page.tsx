import { Badge, Button, Card, CardContent, PageHeader } from "@eduflow/ui";
import { appRoutes } from "@/lib/navigation";

const runtimeItems = [
  { label: "Status", value: "Web online" },
  { label: "Runtime", value: "Next.js App Router" },
  { label: "Styling", value: "Tailwind CSS 4" },
  {
    label: "Environment",
    value: process.env.NODE_ENV ?? "development"
  }
];

export default function StatusPage() {
  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-14">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-border bg-card/88 p-8 shadow-lg backdrop-blur sm:p-10">
        <PageHeader
          actions={<Badge variant="success">Healthy</Badge>}
          eyebrow="Health"
          title="Status visual do web"
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {runtimeItems.map((item) => (
            <Card key={item.label} className="bg-muted/45 shadow-none">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-3 text-lg font-semibold text-foreground">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Links uteis
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {appRoutes.map((route) => (
              <Button asChild key={route.href} size="sm" variant="outline">
                <a href={route.href}>{route.label}</a>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
