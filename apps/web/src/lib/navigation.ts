export const appRoutes = [
  { href: "/", label: "Home" },
  { href: "/app", label: "App" },
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/status", label: "Status" }
] as const;

export const statusCards = [
  {
    eyebrow: "Routing",
    title: "App Router pronto",
    description:
      "Rotas publicas e o shell inicial do workspace ja estao organizados em src/app."
  },
  {
    eyebrow: "Tooling",
    title: "TypeScript strict e lint real",
    description:
      "A base usa aliases absolutos, preset compartilhado de ESLint e configuracao pronta para crescer."
  },
  {
    eyebrow: "Styling",
    title: "Tailwind em operacao",
    description:
      "A interface placeholder usa utilitarios leves, tokens basicos e sem dependencia visual pesada."
  }
] as const;
