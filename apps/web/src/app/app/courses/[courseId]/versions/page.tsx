import { CourseVersionsScreen } from "@/components/courses/course-versions-screen";

type CourseVersionsPageProps = {
  params: Promise<{
    courseId: string;
  }>;
};

export default async function CourseVersionsPage({
  params
}: CourseVersionsPageProps) {
  const { courseId } = await params;

  return <CourseVersionsScreen courseId={courseId} />;
}
