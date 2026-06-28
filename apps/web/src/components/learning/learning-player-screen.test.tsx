import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LearningPlayerScreen } from "@/components/learning/learning-player-screen";
import {
  completeLearningLesson,
  getLearningEnrollment
} from "@/lib/learning/learning-service";
import type { LearningEnrollmentDetail } from "@/lib/learning/learning-types";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock("@/lib/learning/learning-service", () => ({
  completeLearningLesson: vi.fn(),
  getLearningEnrollment: vi.fn()
}));

const completeLearningLessonMock = vi.mocked(completeLearningLesson);
const getLearningEnrollmentMock = vi.mocked(getLearningEnrollment);

function deferredPromise<T>() {
  let resolvePromise: (value: T) => void = () => undefined;

  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve: resolvePromise
  };
}

const enrollmentFixture: LearningEnrollmentDetail = {
  id: "enrollment-1",
  status: "ACTIVE",
  enrolledAt: "2026-06-27T12:00:00.000Z",
  completedAt: null,
  courseVersionId: "version-1",
  snapshotMetadata: {
    schemaVersion: 1,
    course: {
      id: "course-1",
      title: "Published Learning",
      slug: "published-learning",
      description: "Rendered from a course version snapshot."
    },
    moduleCount: 2,
    lessonCount: 3,
    mediaCount: 0
  },
  modules: [
    {
      id: "module-1",
      title: "Start",
      description: null,
      position: 1,
      lessonIds: ["lesson-1", "lesson-2"]
    },
    {
      id: "module-2",
      title: "Finish",
      description: null,
      position: 2,
      lessonIds: ["lesson-3"]
    }
  ],
  lessons: [
    {
      id: "lesson-1",
      moduleId: "module-1",
      title: "Welcome",
      description: "First lesson",
      contentType: "TEXT",
      position: 1,
      estimatedDurationMinutes: 5,
      isPreview: false
    },
    {
      id: "lesson-2",
      moduleId: "module-1",
      title: "Snapshot content",
      description: null,
      contentType: "TEXT",
      position: 2,
      estimatedDurationMinutes: 5,
      isPreview: false
    },
    {
      id: "lesson-3",
      moduleId: "module-2",
      title: "Wrap up",
      description: null,
      contentType: "TEXT",
      position: 1,
      estimatedDurationMinutes: 5,
      isPreview: false
    }
  ],
  lessonDetails: [
    {
      id: "lesson-1",
      moduleId: "module-1",
      title: "Welcome",
      description: "First lesson",
      contentType: "TEXT",
      position: 1,
      estimatedDurationMinutes: 5,
      isPreview: false,
      contentJson: {
        version: 1,
        blocks: [
          {
            id: "block-1",
            type: "paragraph",
            props: {
              text: "Welcome from the published snapshot."
            }
          }
        ]
      },
      media: []
    },
    {
      id: "lesson-2",
      moduleId: "module-1",
      title: "Snapshot content",
      description: null,
      contentType: "TEXT",
      position: 2,
      estimatedDurationMinutes: 5,
      isPreview: false,
      contentJson: {
        version: 1,
        blocks: [
          {
            id: "block-2",
            type: "paragraph",
            props: {
              text: "This text came from lessonDetails."
            }
          }
        ]
      },
      media: []
    },
    {
      id: "lesson-3",
      moduleId: "module-2",
      title: "Wrap up",
      description: null,
      contentType: "TEXT",
      position: 1,
      estimatedDurationMinutes: 5,
      isPreview: false,
      contentJson: {
        version: 1,
        blocks: []
      },
      media: []
    }
  ],
  lessonProgress: {
    "lesson-1": {
      id: "progress-1",
      enrollmentId: "enrollment-1",
      lessonId: "lesson-1",
      status: "COMPLETED",
      startedAt: "2026-06-27T12:00:00.000Z",
      completedAt: "2026-06-27T12:10:00.000Z",
      lastAccessedAt: "2026-06-27T12:10:00.000Z",
      timeSpentSeconds: 120,
      createdAt: "2026-06-27T12:00:00.000Z",
      updatedAt: "2026-06-27T12:10:00.000Z"
    },
    "lesson-2": {
      id: "progress-2",
      enrollmentId: "enrollment-1",
      lessonId: "lesson-2",
      status: "IN_PROGRESS",
      startedAt: "2026-06-27T12:15:00.000Z",
      completedAt: null,
      lastAccessedAt: "2026-06-27T12:15:00.000Z",
      timeSpentSeconds: 30,
      createdAt: "2026-06-27T12:15:00.000Z",
      updatedAt: "2026-06-27T12:15:00.000Z"
    },
    "lesson-3": {
      id: "progress-3",
      enrollmentId: "enrollment-1",
      lessonId: "lesson-3",
      status: "NOT_STARTED",
      startedAt: null,
      completedAt: null,
      lastAccessedAt: null,
      timeSpentSeconds: 0,
      createdAt: "2026-06-27T12:15:00.000Z",
      updatedAt: "2026-06-27T12:15:00.000Z"
    }
  },
  progressPercentage: 33
};

describe("LearningPlayerScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state while enrollment detail is fetched", () => {
    const pendingRequest = deferredPromise<LearningEnrollmentDetail>();
    getLearningEnrollmentMock.mockReturnValue(pendingRequest.promise);

    render(createElement(LearningPlayerScreen, { enrollmentId: "enrollment-1" }));

    expect(screen.getByText("Carregando player")).toBeTruthy();
  });

  it("shows error state when enrollment loading fails", async () => {
    getLearningEnrollmentMock.mockRejectedValue(new Error("Falha ao abrir"));

    render(createElement(LearningPlayerScreen, { enrollmentId: "enrollment-1" }));

    expect(await screen.findByText("Nao foi possivel abrir o curso")).toBeTruthy();
    expect(screen.getByText("Falha ao abrir")).toBeTruthy();
  });

  it("renders ordered modules, highlights current lesson, and renders snapshot content", async () => {
    getLearningEnrollmentMock.mockResolvedValue(enrollmentFixture);

    render(
      createElement(LearningPlayerScreen, {
        enrollmentId: "enrollment-1",
        lessonId: "lesson-2"
      })
    );

    expect(await screen.findByText("Published Learning")).toBeTruthy();
    const lessonNavigation = screen.getByRole("navigation", {
      name: "Aulas do curso"
    });

    expect(within(lessonNavigation).getByText("Start")).toBeTruthy();
    expect(within(lessonNavigation).getByText("Finish")).toBeTruthy();
    expect(within(lessonNavigation).getByRole("link", { name: /Snapshot content/ }))
      .toHaveAttribute("aria-current", "page");
    expect(screen.getByText("This text came from lessonDetails.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Aula anterior" })).toHaveAttribute(
      "href",
      "/app/learn/enrollment-1/lessons/lesson-1"
    );
    expect(screen.getByRole("link", { name: "Proxima aula" })).toHaveAttribute(
      "href",
      "/app/learn/enrollment-1/lessons/lesson-3"
    );
  });

  it("uses the first lesson when no lesson id is provided", async () => {
    getLearningEnrollmentMock.mockResolvedValue(enrollmentFixture);

    render(createElement(LearningPlayerScreen, { enrollmentId: "enrollment-1" }));

    expect(await screen.findByText("Welcome from the published snapshot.")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Welcome/ })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("marks the current lesson complete and updates progress", async () => {
    const user = userEvent.setup();
    getLearningEnrollmentMock.mockResolvedValue(enrollmentFixture);
    completeLearningLessonMock.mockResolvedValue({
      enrollmentId: "enrollment-1",
      status: "ACTIVE",
      completedAt: null,
      completedCount: 2,
      totalCount: 3,
      percentage: 67,
      lessonProgress: {
        ...enrollmentFixture.lessonProgress,
        "lesson-2": {
          ...enrollmentFixture.lessonProgress["lesson-2"],
          status: "COMPLETED",
          completedAt: "2026-06-27T13:00:00.000Z"
        }
      }
    });

    render(
      createElement(LearningPlayerScreen, {
        enrollmentId: "enrollment-1",
        lessonId: "lesson-2"
      })
    );

    await screen.findByText("This text came from lessonDetails.");
    await user.click(screen.getByRole("button", { name: "Marcar como concluida" }));

    expect(completeLearningLessonMock).toHaveBeenCalledWith(
      "enrollment-1",
      "lesson-2"
    );
    expect(await screen.findByText("67%")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Aula concluida" })).toBeDisabled();
  });
});
