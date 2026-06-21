import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { RouteGuard } from "@/components/auth/route-guard";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <RouteGuard variant="session-with-organization">
      <AppShell>{children}</AppShell>
    </RouteGuard>
  );
}
