export type AppNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  section: "dashboard" | "learn" | "courses" | "media" | "reports" | "settings";
};

export type BreadcrumbItem = {
  href?: string;
  label: string;
};

export const authNavigationItems: AppNavItem[] = [
  {
    href: "/app/dashboard",
    label: "Dashboard",
    shortLabel: "DS",
    section: "dashboard"
  },
  {
    href: "/app/courses",
    label: "Cursos",
    shortLabel: "CR",
    section: "courses"
  },
  {
    href: "/app/learn",
    label: "Aprender",
    shortLabel: "AP",
    section: "learn"
  },
  {
    href: "/app/media",
    label: "Midia",
    shortLabel: "MD",
    section: "media"
  },
  {
    href: "/app/reports",
    label: "Relatorios",
    shortLabel: "RP",
    section: "reports"
  },
  {
    href: "/app/settings",
    label: "Configuracoes",
    shortLabel: "CF",
    section: "settings"
  }
];

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

function normalizePathname(pathname: string) {
  if (pathname === "/app") {
    return "/app/dashboard";
  }

  return pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
}

export function getActiveNavigationItem(pathname: string) {
  const normalized = normalizePathname(pathname);

  return authNavigationItems.find((item) => {
    if (normalized === item.href) {
      return true;
    }

    return normalized.startsWith(`${item.href}/`);
  });
}

export function isNavigationItemActive(pathname: string, href: string) {
  const normalized = normalizePathname(pathname);

  return normalized === href || normalized.startsWith(`${href}/`);
}

export function getBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const normalized = normalizePathname(pathname);
  const activeItem = getActiveNavigationItem(normalized);

  const items: BreadcrumbItem[] = [{ href: "/app/dashboard", label: "App" }];

  if (!activeItem) {
    return items;
  }

  items.push({
    href: activeItem.href,
    label: activeItem.label
  });

  if (normalized === "/app/courses/new") {
    items.push({ label: "Novo curso" });
  }

  if (/^\/app\/courses\/[^/]+$/.test(normalized)) {
    items.push({ label: "Curso" });
  }

  if (/^\/app\/courses\/[^/]+\/settings$/.test(normalized)) {
    items.push({ label: "Curso" });
    items.push({ label: "Configuracoes" });
  }

  if (/^\/app\/courses\/[^/]+\/curriculum$/.test(normalized)) {
    items.push({ label: "Curso" });
    items.push({ label: "Curriculo" });
  }

  if (/^\/app\/learn\/[^/]+$/.test(normalized)) {
    items.push({ label: "Player" });
  }

  if (normalized === "/app/settings/members") {
    items.push({ label: "Members" });
  }

  return items;
}
