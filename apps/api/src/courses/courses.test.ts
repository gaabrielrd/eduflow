import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";

import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { PrismaService } from "../database/prisma.service.js";
import {
  CourseModuleStatus,
  CourseStatus,
  CourseVersionStatus,
  LessonContentType,
  LessonStatus,
  MediaAssetStatus,
  Role
} from "../generated/prisma/enums.js";
import {
  bootstrapTestApp,
  closeTestApp,
  createOrganizationForUser,
  createUserAndToken,
  resetDatabase,
  uniqueSuffix
} from "../testing/test-helpers.js";

let app: INestApplication;
let prisma: PrismaService;

function createValidContentDocument(text = "Publishable content") {
  return {
    version: 1,
    blocks: [
      {
        id: `paragraph-${uniqueSuffix()}`,
        type: "paragraph",
        props: {
          text
        }
      }
    ]
  };
}

function createImageContentDocument(assetId: string) {
  return {
    version: 1,
    blocks: [
      {
        id: `image-${uniqueSuffix()}`,
        type: "image",
        props: {
          assetId,
          alt: "Course diagram"
        }
      }
    ]
  };
}

async function createPublishableCourse(params: {
  organizationId: string;
  createdById: string;
  title?: string;
  lessonTitle?: string;
  slug?: string;
  contentJson?: object;
}) {
  const course = await prisma.course.create({
    data: {
      organizationId: params.organizationId,
      title: params.title ?? "Publishable Course",
      slug: params.slug ?? `publishable-course-${uniqueSuffix()}`,
      description: "Ready to publish",
      status: CourseStatus.DRAFT,
      createdById: params.createdById
    }
  });
  const module = await prisma.courseModule.create({
    data: {
      courseId: course.id,
      title: "Getting Started",
      description: "Core material",
      position: 1,
      status: CourseModuleStatus.ACTIVE
    }
  });
  const lesson = await prisma.lesson.create({
    data: {
      moduleId: module.id,
      title: params.lessonTitle ?? "Welcome",
      description: "Introduction",
      contentType: LessonContentType.TEXT,
      contentJson: params.contentJson ?? createValidContentDocument(),
      position: 1,
      estimatedDurationMinutes: 7,
      isPreview: true,
      status: LessonStatus.ACTIVE
    }
  });

  return { course, module, lesson };
}

async function createMediaAsset(params: {
  organizationId: string;
  uploadedById: string;
  status?: MediaAssetStatus;
}) {
  return prisma.mediaAsset.create({
    data: {
      organizationId: params.organizationId,
      uploadedById: params.uploadedById,
      fileName: `diagram-${uniqueSuffix()}.png`,
      originalName: "Diagram.png",
      mimeType: "image/png",
      sizeBytes: 12345,
      storageKey: `organizations/${params.organizationId}/media/${uniqueSuffix()}-diagram.png`,
      status: params.status ?? MediaAssetStatus.READY
    }
  });
}

function assertValidationError(
  validation: {
    valid: boolean;
    errors: Array<{ code: string; path: string }>;
  },
  code: string,
  path?: string
) {
  assert.equal(validation.valid, false);
  const error = validation.errors.find((item) => item.code === code);

  assert.ok(error, `Expected validation error ${code}`);

  if (path !== undefined) {
    assert.equal(error.path, path);
  }
}

before(async () => {
  const testContext = await bootstrapTestApp();
  app = testContext.app;
  prisma = testContext.prisma;
});

beforeEach(async () => {
  await resetDatabase(prisma);
});

after(async () => {
  await closeTestApp(app);
});

test("POST /courses creates a draft course for authoring roles and normalizes slug", async () => {
  const manager = await createUserAndToken(app, `course-create.${Date.now()}@courses.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: manager.user.id,
    name: "Courses Org",
    slug: `courses-org-${uniqueSuffix()}`,
    role: Role.MANAGER
  });
  const slugSuffix = uniqueSuffix();

  const response = await request(app.getHttpServer())
    .post("/courses")
    .set("Authorization", `Bearer ${manager.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      title: "  Course Authoring Basics  ",
      slug: `  Course Authoring__Basics ${slugSuffix} `,
      description: "  Learn the authoring flow.  "
    })
    .expect(201);

  assert.equal(response.body.organizationId, organization.id);
  assert.equal(response.body.title, "Course Authoring Basics");
  assert.equal(response.body.slug, `course-authoring-basics-${slugSuffix}`);
  assert.equal(response.body.description, "Learn the authoring flow.");
  assert.equal(response.body.status, CourseStatus.DRAFT);
  assert.equal(response.body.createdById, manager.user.id);

  const persistedCourse = await prisma.course.findUnique({
    where: {
      id: response.body.id
    }
  });

  assert.ok(persistedCourse);
  assert.equal(persistedCourse.status, CourseStatus.DRAFT);
});

test("POST /courses rejects duplicate slug in the same organization and allows reuse across organizations", async () => {
  const owner = await createUserAndToken(app, `course-slug-owner.${Date.now()}@courses.test`);
  const outsider = await createUserAndToken(app, `course-slug-outsider.${Date.now()}@courses.test`);
  const slug = `shared-course-${uniqueSuffix()}`;

  const ownerOrganization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Owner Org",
    slug: `owner-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const otherOrganization = await createOrganizationForUser({
    prisma,
    userId: outsider.user.id,
    name: "Other Org",
    slug: `other-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });

  await request(app.getHttpServer())
    .post("/courses")
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", ownerOrganization.id)
    .send({
      title: "First Course",
      slug
    })
    .expect(201);

  const duplicateResponse = await request(app.getHttpServer())
    .post("/courses")
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", ownerOrganization.id)
    .send({
      title: "Second Course",
      slug
    })
    .expect(409);

  assert.equal(duplicateResponse.body.message, "Slug already in use");

  await request(app.getHttpServer())
    .post("/courses")
    .set("Authorization", `Bearer ${outsider.accessToken}`)
    .set("X-Organization-Id", otherOrganization.id)
    .send({
      title: "Other Org Course",
      slug
    })
    .expect(201);
});

test("GET /courses lists only current-organization active courses for any member", async () => {
  const student = await createUserAndToken(app, `course-list-student.${Date.now()}@courses.test`);
  const outsider = await createUserAndToken(app, `course-list-outsider.${Date.now()}@courses.test`);

  const organization = await createOrganizationForUser({
    prisma,
    userId: student.user.id,
    name: "Course List Org",
    slug: `course-list-org-${uniqueSuffix()}`,
    role: Role.STUDENT
  });
  const otherOrganization = await createOrganizationForUser({
    prisma,
    userId: outsider.user.id,
    name: "Other List Org",
    slug: `other-list-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });

  const visibleCourse = await prisma.course.create({
    data: {
      organizationId: organization.id,
      title: "Visible Course",
      slug: `visible-course-${uniqueSuffix()}`,
      description: "Visible",
      status: CourseStatus.DRAFT,
      createdById: student.user.id
    }
  });

  await prisma.course.create({
    data: {
      organizationId: organization.id,
      title: "Archived Course",
      slug: `archived-course-${uniqueSuffix()}`,
      status: CourseStatus.ARCHIVED,
      createdById: student.user.id
    }
  });

  await prisma.course.create({
    data: {
      organizationId: otherOrganization.id,
      title: "Other Org Course",
      slug: `other-org-course-${uniqueSuffix()}`,
      status: CourseStatus.DRAFT,
      createdById: outsider.user.id
    }
  });

  const response = await request(app.getHttpServer())
    .get("/courses")
    .set("Authorization", `Bearer ${student.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(200);

  assert.equal(response.body.length, 1);
  assert.equal(response.body[0].id, visibleCourse.id);
  assert.equal(response.body[0].title, "Visible Course");
});

test("GET /courses/:id returns course details, including archived courses, for current-organization members", async () => {
  const member = await createUserAndToken(app, `course-read.${Date.now()}@courses.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: member.user.id,
    name: "Course Read Org",
    slug: `course-read-org-${uniqueSuffix()}`,
    role: Role.STUDENT
  });

  const course = await prisma.course.create({
    data: {
      organizationId: organization.id,
      title: "Archived Detail Course",
      slug: `archived-detail-course-${uniqueSuffix()}`,
      description: "Archived detail",
      status: CourseStatus.ARCHIVED,
      createdById: member.user.id
    }
  });

  const response = await request(app.getHttpServer())
    .get(`/courses/${course.id}`)
    .set("Authorization", `Bearer ${member.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(200);

  assert.equal(response.body.id, course.id);
  assert.equal(response.body.status, CourseStatus.ARCHIVED);
});

test("GET /courses/:id/curriculum returns active modules and lessons in display order", async () => {
  const member = await createUserAndToken(app, `course-curriculum.${Date.now()}@courses.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: member.user.id,
    name: "Course Curriculum Org",
    slug: `course-curriculum-org-${uniqueSuffix()}`,
    role: Role.STUDENT
  });

  const course = await prisma.course.create({
    data: {
      organizationId: organization.id,
      title: "Curriculum Course",
      slug: `curriculum-course-${uniqueSuffix()}`,
      status: CourseStatus.DRAFT,
      createdById: member.user.id
    }
  });

  const moduleA = await prisma.courseModule.create({
    data: {
      courseId: course.id,
      title: "Module A",
      position: 1,
      status: CourseModuleStatus.ACTIVE
    }
  });
  const moduleB = await prisma.courseModule.create({
    data: {
      courseId: course.id,
      title: "Module B",
      position: 2,
      status: CourseModuleStatus.ACTIVE
    }
  });
  await prisma.courseModule.create({
    data: {
      courseId: course.id,
      title: "Archived Module",
      position: 3,
      status: CourseModuleStatus.ARCHIVED
    }
  });

  await prisma.lesson.create({
    data: {
      moduleId: moduleA.id,
      title: "Lesson A1",
      contentType: LessonContentType.TEXT,
      contentJson: { type: "doc", content: [] },
      position: 1,
      status: LessonStatus.ACTIVE
    }
  });
  await prisma.lesson.create({
    data: {
      moduleId: moduleA.id,
      title: "Archived Lesson",
      contentType: LessonContentType.TEXT,
      contentJson: { type: "doc", content: [] },
      position: 2,
      status: LessonStatus.ARCHIVED
    }
  });
  await prisma.lesson.create({
    data: {
      moduleId: moduleB.id,
      title: "Lesson B1",
      contentType: LessonContentType.TEXT,
      contentJson: { type: "doc", content: [] },
      position: 1,
      status: LessonStatus.ACTIVE
    }
  });

  const response = await request(app.getHttpServer())
    .get(`/courses/${course.id}/curriculum`)
    .set("Authorization", `Bearer ${member.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(200);

  assert.equal(response.body.id, course.id);
  assert.equal(response.body.modules.length, 2);
  assert.deepEqual(
    response.body.modules.map((item: { title: string; position: number }) => ({
      title: item.title,
      position: item.position
    })),
    [
      { title: "Module A", position: 1 },
      { title: "Module B", position: 2 }
    ]
  );
  assert.deepEqual(
    response.body.modules[0].lessons.map(
      (item: { title: string; position: number }) => ({
        title: item.title,
        position: item.position
      })
    ),
    [{ title: "Lesson A1", position: 1 }]
  );
});

test("PATCH /courses/:id updates title, description, and slug for authoring roles", async () => {
  const admin = await createUserAndToken(app, `course-update.${Date.now()}@courses.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: admin.user.id,
    name: "Course Update Org",
    slug: `course-update-org-${uniqueSuffix()}`,
    role: Role.ADMIN
  });
  const course = await prisma.course.create({
    data: {
      organizationId: organization.id,
      title: "Original Title",
      slug: `original-title-${uniqueSuffix()}`,
      description: "Original Description",
      status: CourseStatus.DRAFT,
      createdById: admin.user.id
    }
  });
  const updateSlugSuffix = uniqueSuffix();

  const response = await request(app.getHttpServer())
    .patch(`/courses/${course.id}`)
    .set("Authorization", `Bearer ${admin.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      title: "  Updated Title  ",
      slug: ` Updated__Title ${updateSlugSuffix} `,
      description: "   "
    })
    .expect(200);

  assert.equal(response.body.title, "Updated Title");
  assert.equal(response.body.slug, `updated-title-${updateSlugSuffix}`);
  assert.equal(response.body.description, null);
});

test("DELETE /courses/:id archives the course and stays idempotent", async () => {
  const owner = await createUserAndToken(app, `course-archive.${Date.now()}@courses.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Course Archive Org",
    slug: `course-archive-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const course = await prisma.course.create({
    data: {
      organizationId: organization.id,
      title: "Archive Me",
      slug: `archive-me-${uniqueSuffix()}`,
      status: CourseStatus.DRAFT,
      createdById: owner.user.id
    }
  });

  const firstResponse = await request(app.getHttpServer())
    .delete(`/courses/${course.id}`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(200);

  const secondResponse = await request(app.getHttpServer())
    .delete(`/courses/${course.id}`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(200);

  assert.equal(firstResponse.body.status, CourseStatus.ARCHIVED);
  assert.equal(secondResponse.body.status, CourseStatus.ARCHIVED);

  const persistedCourse = await prisma.course.findUnique({
    where: {
      id: course.id
    }
  });

  assert.equal(persistedCourse?.status, CourseStatus.ARCHIVED);
});

test("POST /courses/:courseId/publish creates immutable course versions from the current draft state", async () => {
  const instructor = await createUserAndToken(app, `course-publish.${Date.now()}@courses.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: instructor.user.id,
    name: "Publish Org",
    slug: `publish-org-${uniqueSuffix()}`,
    role: Role.INSTRUCTOR
  });
  const mediaAsset = await createMediaAsset({
    organizationId: organization.id,
    uploadedById: instructor.user.id
  });
  const { course, module } = await createPublishableCourse({
    organizationId: organization.id,
    createdById: instructor.user.id,
    title: "First Publish Title",
    contentJson: createImageContentDocument(mediaAsset.id)
  });
  await prisma.courseModule.create({
    data: {
      courseId: course.id,
      title: "Archived Module",
      position: 2,
      status: CourseModuleStatus.ARCHIVED
    }
  });
  await prisma.lesson.create({
    data: {
      moduleId: module.id,
      title: "Archived Lesson",
      contentType: LessonContentType.TEXT,
      contentJson: createValidContentDocument("Archived"),
      position: 2,
      status: LessonStatus.ARCHIVED
    }
  });

  const firstResponse = await request(app.getHttpServer())
    .post(`/courses/${course.id}/publish`)
    .set("Authorization", `Bearer ${instructor.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(201);

  assert.equal(firstResponse.body.courseId, course.id);
  assert.equal(firstResponse.body.organizationId, organization.id);
  assert.equal(firstResponse.body.versionNumber, 1);
  assert.equal(firstResponse.body.title, "First Publish Title");
  assert.equal(firstResponse.body.status, CourseVersionStatus.PUBLISHED);
  assert.equal(firstResponse.body.publishedById, instructor.user.id);
  assert.equal(firstResponse.body.snapshotJson, undefined);

  const firstVersion = await prisma.courseVersion.findUniqueOrThrow({
    where: {
      id: firstResponse.body.id
    }
  });
  const firstSnapshot = firstVersion.snapshotJson as {
    course: { title: string };
    modules: Array<{ title: string; lessonIds: string[] }>;
    lessons: Array<{ title: string }>;
    lessonDetails: Array<{ media: Array<{ id: string; url: string }> }>;
  };

  assert.equal(firstSnapshot.course.title, "First Publish Title");
  assert.deepEqual(
    firstSnapshot.modules.map((item) => item.title),
    ["Getting Started"]
  );
  assert.deepEqual(
    firstSnapshot.lessons.map((item) => item.title),
    ["Welcome"]
  );
  assert.equal(firstSnapshot.lessonDetails[0].media[0].id, mediaAsset.id);
  assert.match(
    firstSnapshot.lessonDetails[0].media[0].url,
    new RegExp(`/eduflow-media/${mediaAsset.storageKey.replaceAll("/", "\\/")}$`)
  );

  const persistedCourse = await prisma.course.findUniqueOrThrow({
    where: {
      id: course.id
    }
  });

  assert.equal(persistedCourse.status, CourseStatus.PUBLISHED);

  await prisma.course.update({
    where: {
      id: course.id
    },
    data: {
      title: "Second Publish Title"
    }
  });

  const secondResponse = await request(app.getHttpServer())
    .post(`/courses/${course.id}/publish`)
    .set("Authorization", `Bearer ${instructor.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(201);

  assert.equal(secondResponse.body.versionNumber, 2);
  assert.equal(secondResponse.body.title, "Second Publish Title");

  const unchangedFirstVersion = await prisma.courseVersion.findUniqueOrThrow({
    where: {
      id: firstVersion.id
    }
  });
  const unchangedFirstSnapshot = unchangedFirstVersion.snapshotJson as {
    course: { title: string };
  };

  assert.equal(unchangedFirstSnapshot.course.title, "First Publish Title");

  const otherCourse = await createPublishableCourse({
    organizationId: organization.id,
    createdById: instructor.user.id,
    title: "Other Publishable Course"
  });
  const otherResponse = await request(app.getHttpServer())
    .post(`/courses/${otherCourse.course.id}/publish`)
    .set("Authorization", `Bearer ${instructor.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(201);

  assert.equal(otherResponse.body.versionNumber, 1);
});

test("GET /courses/:courseId/publish-validation returns a valid result for publishable courses", async () => {
  const instructor = await createUserAndToken(app, `course-validate-valid.${Date.now()}@courses.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: instructor.user.id,
    name: "Validate Valid Org",
    slug: `validate-valid-org-${uniqueSuffix()}`,
    role: Role.INSTRUCTOR
  });
  const { course } = await createPublishableCourse({
    organizationId: organization.id,
    createdById: instructor.user.id
  });

  const response = await request(app.getHttpServer())
    .get(`/courses/${course.id}/publish-validation`)
    .set("Authorization", `Bearer ${instructor.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(200);

  assert.deepEqual(response.body, {
    valid: true,
    errors: []
  });
});

test("GET /courses/:courseId/publish-validation rejects missing and cross-organization courses", async () => {
  const owner = await createUserAndToken(app, `course-validate-404.${Date.now()}@courses.test`);
  const outsider = await createUserAndToken(app, `course-validate-foreign.${Date.now()}@courses.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Validate Current Org",
    slug: `validate-current-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const foreignOrganization = await createOrganizationForUser({
    prisma,
    userId: outsider.user.id,
    name: "Validate Foreign Org",
    slug: `validate-foreign-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const foreignCourse = await createPublishableCourse({
    organizationId: foreignOrganization.id,
    createdById: outsider.user.id
  });

  const missingResponse = await request(app.getHttpServer())
    .get(`/courses/missing-course-${uniqueSuffix()}/publish-validation`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(404);
  const foreignResponse = await request(app.getHttpServer())
    .get(`/courses/${foreignCourse.course.id}/publish-validation`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(404);

  assert.equal(missingResponse.body.message, "Course not found");
  assert.equal(foreignResponse.body.message, "Course not found");
});

test("GET /courses/:courseId/publish-validation reports structured course and lesson errors", async () => {
  const owner = await createUserAndToken(app, `course-validate-invalid.${Date.now()}@courses.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Validate Invalid Org",
    slug: `validate-invalid-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const noTitleCourse = await createPublishableCourse({
    organizationId: organization.id,
    createdById: owner.user.id,
    title: "   "
  });
  const emptyCourse = await prisma.course.create({
    data: {
      organizationId: organization.id,
      title: "Empty Course",
      slug: `validation-empty-course-${uniqueSuffix()}`,
      status: CourseStatus.DRAFT,
      createdById: owner.user.id
    }
  });
  const moduleOnlyCourse = await prisma.course.create({
    data: {
      organizationId: organization.id,
      title: "Module Only Course",
      slug: `validation-module-only-course-${uniqueSuffix()}`,
      status: CourseStatus.DRAFT,
      createdById: owner.user.id
    }
  });
  await prisma.courseModule.create({
    data: {
      courseId: moduleOnlyCourse.id,
      title: "Empty Module",
      position: 1,
      status: CourseModuleStatus.ACTIVE
    }
  });
  const blankLessonTitleCourse = await createPublishableCourse({
    organizationId: organization.id,
    createdById: owner.user.id,
    title: "Blank Lesson Title Course",
    lessonTitle: "   "
  });
  const invalidContentCourse = await createPublishableCourse({
    organizationId: organization.id,
    createdById: owner.user.id,
    title: "Invalid Content Course",
    contentJson: { type: "doc", content: [] }
  });
  const archivedCourse = await createPublishableCourse({
    organizationId: organization.id,
    createdById: owner.user.id,
    title: "Archived Validation Course"
  });
  await prisma.course.update({
    where: {
      id: archivedCourse.course.id
    },
    data: {
      status: CourseStatus.ARCHIVED
    }
  });

  const cases = [
    {
      courseId: noTitleCourse.course.id,
      code: "COURSE_TITLE_REQUIRED",
      path: "title"
    },
    {
      courseId: emptyCourse.id,
      code: "COURSE_WITHOUT_MODULES",
      path: "modules"
    },
    {
      courseId: moduleOnlyCourse.id,
      code: "MODULE_WITHOUT_LESSONS",
      path: "modules.0"
    },
    {
      courseId: blankLessonTitleCourse.course.id,
      code: "LESSON_TITLE_REQUIRED",
      path: "modules.0.lessons.0.title"
    },
    {
      courseId: invalidContentCourse.course.id,
      code: "LESSON_CONTENT_INVALID",
      path: "modules.0.lessons.0.contentJson"
    },
    {
      courseId: archivedCourse.course.id,
      code: "COURSE_ARCHIVED",
      path: "status"
    }
  ];

  for (const testCase of cases) {
    const response = await request(app.getHttpServer())
      .get(`/courses/${testCase.courseId}/publish-validation`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .set("X-Organization-Id", organization.id)
      .expect(200);

    assertValidationError(response.body, testCase.code, testCase.path);
  }
});

test("GET /courses/:courseId/publish-validation reports structured media reference errors", async () => {
  const owner = await createUserAndToken(app, `course-validate-media.${Date.now()}@courses.test`);
  const outsider = await createUserAndToken(app, `course-validate-media-outsider.${Date.now()}@courses.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Validate Media Org",
    slug: `validate-media-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const foreignOrganization = await createOrganizationForUser({
    prisma,
    userId: outsider.user.id,
    name: "Validate Media Foreign Org",
    slug: `validate-media-foreign-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const pendingMedia = await createMediaAsset({
    organizationId: organization.id,
    uploadedById: owner.user.id,
    status: MediaAssetStatus.PENDING
  });
  const foreignMedia = await createMediaAsset({
    organizationId: foreignOrganization.id,
    uploadedById: outsider.user.id
  });
  const cases = [
    {
      mediaId: `missing-media-${uniqueSuffix()}`,
      code: "MEDIA_ASSET_MISSING"
    },
    {
      mediaId: foreignMedia.id,
      code: "MEDIA_ASSET_WRONG_ORGANIZATION"
    },
    {
      mediaId: pendingMedia.id,
      code: "MEDIA_ASSET_UNAVAILABLE"
    }
  ];

  for (const testCase of cases) {
    const { course } = await createPublishableCourse({
      organizationId: organization.id,
      createdById: owner.user.id,
      title: `Media Validation Course ${testCase.mediaId}`,
      contentJson: createImageContentDocument(testCase.mediaId)
    });
    const response = await request(app.getHttpServer())
      .get(`/courses/${course.id}/publish-validation`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .set("X-Organization-Id", organization.id)
      .expect(200);

    assertValidationError(
      response.body,
      testCase.code,
      "modules.0.lessons.0.contentJson.blocks.0.props.assetId"
    );
  }
});

test("POST /courses/:courseId/publish rejects missing and cross-organization courses", async () => {
  const owner = await createUserAndToken(app, `course-publish-404.${Date.now()}@courses.test`);
  const outsider = await createUserAndToken(app, `course-publish-foreign.${Date.now()}@courses.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Publish Current Org",
    slug: `publish-current-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const foreignOrganization = await createOrganizationForUser({
    prisma,
    userId: outsider.user.id,
    name: "Publish Foreign Org",
    slug: `publish-foreign-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const foreignCourse = await createPublishableCourse({
    organizationId: foreignOrganization.id,
    createdById: outsider.user.id
  });

  const missingResponse = await request(app.getHttpServer())
    .post(`/courses/missing-course-${uniqueSuffix()}/publish`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(404);
  const foreignResponse = await request(app.getHttpServer())
    .post(`/courses/${foreignCourse.course.id}/publish`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(404);

  assert.equal(missingResponse.body.message, "Course not found");
  assert.equal(foreignResponse.body.message, "Course not found");
});

test("POST /courses/:courseId/publish requires organization context and authoring role", async () => {
  const student = await createUserAndToken(app, `course-publish-student.${Date.now()}@courses.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: student.user.id,
    name: "Publish Student Org",
    slug: `publish-student-org-${uniqueSuffix()}`,
    role: Role.STUDENT
  });
  const { course } = await createPublishableCourse({
    organizationId: organization.id,
    createdById: student.user.id
  });

  const missingContextResponse = await request(app.getHttpServer())
    .post(`/courses/${course.id}/publish`)
    .set("Authorization", `Bearer ${student.accessToken}`)
    .expect(403);
  const studentResponse = await request(app.getHttpServer())
    .post(`/courses/${course.id}/publish`)
    .set("Authorization", `Bearer ${student.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(403);

  assert.equal(missingContextResponse.body.message, "Organization context is required");
  assert.equal(studentResponse.body.message, "Insufficient organization role");
});

test("POST /courses/:courseId/publish rejects invalid course structures without creating versions", async () => {
  const owner = await createUserAndToken(app, `course-publish-invalid.${Date.now()}@courses.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Publish Invalid Org",
    slug: `publish-invalid-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const emptyCourse = await prisma.course.create({
    data: {
      organizationId: organization.id,
      title: "Empty Course",
      slug: `empty-course-${uniqueSuffix()}`,
      status: CourseStatus.DRAFT,
      createdById: owner.user.id
    }
  });
  const moduleOnlyCourse = await prisma.course.create({
    data: {
      organizationId: organization.id,
      title: "Module Only Course",
      slug: `module-only-course-${uniqueSuffix()}`,
      status: CourseStatus.DRAFT,
      createdById: owner.user.id
    }
  });
  await prisma.courseModule.create({
    data: {
      courseId: moduleOnlyCourse.id,
      title: "Empty Module",
      position: 1,
      status: CourseModuleStatus.ACTIVE
    }
  });
  const invalidContentCourse = await createPublishableCourse({
    organizationId: organization.id,
    createdById: owner.user.id,
    title: "Invalid Content Course",
    contentJson: { type: "doc", content: [] }
  });
  const archivedCourse = await createPublishableCourse({
    organizationId: organization.id,
    createdById: owner.user.id,
    title: "Archived Publish Course"
  });
  await prisma.course.update({
    where: {
      id: archivedCourse.course.id
    },
    data: {
      status: CourseStatus.ARCHIVED
    }
  });

  const cases = [
    {
      courseId: emptyCourse.id,
      code: "COURSE_WITHOUT_MODULES",
      path: "modules"
    },
    {
      courseId: moduleOnlyCourse.id,
      code: "MODULE_WITHOUT_LESSONS",
      path: "modules.0"
    },
    {
      courseId: invalidContentCourse.course.id,
      code: "LESSON_CONTENT_INVALID",
      path: "modules.0.lessons.0.contentJson"
    },
    {
      courseId: archivedCourse.course.id,
      code: "COURSE_ARCHIVED",
      path: "status"
    }
  ];

  for (const testCase of cases) {
    const response = await request(app.getHttpServer())
      .post(`/courses/${testCase.courseId}/publish`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .set("X-Organization-Id", organization.id)
      .expect(400);

    assert.equal(response.body.message, "Course cannot be published");
    assertValidationError(response.body.validation, testCase.code, testCase.path);
  }

  const versionCount = await prisma.courseVersion.count();

  assert.equal(versionCount, 0);
});

test("POST /courses/:courseId/publish rejects unavailable referenced media without creating versions", async () => {
  const owner = await createUserAndToken(app, `course-publish-media.${Date.now()}@courses.test`);
  const outsider = await createUserAndToken(app, `course-publish-media-outsider.${Date.now()}@courses.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Publish Media Org",
    slug: `publish-media-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const foreignOrganization = await createOrganizationForUser({
    prisma,
    userId: outsider.user.id,
    name: "Publish Media Foreign Org",
    slug: `publish-media-foreign-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const pendingMedia = await createMediaAsset({
    organizationId: organization.id,
    uploadedById: owner.user.id,
    status: MediaAssetStatus.PENDING
  });
  const deletedMedia = await createMediaAsset({
    organizationId: organization.id,
    uploadedById: owner.user.id,
    status: MediaAssetStatus.DELETED
  });
  const foreignMedia = await createMediaAsset({
    organizationId: foreignOrganization.id,
    uploadedById: outsider.user.id
  });
  const unavailableMediaCases = [
    {
      mediaId: `missing-media-${uniqueSuffix()}`,
      code: "MEDIA_ASSET_MISSING"
    },
    {
      mediaId: pendingMedia.id,
      code: "MEDIA_ASSET_UNAVAILABLE"
    },
    {
      mediaId: deletedMedia.id,
      code: "MEDIA_ASSET_UNAVAILABLE"
    },
    {
      mediaId: foreignMedia.id,
      code: "MEDIA_ASSET_WRONG_ORGANIZATION"
    }
  ];

  for (const testCase of unavailableMediaCases) {
    const { course } = await createPublishableCourse({
      organizationId: organization.id,
      createdById: owner.user.id,
      title: `Unavailable Media Course ${testCase.mediaId}`,
      contentJson: createImageContentDocument(testCase.mediaId)
    });
    const response = await request(app.getHttpServer())
      .post(`/courses/${course.id}/publish`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .set("X-Organization-Id", organization.id)
      .expect(400);

    assert.equal(response.body.message, "Course cannot be published");
    assertValidationError(
      response.body.validation,
      testCase.code,
      "modules.0.lessons.0.contentJson.blocks.0.props.assetId"
    );
  }

  const versionCount = await prisma.courseVersion.count();

  assert.equal(versionCount, 0);
});

test("course endpoints reject cross-organization access with 404", async () => {
  const authorizedUser = await createUserAndToken(app, `course-cross-a.${Date.now()}@courses.test`);
  const outsider = await createUserAndToken(app, `course-cross-b.${Date.now()}@courses.test`);

  const authorizedOrganization = await createOrganizationForUser({
    prisma,
    userId: authorizedUser.user.id,
    name: "Authorized Org",
    slug: `authorized-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const outsiderOrganization = await createOrganizationForUser({
    prisma,
    userId: outsider.user.id,
    name: "Outsider Org",
    slug: `outsider-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const foreignCourse = await prisma.course.create({
    data: {
      organizationId: outsiderOrganization.id,
      title: "Foreign Course",
      slug: `foreign-course-${uniqueSuffix()}`,
      status: CourseStatus.DRAFT,
      createdById: outsider.user.id
    }
  });

  for (const method of ["get", "patch", "delete"] as const) {
    const response = await request(app.getHttpServer())
      [method](`/courses/${foreignCourse.id}`)
      .set("Authorization", `Bearer ${authorizedUser.accessToken}`)
      .set("X-Organization-Id", authorizedOrganization.id)
      .send(method === "patch" ? { title: "Updated" } : undefined)
      .expect(404);

    assert.equal(response.body.message, "Course not found");
  }
});

test("course endpoints require organization context, allow instructor authoring, and enforce denied roles", async () => {
  const student = await createUserAndToken(app, `course-role-student.${Date.now()}@courses.test`);
  const instructor = await createUserAndToken(app, `course-role-instructor.${Date.now()}@courses.test`);

  const studentOrganization = await createOrganizationForUser({
    prisma,
    userId: student.user.id,
    name: "Student Org",
    slug: `student-org-${uniqueSuffix()}`,
    role: Role.STUDENT
  });
  const instructorOrganization = await createOrganizationForUser({
    prisma,
    userId: instructor.user.id,
    name: "Instructor Org",
    slug: `instructor-org-${uniqueSuffix()}`,
    role: Role.INSTRUCTOR
  });
  const course = await prisma.course.create({
    data: {
      organizationId: studentOrganization.id,
      title: "Protected Course",
      slug: `protected-course-${uniqueSuffix()}`,
      status: CourseStatus.DRAFT,
      createdById: student.user.id
    }
  });
  const instructorCourse = await prisma.course.create({
    data: {
      organizationId: instructorOrganization.id,
      title: "Instructor Protected Course",
      slug: `instructor-protected-course-${uniqueSuffix()}`,
      status: CourseStatus.DRAFT,
      createdById: instructor.user.id
    }
  });

  const missingContextResponse = await request(app.getHttpServer())
    .get("/courses")
    .set("Authorization", `Bearer ${student.accessToken}`)
    .expect(403);

  assert.equal(missingContextResponse.body.message, "Organization context is required");

  const studentCreateResponse = await request(app.getHttpServer())
    .post("/courses")
    .set("Authorization", `Bearer ${student.accessToken}`)
    .set("X-Organization-Id", studentOrganization.id)
    .send({
      title: "Student Course",
      slug: `student-course-${uniqueSuffix()}`
    })
    .expect(403);

  const instructorCreateResponse = await request(app.getHttpServer())
    .post("/courses")
    .set("Authorization", `Bearer ${instructor.accessToken}`)
    .set("X-Organization-Id", instructorOrganization.id)
    .send({
      title: "Instructor Course",
      slug: `instructor-course-${uniqueSuffix()}`
    })
    .expect(201);

  const instructorUpdateResponse = await request(app.getHttpServer())
    .patch(`/courses/${instructorCourse.id}`)
    .set("Authorization", `Bearer ${instructor.accessToken}`)
    .set("X-Organization-Id", instructorOrganization.id)
    .send({
      title: "Instructor Updated Course"
    })
    .expect(200);

  const studentArchiveResponse = await request(app.getHttpServer())
    .delete(`/courses/${course.id}`)
    .set("Authorization", `Bearer ${student.accessToken}`)
    .set("X-Organization-Id", studentOrganization.id)
    .expect(403);

  assert.equal(studentCreateResponse.body.message, "Insufficient organization role");
  assert.equal(instructorCreateResponse.body.createdById, instructor.user.id);
  assert.equal(instructorUpdateResponse.body.title, "Instructor Updated Course");
  assert.equal(studentArchiveResponse.body.message, "Insufficient organization role");
});

test("course endpoints return validation errors for invalid payloads", async () => {
  const owner = await createUserAndToken(app, `course-validation.${Date.now()}@courses.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Validation Org",
    slug: `validation-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const course = await prisma.course.create({
    data: {
      organizationId: organization.id,
      title: "Valid Course",
      slug: `valid-course-${uniqueSuffix()}`,
      status: CourseStatus.DRAFT,
      createdById: owner.user.id
    }
  });

  const invalidCreateResponse = await request(app.getHttpServer())
    .post("/courses")
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      title: "A",
      slug: "!!!",
      extra: "field"
    })
    .expect(400);

  const invalidUpdateResponse = await request(app.getHttpServer())
    .patch(`/courses/${course.id}`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({})
    .expect(400);

  assert.match(invalidCreateResponse.body.message, /property extra should not exist/);
  assert.match(invalidCreateResponse.body.message, /title must be longer than or equal to 2 characters/);
  assert.match(invalidCreateResponse.body.message, /slug must contain at least one letter or number/);
  assert.match(invalidUpdateResponse.body.message, /at least one of title, slug, description must be provided/);
});
