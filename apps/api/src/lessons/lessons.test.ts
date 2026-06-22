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
  status?: CourseModuleStatus;
}) {
  return prisma.courseModule.create({
    data: {
      courseId: params.courseId,
      title: "Lesson Parent Module",
      position: 1,
      status: params.status ?? CourseModuleStatus.ACTIVE
    }
  });
}

async function createLessonForModule(params: {
  moduleId: string;
  status?: LessonStatus;
}) {
  return prisma.lesson.create({
    data: {
      moduleId: params.moduleId,
      title: "Existing Lesson",
      contentType: LessonContentType.TEXT,
      contentJson: { type: "doc", content: [] },
      position: 1,
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
