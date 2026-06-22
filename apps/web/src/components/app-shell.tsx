"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useMemo,
  useState,
  type ReactNode
} from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@eduflow/ui";
import { useSession } from "@/hooks/use-session";
import { BreadcrumbProvider } from "@/components/breadcrumb-context";
import {
  type BreadcrumbItem,
  authNavigationItems,
  getBreadcrumbItems,
  getActiveNavigationItem,
  isNavigationItemActive
} from "@/lib/navigation";

type AppShellProps = {
  children: ReactNode;
};

function MenuIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16" fill="none">
      <path
        d="M2.5 4H13.5M2.5 8H13.5M2.5 12H13.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
      <path
        d="M6 3.5L10.5 8L6 12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function NavigationList({
  pathname,
  onNavigate
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Navegacao principal" className="space-y-2">
      {authNavigationItems.map((item) => {
        const isActive = isNavigationItemActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition",
              isActive
                ? "border-primary/35 bg-primary/12 text-foreground"
                : "border-border/70 text-muted-foreground hover:border-input hover:bg-accent hover:text-foreground"
            ].join(" ")}
            onClick={onNavigate}
          >
            <span className="flex items-center gap-3">
              <span
                className={[
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-semibold uppercase tracking-[0.18em]",
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                ].join(" ")}
              >
                {item.shortLabel}
              </span>
              <span>{item.label}</span>
            </span>
            <span
              className={[
                "text-xs uppercase tracking-[0.18em]",
                isActive ? "text-primary" : "text-muted-foreground/70"
              ].join(" ")}
            >
              go
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function OrganizationMenu() {
  const {
    activeOrganizationId,
    organizations,
    setActiveOrganizationId
  } = useSession();

  const activeOrganization = useMemo(
    () =>
      organizations.find((organization) => organization.id === activeOrganizationId) ?? null,
    [activeOrganizationId, organizations]
  );

  if (organizations.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-muted/45 px-3 py-2 text-sm text-muted-foreground">
        Nenhuma organizacao ativa
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <Select
        value={activeOrganizationId ?? organizations[0]?.id}
        onValueChange={(value) => void setActiveOrganizationId(value)}
      >
        <SelectTrigger
          aria-label="Selecionar organizacao"
          className="h-10 min-w-[220px] max-w-[280px] bg-card"
        >
          <SelectValue
            placeholder="Selecione uma organizacao"
          >
            {activeOrganization?.name ?? "Selecionar organizacao"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {organizations.map((organization) => (
            <SelectItem key={organization.id} value={organization.id}>
              {organization.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function UserMenu() {
  const { logout, user } = useSession();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-10 rounded-xl px-3">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-xs font-semibold uppercase text-muted-foreground">
            {(user?.name ?? "UF").slice(0, 2)}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-sm text-foreground">{user?.name ?? "Usuario"}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="space-y-1">
            <div>{user?.name ?? "Usuario autenticado"}</div>
            <div className="text-xs font-normal uppercase tracking-[0.18em] text-muted-foreground">
              {user?.email ?? "Sem email"}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void logout()}>Sair</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Breadcrumbs({
  items
}: {
  items: BreadcrumbItem[];
}) {

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center gap-2">
          {index > 0 ? <ChevronRightIcon /> : null}
          {item.href ? (
            <Link href={item.href} className="transition hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [overrideBreadcrumbs, setOverrideBreadcrumbs] = useState<BreadcrumbItem[] | null>(
    null
  );
  const activeItem = getActiveNavigationItem(pathname);
  const breadcrumbItems = overrideBreadcrumbs ?? getBreadcrumbItems(pathname);

  return (
    <BreadcrumbProvider value={{ setOverrideItems: setOverrideBreadcrumbs }}>
      <div className="min-h-screen bg-background px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid min-h-[calc(100svh-2rem)] max-w-7xl gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden rounded-[1.75rem] border border-border bg-card p-6 text-card-foreground shadow-lg lg:block">
            <Link href="/app/dashboard" className="block">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                EduFlow
              </p>
              <h1 className="mt-3 text-2xl font-semibold tracking-[-0.05em]">
                Workspace
              </h1>
            </Link>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Navegue entre as areas principais do produto e troque o contexto da organizacao ativa.
            </p>

            <div className="mt-8">
              <OrganizationMenu />
            </div>

            <div className="mt-8">
              <NavigationList pathname={pathname} />
            </div>
          </aside>

          <div className="rounded-[1.75rem] border border-border bg-card/88 shadow-lg backdrop-blur">
            <header className="border-b border-border px-5 py-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3 lg:hidden">
                  <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="h-10 rounded-xl px-3">
                        <MenuIcon />
                        Menu
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[calc(100vw-2rem)] max-w-sm p-0">
                      <DialogTitle className="sr-only">Navegacao principal</DialogTitle>
                      <div className="border-b border-border px-5 py-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                          EduFlow
                        </p>
                        <h2 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-card-foreground">
                          Workspace
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Acesso rapido ao dashboard, conteudo e configuracoes.
                        </p>
                      </div>
                      <div className="space-y-5 px-5 py-5">
                        <OrganizationMenu />
                        <NavigationList pathname={pathname} onNavigate={() => setMobileOpen(false)} />
                      </div>
                    </DialogContent>
                  </Dialog>

                  <UserMenu />
                </div>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <Breadcrumbs items={breadcrumbItems} />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Shell autenticado
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {activeItem
                          ? `${activeItem.label} dentro do workspace autenticado`
                          : "Area autenticada do EduFlow"}
                      </p>
                    </div>
                  </div>

                  <div className="hidden items-center gap-3 lg:flex">
                    <OrganizationMenu />
                    <UserMenu />
                  </div>
                </div>
              </div>
            </header>

            <main className="px-5 py-6 sm:px-6 lg:px-8" id="main-content">
              {children}
            </main>
          </div>
        </div>
      </div>
    </BreadcrumbProvider>
  );
}
