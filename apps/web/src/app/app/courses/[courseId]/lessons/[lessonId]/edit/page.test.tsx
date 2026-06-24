import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import LessonContentEditorPage from "./page";

vi.mock("@/components/courses/lesson-content-editor-screen", () => ({
  LessonContentEditorScreen: ({
    courseId,
    lessonId
  }: {
    courseId: string;
    lessonId: string;
  }) => (
    <div>
      editor:{courseId}:{lessonId}
    </div>
  )
}));

describe("LessonContentEditorPage", () => {
  it("renders the editor screen for the authenticated route params", async () => {
    render(
      await LessonContentEditorPage({
        params: Promise.resolve({
          courseId: "course-1",
          lessonId: "lesson-1"
        })
      })
    );

    expect(screen.getByText("editor:course-1:lesson-1")).toBeTruthy();
  });
});
