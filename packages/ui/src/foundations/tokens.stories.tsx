import type { Meta, StoryObj } from "@storybook/react";

const palette = [
  ["background", "bg-background text-foreground border-border"],
  ["foreground", "bg-foreground text-background border-foreground/10"],
  ["card", "bg-card text-card-foreground border-border"],
  ["muted", "bg-muted text-muted-foreground border-border"],
  ["primary", "bg-primary text-primary-foreground border-primary/30"],
  ["destructive", "bg-destructive text-destructive-foreground border-destructive/40"]
] as const;

const radii = [
  ["sm", "rounded-sm"],
  ["md", "rounded-md"],
  ["lg", "rounded-lg"],
  ["xl", "rounded-xl"]
] as const;

const shadows = [
  ["sm", "shadow-sm"],
  ["md", "shadow-md"],
  ["lg", "shadow-lg"]
] as const;

const typography = [
  ["text-xs", "Legenda e labels compactas"],
  ["text-sm", "Conteudo operacional e campos"],
  ["text-base", "Texto corrido e leitura curta"],
  ["text-lg", "Titulos secundarios"],
  ["text-xl", "Blocos de destaque"],
  ["text-3xl", "Titulos principais"]
] as const;

const meta = {
  title: "Foundations/Tokens",
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Reference: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 sm:px-10">
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            EduFlow visual system
          </p>
          <h1 className="text-3xl font-semibold tracking-tighter text-foreground">
            Tokens base para um dark theme moderado
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Os componentes devem preferir classes semanticas como{" "}
            <code className="rounded-sm bg-muted px-1.5 py-0.5 text-foreground">
              bg-background
            </code>{" "}
            e{" "}
            <code className="rounded-sm bg-muted px-1.5 py-0.5 text-foreground">
              text-foreground
            </code>{" "}
            em vez de cores visuais fixas.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Paleta semantica
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {palette.map(([name, classes]) => (
              <div key={name} className={`rounded-xl border p-5 shadow-sm ${classes}`}>
                <p className="text-xs font-semibold uppercase tracking-eyebrow opacity-80">
                  {name}
                </p>
                <p className="mt-3 text-sm">
                  Uso principal para superficies, contraste e estados base.
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Tipografia
            </h2>
            <div className="rounded-xl border border-border bg-card p-6 shadow-md">
              <div className="space-y-4">
                {typography.map(([token, label]) => (
                  <div
                    key={token}
                    className="border-b border-border/70 pb-4 last:border-b-0 last:pb-0"
                  >
                    <p className="text-xs font-semibold uppercase tracking-eyebrow text-muted-foreground">
                      {token}
                    </p>
                    <p className={`${token} mt-2 text-card-foreground`}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Radius e sombras
            </h2>
            <div className="grid gap-4">
              {radii.map(([name, className]) => (
                <div
                  key={name}
                  className={`border border-border bg-card p-4 text-sm text-card-foreground shadow-sm ${className}`}
                >
                  radius {name}
                </div>
              ))}
              {shadows.map(([name, className]) => (
                <div
                  key={name}
                  className={`rounded-lg border border-border bg-card p-4 text-sm text-card-foreground ${className}`}
                >
                  shadow {name}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Foco visivel
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <button className="rounded-md border border-input bg-card px-4 py-3 text-left text-sm text-card-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              Botao com focus ring padronizado
            </button>
            <input
              className="rounded-md border border-input bg-card px-4 py-3 text-sm text-card-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              defaultValue="Campo com foco semantico"
            />
            <div
              tabIndex={0}
              className="rounded-md border border-input bg-card px-4 py-3 text-sm text-card-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Container focavel
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6 shadow-md">
          <h2 className="text-xl font-semibold tracking-tight text-card-foreground">
            Defaults documentados
          </h2>
          <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <p>Cores base: background, foreground, muted, primary, destructive, border, ring.</p>
            <p>Espacamentos operacionais: 4px e 8px como base para controles e agrupamentos curtos.</p>
            <p>Radius: 8px a 12px na maior parte dos componentes.</p>
            <p>Breakpoints: Tailwind defaults documentados em `sm`, `md`, `lg`, `xl`, `2xl`.</p>
            <p>Z-index: `z-overlay`, `z-dropdown`, `z-dialog` para camadas interativas.</p>
            <p>Foco: `focus-visible:ring-ring` com `ring-offset-background` como padrao.</p>
          </div>
        </section>
      </div>
    </div>
  )
};
