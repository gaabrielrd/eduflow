import { CourseDetailsScreen } from "@/components/courses/course-details-screen";

type CourseDetailsPageProps = {
  params: Promise<{
    courseId: string;
  }>;
};

export default async function CourseDetailsPage({
  params
}: CourseDetailsPageProps) {
  const { courseId } = await params;

  return <CourseDetailsScreen courseId={courseId} />;
}
