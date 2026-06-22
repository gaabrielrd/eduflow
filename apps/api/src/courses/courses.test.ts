import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";

import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { PrismaService } from "../database/prisma.service.js";
import { CourseStatus, Role } from "../generated/prisma/enums.js";
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

test("course endpoints require organization context and enforce authoring roles", async () => {
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

  const instructorUpdateResponse = await request(app.getHttpServer())
    .patch(`/courses/${instructorCourse.id}`)
    .set("Authorization", `Bearer ${instructor.accessToken}`)
    .set("X-Organization-Id", instructorOrganization.id)
    .send({
      title: "Should Not Update"
    })
    .expect(403);

  const studentArchiveResponse = await request(app.getHttpServer())
    .delete(`/courses/${course.id}`)
    .set("Authorization", `Bearer ${student.accessToken}`)
    .set("X-Organization-Id", studentOrganization.id)
    .expect(403);

  assert.equal(studentCreateResponse.body.message, "Insufficient organization role");
  assert.equal(instructorUpdateResponse.body.message, "Insufficient organization role");
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
