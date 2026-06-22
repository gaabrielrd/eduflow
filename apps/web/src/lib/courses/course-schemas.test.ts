import { describe, expect, it } from "vitest";

import {
  createCourseSchema,
  lessonTitleSchema,
  moduleTitleSchema
} from "@/lib/courses/course-schemas";

describe("course schemas", () => {
  it("accepts a valid course payload", () => {
    const result = createCourseSchema.safeParse({
      description: "Curso introdutorio",
      slug: "curso-introdutorio",
      title: "Curso introdutorio"
    });

    expect(result.success).toBe(true);
  });

  it("rejects short titles and invalid slugs", () => {
    const result = createCourseSchema.safeParse({
      description: "",
      slug: "___",
      title: "A"
    });

    expect(result.success).toBe(false);
  });

  it("keeps empty description optional", () => {
    const result = createCourseSchema.safeParse({
      description: "   ",
      slug: "curso-basico",
      title: "Curso basico"
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.description).toBe("");
    }
  });

  it("validates module and lesson titles", () => {
    const validModule = moduleTitleSchema.safeParse({
      title: "Modulo de introducao"
    });
    const invalidLesson = lessonTitleSchema.safeParse({
      title: "A"
    });

    expect(validModule.success).toBe(true);
    expect(invalidLesson.success).toBe(false);
  });
});
