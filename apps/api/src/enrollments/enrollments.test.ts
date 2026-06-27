import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";

import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { Prisma, type PrismaClient } from "../generated/prisma/client.js";
import {
  CourseStatus,
  CourseVersionStatus,
  EnrollmentStatus,
  LessonProgressStatus,
  Role
} from "../generated/prisma/enums.js";
import { PrismaService } from "../database/prisma.service.js";
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

type PrismaTransactionClient = Prisma.TransactionClient | PrismaClient;

function createSnapshot(params: {
  organizationId: string;
  course: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
  };
  publishedById: string;
  lessonCount?: number;
}) {
  const lessonCount = params.lessonCount ?? 1;
  const moduleId = `snapshot-module-${uniqueSuffix()}`;
  const lessons = Array.from({ length: lessonCount }, (_item, index) => ({
    id: `snapshot-lesson-${uniqueSuffix()}`,
    moduleId,
    title: `Lesson ${index + 1}`,
    description: null,
    contentType: "TEXT",
    position: index + 1,
    estimatedDurationMinutes: 5,
    isPreview: false
  }));

  return {
    schemaVersion: 1,
    publishedAt: new Date().toISOString(),
    publishedBy: {
      id: params.publishedById,
      name: "Course Publisher"
    },
    course: {
      id: params.course.id,
      organizationId: params.organizationId,
      title: params.course.title,
      slug: params.course.slug,
      description: params.course.description
    },
    modules: [
      {
        id: moduleId,
        title: "Getting Started",
        description: null,
        position: 1,
        lessonIds: lessons.map((lesson) => lesson.id)
      }
    ],
    lessons,
    lessonDetails: lessons.map((lesson) => ({
      ...lesson,
      contentJson: {
        version: 1,
        blocks: []
      },
      media: []
    }))
  };
}

before(async () => {
  const context = await bootstrapTestApp();
  app = context.app;
  prisma = context.prisma;
});

beforeEach(async () => {
  await resetDatabase(prisma);
});

after(async () => {
  await closeTestApp(app);
});

async function createPublishedCourseVersion(params: {
  client?: PrismaTransactionClient;
  organizationId: string;
  userId: string;
}) {
  const client = params.client ?? prisma;
  const course = await client.course.create({
    data: {
      organizationId: params.organizationId,
      title: "Enrollment Course",
      slug: `enrollment-course-${uniqueSuffix()}`,
      description: "Published course for enrollment tests",
      status: CourseStatus.PUBLISHED,
      createdById: params.userId
    }
  });

  const snapshot = createSnapshot({
    organizationId: params.organizationId,
    course,
    publishedById: params.userId
  });

  const courseVersion = await client.courseVersion.create({
    data: {
      courseId: course.id,
      organizationId: params.organizationId,
      versionNumber: 1,
      title: course.title,
      description: course.description,
      snapshotJson: snapshot as Prisma.InputJsonValue,
      status: CourseVersionStatus.PUBLISHED,
      publishedById: params.userId,
      publishedAt: new Date()
    }
  });

  return { course, courseVersion, snapshotLessonId: snapshot.lessons[0].id };
}

async function createCourseVersionForCourse(params: {
  organizationId: string;
  userId: string;
  courseId: string;
  versionNumber: number;
  title: string;
  description: string | null;
  slug: string;
  lessonCount?: number;
  status?: CourseVersionStatus;
}) {
  const snapshot = createSnapshot({
    organizationId: params.organizationId,
    course: {
      id: params.courseId,
      title: params.title,
      slug: params.slug,
      description: params.description
    },
    publishedById: params.userId,
    lessonCount: params.lessonCount
  });

  const courseVersion = await prisma.courseVersion.create({
    data: {
      courseId: params.courseId,
      organizationId: params.organizationId,
      versionNumber: params.versionNumber,
      title: params.title,
      description: params.description,
      snapshotJson: snapshot as Prisma.InputJsonValue,
      status: params.status ?? CourseVersionStatus.PUBLISHED,
      publishedById: params.userId,
      publishedAt: new Date(Date.now() + params.versionNumber * 1000)
    }
  });

  return { courseVersion, snapshot };
}

async function createLearnerContext() {
  const learner = await createUserAndToken(
    app,
    `enrollment.${uniqueSuffix()}@courses.test`
  );
  const organization = await createOrganizationForUser({
    prisma,
    userId: learner.user.id,
    name: "Enrollment Org",
    slug: `enrollment-org-${uniqueSuffix()}`,
    role: Role.STUDENT
  });
  const { courseVersion, snapshotLessonId } = await createPublishedCourseVersion({
    organizationId: organization.id,
    userId: learner.user.id
  });

  return { learner, organization, courseVersion, snapshotLessonId };
}

test("Enrollment links a learner, organization, and course version", async () => {
  const { learner, organization, courseVersion } = await createLearnerContext();

  const enrollment = await prisma.enrollment.create({
    data: {
      userId: learner.user.id,
      organizationId: organization.id,
      courseVersionId: courseVersion.id
    },
    include: {
      user: true,
      organization: true,
      courseVersion: true
    }
  });

  assert.equal(enrollment.status, EnrollmentStatus.ACTIVE);
  assert.equal(enrollment.user.id, learner.user.id);
  assert.equal(enrollment.organization.id, organization.id);
  assert.equal(enrollment.courseVersion.id, courseVersion.id);
  assert.equal(enrollment.completedAt, null);
});

test("Enrollment prevents duplicate active enrollments for the same course version", async () => {
  const { learner, organization, courseVersion } = await createLearnerContext();

  await prisma.enrollment.create({
    data: {
      userId: learner.user.id,
      organizationId: organization.id,
      courseVersionId: courseVersion.id
    }
  });

  await assert.rejects(
    prisma.enrollment.create({
      data: {
        userId: learner.user.id,
        organizationId: organization.id,
        courseVersionId: courseVersion.id
      }
    }),
    (error) =>
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
  );
});

test("Enrollment allows historical enrollments and one current active enrollment", async () => {
  const { learner, organization, courseVersion } = await createLearnerContext();

  await prisma.enrollment.create({
    data: {
      userId: learner.user.id,
      organizationId: organization.id,
      courseVersionId: courseVersion.id,
      status: EnrollmentStatus.CANCELLED
    }
  });
  await prisma.enrollment.create({
    data: {
      userId: learner.user.id,
      organizationId: organization.id,
      courseVersionId: courseVersion.id,
      status: EnrollmentStatus.COMPLETED,
      completedAt: new Date()
    }
  });
  const activeEnrollment = await prisma.enrollment.create({
    data: {
      userId: learner.user.id,
      organizationId: organization.id,
      courseVersionId: courseVersion.id
    }
  });

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: learner.user.id,
      courseVersionId: courseVersion.id
    }
  });

  assert.equal(activeEnrollment.status, EnrollmentStatus.ACTIVE);
  assert.equal(enrollments.length, 3);
  assert.equal(
    enrollments.filter((enrollment) => enrollment.status === EnrollmentStatus.CANCELLED).length,
    1
  );
  assert.equal(
    enrollments.filter((enrollment) => enrollment.status === EnrollmentStatus.COMPLETED).length,
    1
  );
  assert.equal(
    enrollments.filter((enrollment) => enrollment.status === EnrollmentStatus.ACTIVE).length,
    1
  );
});

test("LessonProgress stores snapshot lesson IDs per enrollment", async () => {
  const { learner, organization, courseVersion, snapshotLessonId } =
    await createLearnerContext();
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: learner.user.id,
      organizationId: organization.id,
      courseVersionId: courseVersion.id
    }
  });

  const progress = await prisma.lessonProgress.create({
    data: {
      enrollmentId: enrollment.id,
      lessonId: snapshotLessonId,
      status: LessonProgressStatus.IN_PROGRESS,
      startedAt: new Date(),
      lastAccessedAt: new Date(),
      timeSpentSeconds: 90
    },
    include: {
      enrollment: true
    }
  });

  assert.equal(progress.lessonId, snapshotLessonId);
  assert.equal(progress.status, LessonProgressStatus.IN_PROGRESS);
  assert.equal(progress.timeSpentSeconds, 90);
  assert.equal(progress.enrollment.id, enrollment.id);
});

test("LessonProgress prevents duplicate rows for the same enrollment and snapshot lesson", async () => {
  const { learner, organization, courseVersion, snapshotLessonId } =
    await createLearnerContext();
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: learner.user.id,
      organizationId: organization.id,
      courseVersionId: courseVersion.id
    }
  });

  await prisma.lessonProgress.create({
    data: {
      enrollmentId: enrollment.id,
      lessonId: snapshotLessonId
    }
  });

  await assert.rejects(
    prisma.lessonProgress.create({
      data: {
        enrollmentId: enrollment.id,
        lessonId: snapshotLessonId
      }
    }),
    (error) =>
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
  );
});

test("POST /courses/:courseId/enroll enrolls the learner in the latest published version", async () => {
  const learner = await createUserAndToken(
    app,
    `enroll-latest.${uniqueSuffix()}@courses.test`
  );
  const organization = await createOrganizationForUser({
    prisma,
    userId: learner.user.id,
    name: "Latest Enrollment Org",
    slug: `latest-enrollment-org-${uniqueSuffix()}`,
    role: Role.STUDENT
  });
  const course = await prisma.course.create({
    data: {
      organizationId: organization.id,
      title: "Versioned Learning",
      slug: `versioned-learning-${uniqueSuffix()}`,
      description: "Course with multiple published versions",
      status: CourseStatus.PUBLISHED,
      createdById: learner.user.id
    }
  });

  await createCourseVersionForCourse({
    organizationId: organization.id,
    userId: learner.user.id,
    courseId: course.id,
    versionNumber: 1,
    title: "Versioned Learning v1",
    description: course.description,
    slug: course.slug,
    lessonCount: 1
  });
  const latestVersion = await createCourseVersionForCourse({
    organizationId: organization.id,
    userId: learner.user.id,
    courseId: course.id,
    versionNumber: 2,
    title: "Versioned Learning v2",
    description: course.description,
    slug: course.slug,
    lessonCount: 2
  });

  const response = await request(app.getHttpServer())
    .post(`/courses/${course.id}/enroll`)
    .set("Authorization", `Bearer ${learner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(201);

  assert.equal(response.body.userId, learner.user.id);
  assert.equal(response.body.organizationId, organization.id);
  assert.equal(response.body.courseVersionId, latestVersion.courseVersion.id);
  assert.equal(response.body.status, EnrollmentStatus.ACTIVE);
  assert.equal(response.body.courseVersion.snapshotJson, undefined);
  assert.equal(response.body.courseVersion.versionNumber, 2);
  assert.equal(response.body.snapshotMetadata.course.id, course.id);
  assert.equal(response.body.snapshotMetadata.lessonCount, 2);
  assert.equal(response.body.progressSummary.totalLessons, 2);
  assert.equal(response.body.lessonProgress.length, 2);

  const progressRows = await prisma.lessonProgress.findMany({
    where: {
      enrollmentId: response.body.id
    }
  });

  assert.equal(progressRows.length, 2);
});

test("POST /courses/:courseId/enroll returns an existing active enrollment idempotently", async () => {
  const { learner, organization, courseVersion } = await createLearnerContext();

  const firstResponse = await request(app.getHttpServer())
    .post(`/courses/${courseVersion.courseId}/enroll`)
    .set("Authorization", `Bearer ${learner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(201);
  const secondResponse = await request(app.getHttpServer())
    .post(`/courses/${courseVersion.courseId}/enroll`)
    .set("Authorization", `Bearer ${learner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(201);

  assert.equal(secondResponse.body.id, firstResponse.body.id);
  assert.equal(secondResponse.body.courseVersionId, courseVersion.id);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: learner.user.id,
      courseVersionId: courseVersion.id,
      status: EnrollmentStatus.ACTIVE
    }
  });
  const progressRows = await prisma.lessonProgress.findMany({
    where: {
      enrollmentId: firstResponse.body.id
    }
  });

  assert.equal(enrollments.length, 1);
  assert.equal(progressRows.length, 1);
});

test("POST /courses/:courseId/enroll rejects courses without a published version", async () => {
  const learner = await createUserAndToken(
    app,
    `enroll-unpublished.${uniqueSuffix()}@courses.test`
  );
  const organization = await createOrganizationForUser({
    prisma,
    userId: learner.user.id,
    name: "Unpublished Enrollment Org",
    slug: `unpublished-enrollment-org-${uniqueSuffix()}`,
    role: Role.STUDENT
  });
  const course = await prisma.course.create({
    data: {
      organizationId: organization.id,
      title: "Draft Only",
      slug: `draft-only-${uniqueSuffix()}`,
      description: null,
      status: CourseStatus.DRAFT,
      createdById: learner.user.id
    }
  });

  const response = await request(app.getHttpServer())
    .post(`/courses/${course.id}/enroll`)
    .set("Authorization", `Bearer ${learner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(404);

  assert.equal(response.body.message, "Published course version not found");
});

test("POST /courses/:courseId/enroll rejects cross-organization courses", async () => {
  const learner = await createUserAndToken(
    app,
    `enroll-cross-org.${uniqueSuffix()}@courses.test`
  );
  const currentOrganization = await createOrganizationForUser({
    prisma,
    userId: learner.user.id,
    name: "Current Enrollment Org",
    slug: `current-enrollment-org-${uniqueSuffix()}`,
    role: Role.STUDENT
  });
  const foreignOrganization = await prisma.organization.create({
    data: {
      name: "Foreign Enrollment Org",
      slug: `foreign-enrollment-org-${uniqueSuffix()}`
    }
  });
  const foreignCourse = await prisma.course.create({
    data: {
      organizationId: foreignOrganization.id,
      title: "Foreign Course",
      slug: `foreign-course-${uniqueSuffix()}`,
      description: null,
      status: CourseStatus.PUBLISHED,
      createdById: learner.user.id
    }
  });

  await createCourseVersionForCourse({
    organizationId: foreignOrganization.id,
    userId: learner.user.id,
    courseId: foreignCourse.id,
    versionNumber: 1,
    title: foreignCourse.title,
    description: foreignCourse.description,
    slug: foreignCourse.slug
  });

  const response = await request(app.getHttpServer())
    .post(`/courses/${foreignCourse.id}/enroll`)
    .set("Authorization", `Bearer ${learner.accessToken}`)
    .set("X-Organization-Id", currentOrganization.id)
    .expect(404);

  assert.equal(response.body.message, "Course not found");
});

test("GET /learning/enrollments/:enrollmentId returns enrollment snapshot metadata", async () => {
  const { learner, organization, courseVersion } = await createLearnerContext();
  const enrollmentResponse = await request(app.getHttpServer())
    .post(`/courses/${courseVersion.courseId}/enroll`)
    .set("Authorization", `Bearer ${learner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(201);

  const response = await request(app.getHttpServer())
    .get(`/learning/enrollments/${enrollmentResponse.body.id}`)
    .set("Authorization", `Bearer ${learner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(200);

  assert.equal(response.body.id, enrollmentResponse.body.id);
  assert.equal(response.body.userId, learner.user.id);
  assert.equal(response.body.courseVersionId, courseVersion.id);
  assert.equal(response.body.courseVersion.snapshotJson, undefined);
  assert.equal(response.body.snapshotMetadata.course.id, courseVersion.courseId);
  assert.equal(response.body.snapshotMetadata.lessonCount, 1);
  assert.equal(response.body.progressSummary.totalLessons, 1);
  assert.equal(response.body.lessonProgress.length, 1);
});

test("GET /learning/enrollments/:enrollmentId rejects cross-user or cross-organization access", async () => {
  const { learner, organization, courseVersion } = await createLearnerContext();
  const outsider = await createUserAndToken(
    app,
    `enrollment-outsider.${uniqueSuffix()}@courses.test`
  );

  await createOrganizationForUser({
    prisma,
    userId: outsider.user.id,
    name: "Outsider Enrollment Org",
    slug: `outsider-enrollment-org-${uniqueSuffix()}`,
    role: Role.STUDENT
  });

  const enrollment = await prisma.enrollment.create({
    data: {
      userId: learner.user.id,
      organizationId: organization.id,
      courseVersionId: courseVersion.id
    }
  });

  const response = await request(app.getHttpServer())
    .get(`/learning/enrollments/${enrollment.id}`)
    .set("Authorization", `Bearer ${outsider.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(403);

  assert.equal(response.body.message, "Organization access denied");
});
