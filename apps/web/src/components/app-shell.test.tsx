import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/app-shell";
import { render, screen, within } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/settings/members"
}));

vi.mock("@/hooks/use-session", () => ({
  useSession: () => ({
    activeOrganizationId: "org-1",
    isAuthenticated: true,
    isLoading: false,
    logout: vi.fn(),
    organizations: [
      {
        id: "org-1",
        name: "EduFlow",
        role: "OWNER",
        slug: "eduflow"
      }
    ],
    setActiveOrganizationId: vi.fn(),
    user: {
      email: "owner@eduflow.app",
      id: "user-1",
      name: "Owner"
    }
  })
}));

describe("AppShell", () => {
  it("exposes a skip link and marks the current navigation item", () => {
    render(createElement(AppShell, null, <div>Conteudo</div>));

    expect(
      screen.getByRole("link", { name: "Pular para o conteudo principal" })
    ).toHaveAttribute("href", "#main-content");

    const mainNavigation = screen.getByRole("navigation", { name: "Navegacao principal" });
    const currentLink = within(mainNavigation)
      .getAllByRole("link")
      .find((link) => link.getAttribute("href") === "/app/settings");

    expect(currentLink).toHaveAttribute("aria-current", "page");
  });

  it("renders breadcrumb navigation with the current page announced", () => {
    render(createElement(AppShell, null, <div>Conteudo</div>));

    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    expect(screen.getByText("Members")).toHaveAttribute("aria-current", "page");
  });
});
