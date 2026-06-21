import { StatusPill } from "@/components/status-pill";
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
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/60 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Health
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
              Status visual do web
            </h1>
          </div>
          <StatusPill tone="success">Healthy</StatusPill>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {runtimeItems.map((item) => (
            <div
              key={item.label}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {item.label}
              </p>
              <p className="mt-3 text-lg font-semibold text-slate-950">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Links uteis
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {appRoutes.map((route) => (
              <a
                key={route.href}
                href={route.href}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
              >
                {route.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
