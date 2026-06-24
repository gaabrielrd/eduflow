import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";

import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { PrismaService } from "../database/prisma.service.js";
import {
  CourseModuleStatus,
  CourseStatus,
  LessonContentType,
  LessonStatus,
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

async function createCourseForOrganization(params: {
  organizationId: string;
  createdById: string;
}) {
  return prisma.course.create({
    data: {
      organizationId: params.organizationId,
      title: "Lesson Test Course",
      slug: `lesson-test-course-${uniqueSuffix()}`,
      status: CourseStatus.DRAFT,
      createdById: params.createdById
    }
  });
}

async function createModuleForCourse(params: {
  courseId: string;
  title?: string;
  position?: number;
  status?: CourseModuleStatus;
}) {
  return prisma.courseModule.create({
    data: {
      courseId: params.courseId,
      title: params.title ?? "Lesson Parent Module",
      position: params.position ?? 1,
      status: params.status ?? CourseModuleStatus.ACTIVE
    }
  });
}

async function createLessonForModule(params: {
  moduleId: string;
  title?: string;
  position?: number;
  status?: LessonStatus;
}) {
  return prisma.lesson.create({
    data: {
      moduleId: params.moduleId,
      title: params.title ?? "Existing Lesson",
      contentType: LessonContentType.TEXT,
      contentJson: { type: "doc", content: [] },
      position: params.position ?? 1,
      status: params.status ?? LessonStatus.ACTIVE
    }
  });
}

test("POST /modules/:moduleId/lessons creates a lesson with appended position and full metadata", async () => {
  const manager = await createUserAndToken(app, `lesson-create.${Date.now()}@lessons.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: manager.user.id,
    name: "Lesson Org",
    slug: `lesson-org-${uniqueSuffix()}`,
    role: Role.MANAGER
  });
  const course = await createCourseForOrganization({
    organizationId: organization.id,
    createdById: manager.user.id
  });
  const module = await createModuleForCourse({
    courseId: course.id
  });

  await createLessonForModule({
    moduleId: module.id
  });

  const response = await request(app.getHttpServer())
    .post(`/modules/${module.id}/lessons`)
    .set("Authorization", `Bearer ${manager.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      title: "  New Lesson  ",
      description: "  Lesson description  ",
      contentType: LessonContentType.VIDEO,
      contentJson: {
        type: "doc",
        content: [{ type: "paragraph", content: [] }]
      },
      estimatedDurationMinutes: 15,
      isPreview: true
    })
    .expect(201);

  assert.equal(response.body.moduleId, module.id);
  assert.equal(response.body.title, "New Lesson");
  assert.equal(response.body.description, "Lesson description");
  assert.equal(response.body.contentType, LessonContentType.VIDEO);
  assert.deepEqual(response.body.contentJson, {
    type: "doc",
    content: [{ type: "paragraph", content: [] }]
  });
  assert.equal(response.body.position, 2);
  assert.equal(response.body.estimatedDurationMinutes, 15);
  assert.equal(response.body.isPreview, true);
  assert.equal(response.body.status, LessonStatus.ACTIVE);
});

test("POST /modules/:moduleId/lessons/reorder reorders active lessons and keeps archived lessons after them", async () => {
  const manager = await createUserAndToken(app, `lesson-reorder.${Date.now()}@lessons.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: manager.user.id,
    name: "Lesson Reorder Org",
    slug: `lesson-reorder-org-${uniqueSuffix()}`,
    role: Role.MANAGER
  });
  const course = await createCourseForOrganization({
    organizationId: organization.id,
    createdById: manager.user.id
  });
  const module = await createModuleForCourse({
    courseId: course.id
  });
  const lessonA = await createLessonForModule({
    moduleId: module.id,
    title: "Lesson A",
    position: 1
  });
  const lessonB = await createLessonForModule({
    moduleId: module.id,
    title: "Lesson B",
    position: 2
  });
  const lessonC = await createLessonForModule({
    moduleId: module.id,
    title: "Lesson C",
    position: 3
  });
  const archivedLesson = await createLessonForModule({
    moduleId: module.id,
    title: "Archived Lesson",
    position: 4,
    status: LessonStatus.ARCHIVED
  });

  const response = await request(app.getHttpServer())
    .post(`/modules/${module.id}/lessons/reorder`)
    .set("Authorization", `Bearer ${manager.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      items: [
        { id: lessonC.id, position: 1 },
        { id: lessonA.id, position: 2 }
      ]
    })
    .expect(201);

  assert.deepEqual(
    response.body.map((item: { id: string; position: number }) => ({
      id: item.id,
      position: item.position
    })),
    [
      { id: lessonC.id, position: 1 },
      { id: lessonA.id, position: 2 },
      { id: lessonB.id, position: 3 }
    ]
  );

  const persistedLessons = await prisma.lesson.findMany({
    where: {
      moduleId: module.id
    },
    orderBy: [{ position: "asc" }, { id: "asc" }]
  });

  assert.deepEqual(
    persistedLessons.map((item) => ({
      id: item.id,
      position: item.position,
      status: item.status
    })),
    [
      { id: lessonC.id, position: 1, status: LessonStatus.ACTIVE },
      { id: lessonA.id, position: 2, status: LessonStatus.ACTIVE },
      { id: lessonB.id, position: 3, status: LessonStatus.ACTIVE },
      { id: archivedLesson.id, position: 4, status: LessonStatus.ARCHIVED }
    ]
  );
});

test("PATCH /lessons/:lessonId updates title and lesson metadata", async () => {
  const admin = await createUserAndToken(app, `lesson-update.${Date.now()}@lessons.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: admin.user.id,
    name: "Lesson Update Org",
    slug: `lesson-update-org-${uniqueSuffix()}`,
    role: Role.ADMIN
  });
  const course = await createCourseForOrganization({
    organizationId: organization.id,
    createdById: admin.user.id
  });
  const module = await createModuleForCourse({
    courseId: course.id
  });
  const lesson = await createLessonForModule({
    moduleId: module.id
  });

  const response = await request(app.getHttpServer())
    .patch(`/lessons/${lesson.id}`)
    .set("Authorization", `Bearer ${admin.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      title: "  Updated Lesson  ",
      description: "   ",
      contentType: LessonContentType.FILE,
      contentJson: {
        type: "file",
        assetId: "asset-123"
      },
      estimatedDurationMinutes: 0,
      isPreview: true
    })
    .expect(200);

  assert.equal(response.body.title, "Updated Lesson");
  assert.equal(response.body.description, null);
  assert.equal(response.body.contentType, LessonContentType.FILE);
  assert.deepEqual(response.body.contentJson, {
    type: "file",
    assetId: "asset-123"
  });
  assert.equal(response.body.estimatedDurationMinutes, 0);
  assert.equal(response.body.isPreview, true);
});

test("lesson authoring endpoints allow instructors to mutate lessons", async () => {
  const instructor = await createUserAndToken(app, `lesson-instructor.${Date.now()}@lessons.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: instructor.user.id,
    name: "Lesson Instructor Org",
    slug: `lesson-instructor-org-${uniqueSuffix()}`,
    role: Role.INSTRUCTOR
  });
  const course = await createCourseForOrganization({
    organizationId: organization.id,
    createdById: instructor.user.id
  });
  const module = await createModuleForCourse({
    courseId: course.id
  });

  const createResponse = await request(app.getHttpServer())
    .post(`/modules/${module.id}/lessons`)
    .set("Authorization", `Bearer ${instructor.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      title: "Instructor Lesson",
      contentType: LessonContentType.TEXT,
      contentJson: { type: "doc", content: [] }
    })
    .expect(201);

  const updateResponse = await request(app.getHttpServer())
    .patch(`/lessons/${createResponse.body.id}`)
    .set("Authorization", `Bearer ${instructor.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      title: "Instructor Lesson Updated"
    })
    .expect(200);

  assert.equal(createResponse.body.title, "Instructor Lesson");
  assert.equal(updateResponse.body.title, "Instructor Lesson Updated");
});

test("DELETE /lessons/:lessonId archives lessons idempotently", async () => {
  const owner = await createUserAndToken(app, `lesson-archive.${Date.now()}@lessons.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Lesson Archive Org",
    slug: `lesson-archive-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const course = await createCourseForOrganization({
    organizationId: organization.id,
    createdById: owner.user.id
  });
  const module = await createModuleForCourse({
    courseId: course.id
  });
  const lesson = await createLessonForModule({
    moduleId: module.id
  });

  const firstResponse = await request(app.getHttpServer())
    .delete(`/lessons/${lesson.id}`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(200);

  const secondResponse = await request(app.getHttpServer())
    .delete(`/lessons/${lesson.id}`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(200);

  assert.equal(firstResponse.body.status, LessonStatus.ARCHIVED);
  assert.equal(secondResponse.body.status, LessonStatus.ARCHIVED);
});

test("lesson endpoints reject cross-organization access with 404", async () => {
  const authorizedUser = await createUserAndToken(app, `lesson-cross-a.${Date.now()}@lessons.test`);
  const outsider = await createUserAndToken(app, `lesson-cross-b.${Date.now()}@lessons.test`);
  const authorizedOrganization = await createOrganizationForUser({
    prisma,
    userId: authorizedUser.user.id,
    name: "Authorized Lesson Org",
    slug: `authorized-lesson-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const outsiderOrganization = await createOrganizationForUser({
    prisma,
    userId: outsider.user.id,
    name: "Outsider Lesson Org",
    slug: `outsider-lesson-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const authorizedCourse = await createCourseForOrganization({
    organizationId: authorizedOrganization.id,
    createdById: authorizedUser.user.id
  });
  const outsiderCourse = await createCourseForOrganization({
    organizationId: outsiderOrganization.id,
    createdById: outsider.user.id
  });
  const outsiderModule = await createModuleForCourse({
    courseId: outsiderCourse.id
  });
  const outsiderLesson = await createLessonForModule({
    moduleId: outsiderModule.id
  });

  const createResponse = await request(app.getHttpServer())
    .post(`/modules/${outsiderModule.id}/lessons`)
    .set("Authorization", `Bearer ${authorizedUser.accessToken}`)
    .set("X-Organization-Id", authorizedOrganization.id)
    .send({
      title: "Should Fail",
      contentType: LessonContentType.TEXT,
      contentJson: { type: "doc", content: [] }
    })
    .expect(404);

  assert.equal(createResponse.body.message, "Module not found");

  for (const method of ["patch", "delete"] as const) {
    const response = await request(app.getHttpServer())
      [method](`/lessons/${outsiderLesson.id}`)
      .set("Authorization", `Bearer ${authorizedUser.accessToken}`)
      .set("X-Organization-Id", authorizedOrganization.id)
      .send(method === "patch" ? { title: "Updated" } : undefined)
      .expect(404);

    assert.equal(response.body.message, "Lesson not found");
  }

  void authorizedCourse;
});

test("lesson endpoints validate payloads and reject non-authoring roles", async () => {
  const student = await createUserAndToken(app, `lesson-student.${Date.now()}@lessons.test`);
  const owner = await createUserAndToken(app, `lesson-owner.${Date.now()}@lessons.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: student.user.id,
    name: "Lesson Student Org",
    slug: `lesson-student-org-${uniqueSuffix()}`,
    role: Role.STUDENT
  });
  const ownerOrganization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Lesson Owner Org",
    slug: `lesson-owner-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const ownerCourse = await createCourseForOrganization({
    organizationId: ownerOrganization.id,
    createdById: owner.user.id
  });
  const ownerModule = await createModuleForCourse({
    courseId: ownerCourse.id
  });
  const ownerLesson = await createLessonForModule({
    moduleId: ownerModule.id
  });

  const forbiddenResponse = await request(app.getHttpServer())
    .post(`/modules/${ownerModule.id}/lessons`)
    .set("Authorization", `Bearer ${student.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      title: "Forbidden Lesson",
      contentType: LessonContentType.TEXT,
      contentJson: { type: "doc", content: [] }
    })
    .expect(403);

  const invalidCreateResponse = await request(app.getHttpServer())
    .post(`/modules/${ownerModule.id}/lessons`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", ownerOrganization.id)
    .send({
      title: "A",
      contentType: "INVALID",
      estimatedDurationMinutes: -1,
      extra: "field"
    })
    .expect(400);

  const invalidUpdateResponse = await request(app.getHttpServer())
    .patch(`/lessons/${ownerLesson.id}`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", ownerOrganization.id)
    .send({})
    .expect(400);

  assert.equal(forbiddenResponse.body.message, "Insufficient organization role");
  assert.match(invalidCreateResponse.body.message, /property extra should not exist/);
  assert.match(invalidCreateResponse.body.message, /title must be longer than or equal to 2 characters/);
  assert.match(invalidCreateResponse.body.message, /contentType must be one of the following values/);
  assert.match(invalidCreateResponse.body.message, /estimatedDurationMinutes must not be less than 0/);
  assert.match(invalidCreateResponse.body.message, /contentJson should not be null or undefined/);
  assert.match(
    invalidUpdateResponse.body.message,
    /at least one of title, description, contentType, contentJson, estimatedDurationMinutes, isPreview must be provided/
  );
});

test("lesson reorder rejects invalid payload semantics and unauthorized access", async () => {
  const owner = await createUserAndToken(app, `lesson-reorder-owner.${Date.now()}@lessons.test`);
  const student = await createUserAndToken(app, `lesson-reorder-student.${Date.now()}@lessons.test`);
  const outsider = await createUserAndToken(app, `lesson-reorder-outsider.${Date.now()}@lessons.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Lesson Reorder Validation Org",
    slug: `lesson-reorder-validation-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const studentOrganization = await createOrganizationForUser({
    prisma,
    userId: student.user.id,
    name: "Lesson Reorder Student Org",
    slug: `lesson-reorder-student-org-${uniqueSuffix()}`,
    role: Role.STUDENT
  });
  const outsiderOrganization = await createOrganizationForUser({
    prisma,
    userId: outsider.user.id,
    name: "Lesson Reorder Outsider Org",
    slug: `lesson-reorder-outsider-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const course = await createCourseForOrganization({
    organizationId: organization.id,
    createdById: owner.user.id
  });
  const module = await createModuleForCourse({
    courseId: course.id
  });
  const lessonA = await createLessonForModule({
    moduleId: module.id,
    position: 1
  });
  const lessonB = await createLessonForModule({
    moduleId: module.id,
    position: 2
  });
  const outsiderCourse = await createCourseForOrganization({
    organizationId: outsiderOrganization.id,
    createdById: outsider.user.id
  });
  const outsiderModule = await createModuleForCourse({
    courseId: outsiderCourse.id
  });
  const foreignLesson = await createLessonForModule({
    moduleId: outsiderModule.id,
    position: 1
  });

  const duplicateIdResponse = await request(app.getHttpServer())
    .post(`/modules/${module.id}/lessons/reorder`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      items: [
        { id: lessonA.id, position: 1 },
        { id: lessonA.id, position: 2 }
      ]
    })
    .expect(400);

  const duplicatePositionResponse = await request(app.getHttpServer())
    .post(`/modules/${module.id}/lessons/reorder`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      items: [
        { id: lessonA.id, position: 1 },
        { id: lessonB.id, position: 1 }
      ]
    })
    .expect(400);

  const outOfRangeResponse = await request(app.getHttpServer())
    .post(`/modules/${module.id}/lessons/reorder`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      items: [{ id: lessonA.id, position: 3 }]
    })
    .expect(400);

  const foreignItemResponse = await request(app.getHttpServer())
    .post(`/modules/${module.id}/lessons/reorder`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      items: [{ id: foreignLesson.id, position: 1 }]
    })
    .expect(404);

  const missingItemResponse = await request(app.getHttpServer())
    .post(`/modules/${module.id}/lessons/reorder`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      items: [{ id: "missing-lesson", position: 1 }]
    })
    .expect(404);

  const crossOrgParentResponse = await request(app.getHttpServer())
    .post(`/modules/${outsiderModule.id}/lessons/reorder`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      items: [{ id: foreignLesson.id, position: 1 }]
    })
    .expect(404);

  const forbiddenResponse = await request(app.getHttpServer())
    .post(`/modules/${module.id}/lessons/reorder`)
    .set("Authorization", `Bearer ${student.accessToken}`)
    .set("X-Organization-Id", studentOrganization.id)
    .send({
      items: [{ id: lessonA.id, position: 1 }]
    })
    .expect(403);

  assert.equal(duplicateIdResponse.body.message, "duplicate item ids are not allowed");
  assert.equal(
    duplicatePositionResponse.body.message,
    "duplicate target positions are not allowed"
  );
  assert.equal(outOfRangeResponse.body.message, "target position is out of range");
  assert.equal(foreignItemResponse.body.message, "Lesson not found");
  assert.equal(missingItemResponse.body.message, "Lesson not found");
  assert.equal(crossOrgParentResponse.body.message, "Module not found");
  assert.equal(forbiddenResponse.body.message, "Insufficient organization role");
});
