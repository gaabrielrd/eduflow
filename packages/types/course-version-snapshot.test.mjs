import assert from "node:assert/strict";

import {
  validCourseVersionLessonDetailFixture,
  validCourseVersionSnapshotFixture
} from "./course-version-snapshot.fixtures.mjs";
import {
  courseVersionLessonDetailSchema,
  courseVersionSnapshotSchema
} from "./dist/course-version-snapshot.js";

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

function clone(value) {
  return structuredClone(value);
}

runTest("accepts an ordered v1 course version snapshot outline", () => {
  const result = courseVersionSnapshotSchema.safeParse(
    validCourseVersionSnapshotFixture
  );

  assert.equal(result.success, true);
});

runTest("rejects contentJson on lesson summaries", () => {
  const snapshot = clone(validCourseVersionSnapshotFixture);
  snapshot.lessons[0].contentJson = { version: 1, blocks: [] };

  const result = courseVersionSnapshotSchema.safeParse(snapshot);

  assert.equal(result.success, false);
});

runTest("accepts lesson detail content and per-lesson media", () => {
  const result = courseVersionLessonDetailSchema.safeParse(
    validCourseVersionLessonDetailFixture
  );

  assert.equal(result.success, true);
});

runTest("rejects invalid nested contentJson in lesson details", () => {
  const lessonDetail = clone(validCourseVersionLessonDetailFixture);
  lessonDetail.contentJson.version = 2;

  const result = courseVersionLessonDetailSchema.safeParse(lessonDetail);

  assert.equal(result.success, false);
});

runTest("rejects unsupported snapshot schema versions", () => {
  const snapshot = clone(validCourseVersionSnapshotFixture);
  snapshot.schemaVersion = 2;

  const result = courseVersionSnapshotSchema.safeParse(snapshot);

  assert.equal(result.success, false);
});

runTest("rejects unknown fields on strict snapshot objects", () => {
  const rootUnknownField = clone(validCourseVersionSnapshotFixture);
  rootUnknownField.extra = true;

  const lessonUnknownField = clone(validCourseVersionSnapshotFixture);
  lessonUnknownField.lessons[0].extra = true;

  const mediaUnknownField = clone(validCourseVersionSnapshotFixture);
  mediaUnknownField.lessonDetails[0].media[0].storageKey = "private/key.png";

  assert.equal(courseVersionSnapshotSchema.safeParse(rootUnknownField).success, false);
  assert.equal(courseVersionSnapshotSchema.safeParse(lessonUnknownField).success, false);
  assert.equal(courseVersionSnapshotSchema.safeParse(mediaUnknownField).success, false);
});

runTest("rejects inconsistent module lessonIds", () => {
  const snapshot = clone(validCourseVersionSnapshotFixture);
  snapshot.modules[0].lessonIds = ["lesson_2", "lesson_1"];

  const result = courseVersionSnapshotSchema.safeParse(snapshot);

  assert.equal(result.success, false);
});

runTest("rejects lesson summaries outside module order", () => {
  const snapshot = clone(validCourseVersionSnapshotFixture);
  snapshot.lessons = [snapshot.lessons[1], snapshot.lessons[0], snapshot.lessons[2]];

  const result = courseVersionSnapshotSchema.safeParse(snapshot);

  assert.equal(result.success, false);
});

runTest("rejects missing lesson details", () => {
  const snapshot = clone(validCourseVersionSnapshotFixture);
  snapshot.lessonDetails = snapshot.lessonDetails.slice(0, 2);

  const result = courseVersionSnapshotSchema.safeParse(snapshot);

  assert.equal(result.success, false);
});

runTest("rejects lesson detail metadata that diverges from summary", () => {
  const snapshot = clone(validCourseVersionSnapshotFixture);
  snapshot.lessonDetails[0].title = "Changed title";

  const result = courseVersionSnapshotSchema.safeParse(snapshot);

  assert.equal(result.success, false);
});

runTest("rejects missing media referenced by lesson content", () => {
  const lessonDetail = clone(validCourseVersionLessonDetailFixture);
  lessonDetail.media = lessonDetail.media.filter(
    (media) => media.id !== "media_image_1"
  );

  const result = courseVersionLessonDetailSchema.safeParse(lessonDetail);

  assert.equal(result.success, false);
});

runTest("rejects unreferenced lesson media", () => {
  const lessonDetail = clone(validCourseVersionLessonDetailFixture);
  lessonDetail.media.push({
    id: "media_unused",
    url: "https://cdn.example.com/media/unused.png",
    fileName: "unused.png",
    originalName: "Unused.png",
    mimeType: "image/png",
    sizeBytes: 100
  });

  const result = courseVersionLessonDetailSchema.safeParse(lessonDetail);

  assert.equal(result.success, false);
});
