import { LessonContentEditorScreen } from "@/components/courses/lesson-content-editor-screen";

type LessonContentEditorPageProps = {
  params: Promise<{
    courseId: string;
    lessonId: string;
  }>;
};

export default async function LessonContentEditorPage({
  params
}: LessonContentEditorPageProps) {
  const { courseId, lessonId } = await params;

  return <LessonContentEditorScreen courseId={courseId} lessonId={lessonId} />;
}
