import { redirect } from "next/navigation";

import { MembersSettingsScreen } from "@/components/settings/members-settings-screen";
import { getInitialServerSession } from "@/lib/auth/auth-server";

const allowedRoles = new Set(["OWNER", "ADMIN"]);

export default async function MembersSettingsPage() {
  const session = await getInitialServerSession();

  if (!session?.activeOrganizationId) {
    redirect("/onboarding/create-organization");
  }

  const activeOrganization = session.organizations.find(
    (organization) => organization.id === session.activeOrganizationId
  );

  if (!activeOrganization || !allowedRoles.has(activeOrganization.role)) {
    redirect("/app/dashboard");
  }

  return <MembersSettingsScreen />;
}
