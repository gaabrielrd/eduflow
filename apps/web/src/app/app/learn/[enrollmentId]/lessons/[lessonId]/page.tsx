import { LearningPlayerScreen } from "@/components/learning/learning-player-screen";

type LearnLessonPageProps = {
  params: Promise<{
    enrollmentId: string;
    lessonId: string;
  }>;
};

export default async function LearnLessonPage({ params }: LearnLessonPageProps) {
  const { enrollmentId, lessonId } = await params;

  return <LearningPlayerScreen enrollmentId={enrollmentId} lessonId={lessonId} />;
}
