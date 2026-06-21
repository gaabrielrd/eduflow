import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppProviders } from "@/components/app-providers";
import { getInitialServerSession } from "@/lib/auth/auth-server";

import "./globals.css";

export const metadata: Metadata = {
  title: "EduFlow",
  description:
    "EduFlow web app for authors, admins, managers, and students."
};

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const initialSession = await getInitialServerSession();

  return (
    <html lang="en">
      <body>
        <AppProviders initialSession={initialSession}>{children}</AppProviders>
      </body>
    </html>
  );
}
