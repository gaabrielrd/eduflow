import { redirect } from "next/navigation";

import { CourseSettingsScreen } from "@/components/courses/course-settings-screen";
import { getInitialServerSession } from "@/lib/auth/auth-server";

const allowedRoles = new Set(["OWNER", "ADMIN", "MANAGER"]);

type CourseSettingsPageProps = {
  params: Promise<{
    courseId: string;
  }>;
};

export default async function CourseSettingsPage({
  params
}: CourseSettingsPageProps) {
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

  const { courseId } = await params;

  return <CourseSettingsScreen courseId={courseId} />;
}
