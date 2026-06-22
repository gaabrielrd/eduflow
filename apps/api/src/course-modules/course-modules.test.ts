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
  title?: string;
}) {
  return prisma.course.create({
    data: {
      organizationId: params.organizationId,
      title: params.title ?? "Test Course",
      slug: `test-course-${uniqueSuffix()}`,
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
      title: params.title ?? "Test Module",
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
      title: params.title ?? "Test Lesson",
      contentType: LessonContentType.TEXT,
      contentJson: { type: "doc", content: [] },
      position: params.position ?? 1,
      status: params.status ?? LessonStatus.ACTIVE
    }
  });
}

test("POST /courses/:courseId/modules creates a module and appends position", async () => {
  const manager = await createUserAndToken(app, `module-create.${Date.now()}@modules.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: manager.user.id,
    name: "Modules Org",
    slug: `modules-org-${uniqueSuffix()}`,
    role: Role.MANAGER
  });
  const course = await createCourseForOrganization({
    organizationId: organization.id,
    createdById: manager.user.id
  });

  await createModuleForCourse({
    courseId: course.id,
    title: "Existing Module",
    position: 1
  });

  const response = await request(app.getHttpServer())
    .post(`/courses/${course.id}/modules`)
    .set("Authorization", `Bearer ${manager.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      title: "  New Module  ",
      description: "  Module description  "
    })
    .expect(201);

  assert.equal(response.body.courseId, course.id);
  assert.equal(response.body.title, "New Module");
  assert.equal(response.body.description, "Module description");
  assert.equal(response.body.position, 2);
  assert.equal(response.body.status, CourseModuleStatus.ACTIVE);
});

test("POST /courses/:courseId/modules/reorder reorders active modules and compacts archived modules after them", async () => {
  const manager = await createUserAndToken(app, `module-reorder.${Date.now()}@modules.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: manager.user.id,
    name: "Module Reorder Org",
    slug: `module-reorder-org-${uniqueSuffix()}`,
    role: Role.MANAGER
  });
  const course = await createCourseForOrganization({
    organizationId: organization.id,
    createdById: manager.user.id
  });
  const moduleA = await createModuleForCourse({
    courseId: course.id,
    title: "Module A",
    position: 1
  });
  const moduleB = await createModuleForCourse({
    courseId: course.id,
    title: "Module B",
    position: 2
  });
  const moduleC = await createModuleForCourse({
    courseId: course.id,
    title: "Module C",
    position: 3
  });
  const archivedModule = await createModuleForCourse({
    courseId: course.id,
    title: "Archived Module",
    position: 4,
    status: CourseModuleStatus.ARCHIVED
  });

  const response = await request(app.getHttpServer())
    .post(`/courses/${course.id}/modules/reorder`)
    .set("Authorization", `Bearer ${manager.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      items: [
        { id: moduleC.id, position: 1 },
        { id: moduleA.id, position: 2 }
      ]
    })
    .expect(201);

  assert.deepEqual(
    response.body.map((item: { id: string; position: number }) => ({
      id: item.id,
      position: item.position
    })),
    [
      { id: moduleC.id, position: 1 },
      { id: moduleA.id, position: 2 },
      { id: moduleB.id, position: 3 }
    ]
  );

  const persistedModules = await prisma.courseModule.findMany({
    where: {
      courseId: course.id
    },
    orderBy: [{ position: "asc" }, { id: "asc" }]
  });

  assert.deepEqual(
    persistedModules.map((item) => ({
      id: item.id,
      position: item.position,
      status: item.status
    })),
    [
      { id: moduleC.id, position: 1, status: CourseModuleStatus.ACTIVE },
      { id: moduleA.id, position: 2, status: CourseModuleStatus.ACTIVE },
      { id: moduleB.id, position: 3, status: CourseModuleStatus.ACTIVE },
      {
        id: archivedModule.id,
        position: 4,
        status: CourseModuleStatus.ARCHIVED
      }
    ]
  );
});

test("PATCH /courses/:courseId/modules/:moduleId updates title and description", async () => {
  const admin = await createUserAndToken(app, `module-update.${Date.now()}@modules.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: admin.user.id,
    name: "Module Update Org",
    slug: `module-update-org-${uniqueSuffix()}`,
    role: Role.ADMIN
  });
  const course = await createCourseForOrganization({
    organizationId: organization.id,
    createdById: admin.user.id
  });
  const module = await createModuleForCourse({
    courseId: course.id,
    title: "Original Module"
  });

  const response = await request(app.getHttpServer())
    .patch(`/courses/${course.id}/modules/${module.id}`)
    .set("Authorization", `Bearer ${admin.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      title: "  Updated Module  ",
      description: "   "
    })
    .expect(200);

  assert.equal(response.body.title, "Updated Module");
  assert.equal(response.body.description, null);
});

test("DELETE /courses/:courseId/modules/:moduleId archives the module and all lessons idempotently", async () => {
  const owner = await createUserAndToken(app, `module-archive.${Date.now()}@modules.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Module Archive Org",
    slug: `module-archive-org-${uniqueSuffix()}`,
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
    .delete(`/courses/${course.id}/modules/${module.id}`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(200);

  const secondResponse = await request(app.getHttpServer())
    .delete(`/courses/${course.id}/modules/${module.id}`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(200);

  assert.equal(firstResponse.body.status, CourseModuleStatus.ARCHIVED);
  assert.equal(secondResponse.body.status, CourseModuleStatus.ARCHIVED);

  const persistedLesson = await prisma.lesson.findUnique({
    where: {
      id: lesson.id
    }
  });

  assert.equal(persistedLesson?.status, LessonStatus.ARCHIVED);
});

test("module endpoints reject cross-organization access with 404", async () => {
  const authorizedUser = await createUserAndToken(app, `module-cross-a.${Date.now()}@modules.test`);
  const outsider = await createUserAndToken(app, `module-cross-b.${Date.now()}@modules.test`);
  const authorizedOrganization = await createOrganizationForUser({
    prisma,
    userId: authorizedUser.user.id,
    name: "Authorized Module Org",
    slug: `authorized-module-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const outsiderOrganization = await createOrganizationForUser({
    prisma,
    userId: outsider.user.id,
    name: "Outsider Module Org",
    slug: `outsider-module-org-${uniqueSuffix()}`,
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

  await request(app.getHttpServer())
    .post(`/courses/${outsiderCourse.id}/modules`)
    .set("Authorization", `Bearer ${authorizedUser.accessToken}`)
    .set("X-Organization-Id", authorizedOrganization.id)
    .send({
      title: "Should Fail"
    })
    .expect(404);

  for (const method of ["patch", "delete"] as const) {
    const response = await request(app.getHttpServer())
      [method](`/courses/${authorizedCourse.id}/modules/${outsiderModule.id}`)
      .set("Authorization", `Bearer ${authorizedUser.accessToken}`)
      .set("X-Organization-Id", authorizedOrganization.id)
      .send(method === "patch" ? { title: "Updated" } : undefined)
      .expect(404);

    assert.equal(response.body.message, "Module not found");
  }
});

test("module endpoints require authoring roles and validate payloads", async () => {
  const student = await createUserAndToken(app, `module-student.${Date.now()}@modules.test`);
  const owner = await createUserAndToken(app, `module-owner.${Date.now()}@modules.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: student.user.id,
    name: "Student Module Org",
    slug: `student-module-org-${uniqueSuffix()}`,
    role: Role.STUDENT
  });
  const ownerOrganization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Owner Module Org",
    slug: `owner-module-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const course = await createCourseForOrganization({
    organizationId: organization.id,
    createdById: student.user.id
  });
  const ownerCourse = await createCourseForOrganization({
    organizationId: ownerOrganization.id,
    createdById: owner.user.id
  });
  const module = await createModuleForCourse({
    courseId: course.id
  });

  const forbiddenResponse = await request(app.getHttpServer())
    .post(`/courses/${course.id}/modules`)
    .set("Authorization", `Bearer ${student.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      title: "Forbidden Module"
    })
    .expect(403);

  const invalidCreateResponse = await request(app.getHttpServer())
    .post(`/courses/${ownerCourse.id}/modules`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", ownerOrganization.id)
    .send({
      title: "A",
      extra: "field"
    })
    .expect(400);

  const missingContextResponse = await request(app.getHttpServer())
    .post(`/courses/${ownerCourse.id}/modules`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .send({
      title: "Missing Context"
    })
    .expect(403);

  const invalidUpdateResponse = await request(app.getHttpServer())
    .patch(`/courses/${course.id}/modules/${module.id}`)
    .set("Authorization", `Bearer ${student.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({})
    .expect(403);

  assert.equal(forbiddenResponse.body.message, "Insufficient organization role");
  assert.match(invalidCreateResponse.body.message, /property extra should not exist/);
  assert.match(invalidCreateResponse.body.message, /title must be longer than or equal to 2 characters/);
  assert.equal(missingContextResponse.body.message, "Organization context is required");
  assert.equal(invalidUpdateResponse.body.message, "Insufficient organization role");
});

test("module reorder rejects invalid payload semantics and non-authoring roles", async () => {
  const owner = await createUserAndToken(app, `module-reorder-owner.${Date.now()}@modules.test`);
  const student = await createUserAndToken(app, `module-reorder-student.${Date.now()}@modules.test`);
  const outsider = await createUserAndToken(app, `module-reorder-outsider.${Date.now()}@modules.test`);
  const organization = await createOrganizationForUser({
    prisma,
    userId: owner.user.id,
    name: "Module Reorder Validation Org",
    slug: `module-reorder-validation-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const studentOrganization = await createOrganizationForUser({
    prisma,
    userId: student.user.id,
    name: "Module Reorder Student Org",
    slug: `module-reorder-student-org-${uniqueSuffix()}`,
    role: Role.STUDENT
  });
  const outsiderOrganization = await createOrganizationForUser({
    prisma,
    userId: outsider.user.id,
    name: "Module Reorder Outsider Org",
    slug: `module-reorder-outsider-org-${uniqueSuffix()}`,
    role: Role.OWNER
  });
  const course = await createCourseForOrganization({
    organizationId: organization.id,
    createdById: owner.user.id
  });
  const moduleA = await createModuleForCourse({
    courseId: course.id,
    position: 1
  });
  const moduleB = await createModuleForCourse({
    courseId: course.id,
    position: 2
  });
  const outsiderCourse = await createCourseForOrganization({
    organizationId: outsiderOrganization.id,
    createdById: outsider.user.id
  });
  const foreignModule = await createModuleForCourse({
    courseId: outsiderCourse.id,
    position: 1
  });

  const duplicateIdResponse = await request(app.getHttpServer())
    .post(`/courses/${course.id}/modules/reorder`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      items: [
        { id: moduleA.id, position: 1 },
        { id: moduleA.id, position: 2 }
      ]
    })
    .expect(400);

  const duplicatePositionResponse = await request(app.getHttpServer())
    .post(`/courses/${course.id}/modules/reorder`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      items: [
        { id: moduleA.id, position: 1 },
        { id: moduleB.id, position: 1 }
      ]
    })
    .expect(400);

  const outOfRangeResponse = await request(app.getHttpServer())
    .post(`/courses/${course.id}/modules/reorder`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      items: [{ id: moduleA.id, position: 3 }]
    })
    .expect(400);

  const foreignItemResponse = await request(app.getHttpServer())
    .post(`/courses/${course.id}/modules/reorder`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      items: [{ id: foreignModule.id, position: 1 }]
    })
    .expect(404);

  const missingItemResponse = await request(app.getHttpServer())
    .post(`/courses/${course.id}/modules/reorder`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      items: [{ id: "missing-module", position: 1 }]
    })
    .expect(404);

  const crossOrgParentResponse = await request(app.getHttpServer())
    .post(`/courses/${outsiderCourse.id}/modules/reorder`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .send({
      items: [{ id: foreignModule.id, position: 1 }]
    })
    .expect(404);

  const forbiddenResponse = await request(app.getHttpServer())
    .post(`/courses/${course.id}/modules/reorder`)
    .set("Authorization", `Bearer ${student.accessToken}`)
    .set("X-Organization-Id", studentOrganization.id)
    .send({
      items: [{ id: moduleA.id, position: 1 }]
    })
    .expect(403);

  assert.equal(duplicateIdResponse.body.message, "duplicate item ids are not allowed");
  assert.equal(
    duplicatePositionResponse.body.message,
    "duplicate target positions are not allowed"
  );
  assert.equal(outOfRangeResponse.body.message, "target position is out of range");
  assert.equal(foreignItemResponse.body.message, "Module not found");
  assert.equal(missingItemResponse.body.message, "Module not found");
  assert.equal(crossOrgParentResponse.body.message, "Course not found");
  assert.equal(forbiddenResponse.body.message, "Insufficient organization role");
});
