import { redirect } from "next/navigation";

import { CreateCourseScreen } from "@/components/courses/create-course-screen";
import { getInitialServerSession } from "@/lib/auth/auth-server";

const allowedRoles = new Set(["OWNER", "ADMIN", "INSTRUCTOR", "MANAGER"]);

export default async function NewCoursePage() {
  const session = await getInitialServerSession();

  if (!session?.activeOrganizationId) {
    redirect("/onboarding/create-organization");
  }

  const activeOrganization = session.organizations.find(
    (organization) => organization.id === session.activeOrganizationId
  );

  if (!activeOrganization || !allowedRoles.has(activeOrganization.role)) {
    redirect("/app/courses");
  }

  return <CreateCourseScreen />;
}
