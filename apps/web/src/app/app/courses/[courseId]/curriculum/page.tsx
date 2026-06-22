import { CourseCurriculumScreen } from "@/components/courses/course-curriculum-screen";

type CourseCurriculumPageProps = {
  params: Promise<{
    courseId: string;
  }>;
};

export default async function CourseCurriculumPage({
  params
}: CourseCurriculumPageProps) {
  const { courseId } = await params;

  return <CourseCurriculumScreen courseId={courseId} />;
}
