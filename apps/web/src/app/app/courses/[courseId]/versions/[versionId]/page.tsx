import { CourseVersionDetailsScreen } from "@/components/courses/course-version-details-screen";

type PageProps = {
  params: Promise<{
    courseId: string;
    versionId: string;
  }>;
};

export default async function CourseVersionDetailsPage({ params }: PageProps) {
  const { courseId, versionId } = await params;

  return (
    <CourseVersionDetailsScreen courseId={courseId} versionId={versionId} />
  );
}
