import { LearningPlayerScreen } from "@/components/learning/learning-player-screen";

type LearnEnrollmentPageProps = {
  params: Promise<{
    enrollmentId: string;
  }>;
};

export default async function LearnEnrollmentPage({
  params
}: LearnEnrollmentPageProps) {
  const { enrollmentId } = await params;

  return <LearningPlayerScreen enrollmentId={enrollmentId} />;
}
