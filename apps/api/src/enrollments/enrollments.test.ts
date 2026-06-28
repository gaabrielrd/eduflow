import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";

import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { Prisma, type PrismaClient } from "../generated/prisma/client.js";
import {
  CourseStatus,
  CourseVersionStatus,
  EnrollmentStatus,
  LessonContentType,
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
  moduleLessonCounts?: number[];
}) {
  const moduleLessonCounts =
    params.moduleLessonCounts ?? [params.lessonCount ?? 1];
  const modules = moduleLessonCounts.map((lessonCount, moduleIndex) => {
    const moduleId = `snapshot-module-${uniqueSuffix()}`;
    const lessonIds = Array.from({ length: lessonCount }, () =>
      `snapshot-lesson-${uniqueSuffix()}`
    );

    return {
      id: moduleId,
      title: `Module ${moduleIndex + 1}`,
      description: null,
      position: moduleIndex + 1,
      lessonIds
    };
  });
  const lessons = modules.flatMap((module) =>
    module.lessonIds.map((lessonId, lessonIndex) => ({
      id: lessonId,
      moduleId: module.id,
      title: `${module.title} Lesson ${lessonIndex + 1}`,
      description: null,
      contentType: "TEXT",
      position: lessonIndex + 1,
      estimatedDurationMinutes: 5,
      isPreview: false
    }))
  );

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
    modules,
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
  moduleLessonCounts?: number[];
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
    lessonCount: params.lessonCount,
    moduleLessonCounts: params.moduleLessonCounts
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

test("GET /learning/my-courses lists only the current user's current-organization enrollments", async () => {
  const learner = await createUserAndToken(
    app,
    `my-courses.${uniqueSuffix()}@courses.test`
  );
  const otherLearner = await createUserAndToken(
    app,
    `my-courses-other.${uniqueSuffix()}@courses.test`
  );
  const organization = await createOrganizationForUser({
    prisma,
    userId: learner.user.id,
    name: "My Courses Org",
    slug: `my-courses-org-${uniqueSuffix()}`,
    role: Role.STUDENT
  });
  await prisma.membership.create({
    data: {
      userId: otherLearner.user.id,
      organizationId: organization.id,
      role: Role.STUDENT
    }
  });
  const otherOrganization = await createOrganizationForUser({
    prisma,
    userId: learner.user.id,
    name: "Other My Courses Org",
    slug: `other-my-courses-org-${uniqueSuffix()}`,
    role: Role.STUDENT
  });
  const first = await createPublishedCourseVersion({
    organizationId: organization.id,
    userId: learner.user.id
  });
  const second = await createPublishedCourseVersion({
    organizationId: organization.id,
    userId: learner.user.id
  });
  const otherUserCourse = await createPublishedCourseVersion({
    organizationId: organization.id,
    userId: otherLearner.user.id
  });
  const otherOrgCourse = await createPublishedCourseVersion({
    organizationId: otherOrganization.id,
    userId: learner.user.id
  });
  const firstEnrollment = await prisma.enrollment.create({
    data: {
      userId: learner.user.id,
      organizationId: organization.id,
      courseVersionId: first.courseVersion.id,
      enrolledAt: new Date("2026-06-27T12:00:00.000Z")
    }
  });
  const secondEnrollment = await prisma.enrollment.create({
    data: {
      userId: learner.user.id,
      organizationId: organization.id,
      courseVersionId: second.courseVersion.id,
      enrolledAt: new Date("2026-06-27T13:00:00.000Z")
    }
  });

  await prisma.enrollment.create({
    data: {
      userId: otherLearner.user.id,
      organizationId: organization.id,
      courseVersionId: otherUserCourse.courseVersion.id
    }
  });
  await prisma.enrollment.create({
    data: {
      userId: learner.user.id,
      organizationId: otherOrganization.id,
      courseVersionId: otherOrgCourse.courseVersion.id
    }
  });
  await prisma.lessonProgress.createMany({
    data: [
      {
        enrollmentId: firstEnrollment.id,
        lessonId: first.snapshotLessonId,
        status: LessonProgressStatus.COMPLETED
      },
      {
        enrollmentId: secondEnrollment.id,
        lessonId: second.snapshotLessonId,
        status: LessonProgressStatus.NOT_STARTED
      }
    ]
  });

  const response = await request(app.getHttpServer())
    .get("/learning/my-courses")
    .set("Authorization", `Bearer ${learner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(200);

  assert.equal(response.body.length, 2);
  assert.deepEqual(
    response.body.map((course: { id: string }) => course.id),
    [secondEnrollment.id, firstEnrollment.id]
  );
  assert.deepEqual(response.body[1], {
    id: firstEnrollment.id,
    courseTitle: first.course.title,
    courseDescription: first.course.description,
    versionNumber: first.courseVersion.versionNumber,
    status: EnrollmentStatus.ACTIVE,
    progressPercentage: 100,
    enrolledAt: firstEnrollment.enrolledAt.toISOString(),
    completedAt: null
  });
  assert.equal(response.body[0].progressPercentage, 0);
});

test("GET /learning/enrollments/:enrollmentId returns learner snapshot detail", async () => {
  const learner = await createUserAndToken(
    app,
    `learning-detail.${uniqueSuffix()}@courses.test`
  );
  const organization = await createOrganizationForUser({
    prisma,
    userId: learner.user.id,
    name: "Learning Detail Org",
    slug: `learning-detail-org-${uniqueSuffix()}`,
    role: Role.STUDENT
  });
  const course = await prisma.course.create({
    data: {
      organizationId: organization.id,
      title: "Learning Detail Course",
      slug: `learning-detail-course-${uniqueSuffix()}`,
      description: "Rendered from the published snapshot",
      status: CourseStatus.PUBLISHED,
      createdById: learner.user.id
    }
  });
  const { courseVersion, snapshot } = await createCourseVersionForCourse({
    organizationId: organization.id,
    userId: learner.user.id,
    courseId: course.id,
    versionNumber: 1,
    title: course.title,
    description: course.description,
    slug: course.slug,
    moduleLessonCounts: [1, 2]
  });
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: learner.user.id,
      organizationId: organization.id,
      courseVersionId: courseVersion.id
    }
  });

  await prisma.lessonProgress.createMany({
    data: [
      {
        enrollmentId: enrollment.id,
        lessonId: snapshot.lessons[0].id,
        status: LessonProgressStatus.COMPLETED,
        completedAt: new Date("2026-06-27T14:00:00.000Z"),
        timeSpentSeconds: 120
      },
      {
        enrollmentId: enrollment.id,
        lessonId: snapshot.lessons[1].id,
        status: LessonProgressStatus.IN_PROGRESS,
        startedAt: new Date("2026-06-27T14:05:00.000Z"),
        timeSpentSeconds: 30
      },
      {
        enrollmentId: enrollment.id,
        lessonId: snapshot.lessons[2].id,
        status: LessonProgressStatus.NOT_STARTED
      }
    ]
  });

  const response = await request(app.getHttpServer())
    .get(`/learning/enrollments/${enrollment.id}`)
    .set("Authorization", `Bearer ${learner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(200);

  assert.equal(response.body.id, enrollment.id);
  assert.equal(response.body.courseVersionId, courseVersion.id);
  assert.equal(response.body.userId, undefined);
  assert.equal(response.body.organizationId, undefined);
  assert.equal(response.body.courseVersion, undefined);
  assert.equal(response.body.snapshotJson, undefined);
  assert.deepEqual(
    response.body.modules.map((module: { id: string }) => module.id),
    snapshot.modules.map((module) => module.id)
  );
  assert.deepEqual(
    response.body.lessons.map((lesson: { id: string }) => lesson.id),
    snapshot.lessons.map((lesson) => lesson.id)
  );
  assert.deepEqual(
    response.body.lessonDetails.map((lesson: { id: string }) => lesson.id),
    snapshot.lessonDetails.map((lesson) => lesson.id)
  );
  assert.equal(response.body.snapshotMetadata.course.id, course.id);
  assert.equal(response.body.snapshotMetadata.lessonCount, 3);
  assert.equal(response.body.progressPercentage, 33);
  assert.deepEqual(
    response.body.lessonDetails[0].contentJson,
    snapshot.lessonDetails[0].contentJson
  );
  assert.deepEqual(response.body.lessonDetails[0].media, snapshot.lessonDetails[0].media);
  assert.equal(
    response.body.lessonProgress[snapshot.lessons[0].id].status,
    LessonProgressStatus.COMPLETED
  );
  assert.equal(
    response.body.lessonProgress[snapshot.lessons[1].id].status,
    LessonProgressStatus.IN_PROGRESS
  );
  assert.equal(
    response.body.lessonProgress[snapshot.lessons[2].id].status,
    LessonProgressStatus.NOT_STARTED
  );
  assert.equal(response.body.lessons[0].contentJson, undefined);
  assert.equal(response.body.snapshotJson, undefined);
});

test("GET /learning/enrollments/:enrollmentId rejects another user's enrollment", async () => {
  const { learner, organization, courseVersion } = await createLearnerContext();
  const outsider = await createUserAndToken(
    app,
    `enrollment-outsider.${uniqueSuffix()}@courses.test`
  );
  await prisma.membership.create({
    data: {
      userId: outsider.user.id,
      organizationId: organization.id,
      role: Role.STUDENT
    }
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
    .expect(404);

  assert.equal(response.body.message, "Enrollment not found");
});

test("GET /learning/enrollments/:enrollmentId rejects cross-organization access", async () => {
  const { learner, organization, courseVersion } = await createLearnerContext();
  const otherOrganization = await createOrganizationForUser({
    prisma,
    userId: learner.user.id,
    name: "Cross Organization Learning Org",
    slug: `cross-organization-learning-org-${uniqueSuffix()}`,
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
    .set("Authorization", `Bearer ${learner.accessToken}`)
    .set("X-Organization-Id", otherOrganization.id)
    .expect(404);

  assert.equal(response.body.message, "Enrollment not found");
});

test("POST /learning/enrollments/:enrollmentId/lessons/:lessonId/start creates missing progress", async () => {
  const { learner, organization, courseVersion, snapshotLessonId } =
    await createLearnerContext();
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: learner.user.id,
      organizationId: organization.id,
      courseVersionId: courseVersion.id
    }
  });

  const response = await request(app.getHttpServer())
    .post(`/learning/enrollments/${enrollment.id}/lessons/${snapshotLessonId}/start`)
    .set("Authorization", `Bearer ${learner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(201);

  assert.equal(response.body.enrollmentId, enrollment.id);
  assert.equal(response.body.completedCount, 0);
  assert.equal(response.body.totalCount, 1);
  assert.equal(response.body.percentage, 0);
  assert.equal(
    response.body.lessonProgress[snapshotLessonId].status,
    LessonProgressStatus.IN_PROGRESS
  );
  assert.ok(response.body.lessonProgress[snapshotLessonId].startedAt);
  assert.ok(response.body.lessonProgress[snapshotLessonId].lastAccessedAt);
});

test("POST /learning/enrollments/:enrollmentId/lessons/:lessonId/start updates existing progress access", async () => {
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
      status: LessonProgressStatus.NOT_STARTED,
      lastAccessedAt: new Date("2026-06-27T12:00:00.000Z")
    }
  });

  await request(app.getHttpServer())
    .post(`/learning/enrollments/${enrollment.id}/lessons/${snapshotLessonId}/start`)
    .set("Authorization", `Bearer ${learner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(201);

  const updatedProgress = await prisma.lessonProgress.findUniqueOrThrow({
    where: {
      id: progress.id
    }
  });

  assert.equal(updatedProgress.status, LessonProgressStatus.IN_PROGRESS);
  assert.ok(updatedProgress.startedAt);
  assert.ok(updatedProgress.lastAccessedAt);
  assert.ok(
    updatedProgress.lastAccessedAt.getTime() >
      new Date("2026-06-27T12:00:00.000Z").getTime()
  );
});

test("POST /learning/enrollments/:enrollmentId/lessons/:lessonId/start rejects invalid lesson and unauthorized enrollment access", async () => {
  const { learner, organization, courseVersion } = await createLearnerContext();
  const outsider = await createUserAndToken(
    app,
    `start-outsider.${uniqueSuffix()}@courses.test`
  );
  await prisma.membership.create({
    data: {
      userId: outsider.user.id,
      organizationId: organization.id,
      role: Role.STUDENT
    }
  });
  const otherOrganization = await createOrganizationForUser({
    prisma,
    userId: learner.user.id,
    name: "Start Cross Org",
    slug: `start-cross-org-${uniqueSuffix()}`,
    role: Role.STUDENT
  });
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: learner.user.id,
      organizationId: organization.id,
      courseVersionId: courseVersion.id
    }
  });

  const invalidLessonResponse = await request(app.getHttpServer())
    .post(`/learning/enrollments/${enrollment.id}/lessons/missing-lesson/start`)
    .set("Authorization", `Bearer ${learner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(404);
  const anotherUserResponse = await request(app.getHttpServer())
    .post(`/learning/enrollments/${enrollment.id}/lessons/missing-lesson/start`)
    .set("Authorization", `Bearer ${outsider.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(404);
  const crossOrganizationResponse = await request(app.getHttpServer())
    .post(`/learning/enrollments/${enrollment.id}/lessons/missing-lesson/start`)
    .set("Authorization", `Bearer ${learner.accessToken}`)
    .set("X-Organization-Id", otherOrganization.id)
    .expect(404);

  assert.equal(invalidLessonResponse.body.message, "Lesson not found");
  assert.equal(anotherUserResponse.body.message, "Enrollment not found");
  assert.equal(crossOrganizationResponse.body.message, "Enrollment not found");
});

test("POST /learning/enrollments/:enrollmentId/lessons/:lessonId/complete completes lessons and enrollment", async () => {
  const learner = await createUserAndToken(
    app,
    `complete-lessons.${uniqueSuffix()}@courses.test`
  );
  const organization = await createOrganizationForUser({
    prisma,
    userId: learner.user.id,
    name: "Complete Lessons Org",
    slug: `complete-lessons-org-${uniqueSuffix()}`,
    role: Role.STUDENT
  });
  const course = await prisma.course.create({
    data: {
      organizationId: organization.id,
      title: "Complete Lessons Course",
      slug: `complete-lessons-course-${uniqueSuffix()}`,
      description: null,
      status: CourseStatus.PUBLISHED,
      createdById: learner.user.id
    }
  });
  const { courseVersion, snapshot } = await createCourseVersionForCourse({
    organizationId: organization.id,
    userId: learner.user.id,
    courseId: course.id,
    versionNumber: 1,
    title: course.title,
    description: course.description,
    slug: course.slug,
    lessonCount: 2
  });
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: learner.user.id,
      organizationId: organization.id,
      courseVersionId: courseVersion.id
    }
  });

  const firstResponse = await request(app.getHttpServer())
    .post(`/learning/enrollments/${enrollment.id}/lessons/${snapshot.lessons[0].id}/complete`)
    .set("Authorization", `Bearer ${learner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(201);

  assert.equal(firstResponse.body.completedCount, 1);
  assert.equal(firstResponse.body.totalCount, 2);
  assert.equal(firstResponse.body.percentage, 50);
  assert.equal(firstResponse.body.status, EnrollmentStatus.ACTIVE);
  assert.equal(firstResponse.body.completedAt, null);
  assert.equal(
    firstResponse.body.lessonProgress[snapshot.lessons[0].id].status,
    LessonProgressStatus.COMPLETED
  );
  assert.ok(firstResponse.body.lessonProgress[snapshot.lessons[0].id].completedAt);

  const secondResponse = await request(app.getHttpServer())
    .post(`/learning/enrollments/${enrollment.id}/lessons/${snapshot.lessons[1].id}/complete`)
    .set("Authorization", `Bearer ${learner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(201);

  assert.equal(secondResponse.body.completedCount, 2);
  assert.equal(secondResponse.body.totalCount, 2);
  assert.equal(secondResponse.body.percentage, 100);
  assert.equal(secondResponse.body.status, EnrollmentStatus.COMPLETED);
  assert.ok(secondResponse.body.completedAt);
  const enrollmentCompletedAt = secondResponse.body.completedAt;

  const thirdResponse = await request(app.getHttpServer())
    .post(`/learning/enrollments/${enrollment.id}/lessons/${snapshot.lessons[1].id}/complete`)
    .set("Authorization", `Bearer ${learner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(201);

  assert.equal(thirdResponse.body.completedCount, 2);
  assert.equal(thirdResponse.body.totalCount, 2);
  assert.equal(thirdResponse.body.percentage, 100);
  assert.equal(thirdResponse.body.status, EnrollmentStatus.COMPLETED);
  assert.equal(thirdResponse.body.completedAt, enrollmentCompletedAt);

  const completedEnrollment = await prisma.enrollment.findUniqueOrThrow({
    where: {
      id: enrollment.id
    }
  });

  assert.equal(completedEnrollment.status, EnrollmentStatus.COMPLETED);
  assert.ok(completedEnrollment.completedAt);
  assert.equal(completedEnrollment.completedAt.toISOString(), enrollmentCompletedAt);

  const progressRows = await prisma.lessonProgress.findMany({
    where: {
      enrollmentId: enrollment.id
    }
  });

  assert.equal(progressRows.length, 2);
});

test("POST /learning/enrollments/:enrollmentId/lessons/:lessonId/complete preserves existing completion timestamp", async () => {
  const { learner, organization, courseVersion, snapshotLessonId } =
    await createLearnerContext();
  const completedAt = new Date("2026-06-27T12:30:00.000Z");
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
      status: LessonProgressStatus.COMPLETED,
      startedAt: new Date("2026-06-27T12:00:00.000Z"),
      completedAt,
      lastAccessedAt: completedAt
    }
  });

  await request(app.getHttpServer())
    .post(`/learning/enrollments/${enrollment.id}/lessons/${snapshotLessonId}/complete`)
    .set("Authorization", `Bearer ${learner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(201);

  const updatedProgress = await prisma.lessonProgress.findUniqueOrThrow({
    where: {
      id: progress.id
    }
  });

  assert.equal(updatedProgress.status, LessonProgressStatus.COMPLETED);
  assert.equal(updatedProgress.completedAt?.toISOString(), completedAt.toISOString());
  assert.ok(updatedProgress.lastAccessedAt);
  assert.ok(updatedProgress.lastAccessedAt.getTime() > completedAt.getTime());
});

test("POST /learning/enrollments/:enrollmentId/lessons/:lessonId/complete ignores draft course changes after enrollment", async () => {
  const learner = await createUserAndToken(
    app,
    `complete-snapshot-only.${uniqueSuffix()}@courses.test`
  );
  const organization = await createOrganizationForUser({
    prisma,
    userId: learner.user.id,
    name: "Complete Snapshot Only Org",
    slug: `complete-snapshot-only-org-${uniqueSuffix()}`,
    role: Role.STUDENT
  });
  const course = await prisma.course.create({
    data: {
      organizationId: organization.id,
      title: "Snapshot Only Course",
      slug: `snapshot-only-course-${uniqueSuffix()}`,
      description: null,
      status: CourseStatus.PUBLISHED,
      createdById: learner.user.id
    }
  });
  const { courseVersion, snapshot } = await createCourseVersionForCourse({
    organizationId: organization.id,
    userId: learner.user.id,
    courseId: course.id,
    versionNumber: 1,
    title: course.title,
    description: course.description,
    slug: course.slug,
    lessonCount: 1
  });
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: learner.user.id,
      organizationId: organization.id,
      courseVersionId: courseVersion.id
    }
  });
  const draftModule = await prisma.courseModule.create({
    data: {
      courseId: course.id,
      title: "Draft module after enrollment",
      description: null,
      position: 1
    }
  });

  await prisma.lesson.create({
    data: {
      moduleId: draftModule.id,
      title: "Draft lesson after enrollment",
      description: null,
      contentType: LessonContentType.TEXT,
      contentJson: {
        version: 1,
        blocks: []
      },
      position: 1
    }
  });

  const response = await request(app.getHttpServer())
    .post(`/learning/enrollments/${enrollment.id}/lessons/${snapshot.lessons[0].id}/complete`)
    .set("Authorization", `Bearer ${learner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(201);

  assert.equal(response.body.completedCount, 1);
  assert.equal(response.body.totalCount, 1);
  assert.equal(response.body.percentage, 100);
  assert.equal(response.body.status, EnrollmentStatus.COMPLETED);
  assert.ok(response.body.completedAt);
});

test("GET /learning/enrollments/:enrollmentId/progress ignores completed progress outside the snapshot", async () => {
  const learner = await createUserAndToken(
    app,
    `progress-non-snapshot.${uniqueSuffix()}@courses.test`
  );
  const organization = await createOrganizationForUser({
    prisma,
    userId: learner.user.id,
    name: "Progress Non Snapshot Org",
    slug: `progress-non-snapshot-org-${uniqueSuffix()}`,
    role: Role.STUDENT
  });
  const course = await prisma.course.create({
    data: {
      organizationId: organization.id,
      title: "Progress Non Snapshot Course",
      slug: `progress-non-snapshot-course-${uniqueSuffix()}`,
      description: null,
      status: CourseStatus.PUBLISHED,
      createdById: learner.user.id
    }
  });
  const { courseVersion, snapshot } = await createCourseVersionForCourse({
    organizationId: organization.id,
    userId: learner.user.id,
    courseId: course.id,
    versionNumber: 1,
    title: course.title,
    description: course.description,
    slug: course.slug,
    lessonCount: 2
  });
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: learner.user.id,
      organizationId: organization.id,
      courseVersionId: courseVersion.id
    }
  });

  await prisma.lessonProgress.createMany({
    data: [
      {
        enrollmentId: enrollment.id,
        lessonId: snapshot.lessons[0].id,
        status: LessonProgressStatus.COMPLETED
      },
      {
        enrollmentId: enrollment.id,
        lessonId: `outside-snapshot-${uniqueSuffix()}`,
        status: LessonProgressStatus.COMPLETED
      }
    ]
  });

  const response = await request(app.getHttpServer())
    .get(`/learning/enrollments/${enrollment.id}/progress`)
    .set("Authorization", `Bearer ${learner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(200);

  assert.equal(response.body.completedCount, 1);
  assert.equal(response.body.totalCount, 2);
  assert.equal(response.body.percentage, 50);
  assert.equal(response.body.status, EnrollmentStatus.ACTIVE);
});

test("GET /learning/enrollments/:enrollmentId/progress returns progress summary from snapshot totals", async () => {
  const learner = await createUserAndToken(
    app,
    `progress-summary.${uniqueSuffix()}@courses.test`
  );
  const organization = await createOrganizationForUser({
    prisma,
    userId: learner.user.id,
    name: "Progress Summary Org",
    slug: `progress-summary-org-${uniqueSuffix()}`,
    role: Role.STUDENT
  });
  const course = await prisma.course.create({
    data: {
      organizationId: organization.id,
      title: "Progress Summary Course",
      slug: `progress-summary-course-${uniqueSuffix()}`,
      description: null,
      status: CourseStatus.PUBLISHED,
      createdById: learner.user.id
    }
  });
  const { courseVersion, snapshot } = await createCourseVersionForCourse({
    organizationId: organization.id,
    userId: learner.user.id,
    courseId: course.id,
    versionNumber: 1,
    title: course.title,
    description: course.description,
    slug: course.slug,
    lessonCount: 3
  });
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: learner.user.id,
      organizationId: organization.id,
      courseVersionId: courseVersion.id
    }
  });

  await prisma.lessonProgress.createMany({
    data: [
      {
        enrollmentId: enrollment.id,
        lessonId: snapshot.lessons[0].id,
        status: LessonProgressStatus.COMPLETED
      },
      {
        enrollmentId: enrollment.id,
        lessonId: snapshot.lessons[1].id,
        status: LessonProgressStatus.IN_PROGRESS
      }
    ]
  });

  const response = await request(app.getHttpServer())
    .get(`/learning/enrollments/${enrollment.id}/progress`)
    .set("Authorization", `Bearer ${learner.accessToken}`)
    .set("X-Organization-Id", organization.id)
    .expect(200);

  assert.equal(response.body.enrollmentId, enrollment.id);
  assert.equal(response.body.status, EnrollmentStatus.ACTIVE);
  assert.equal(response.body.completedCount, 1);
  assert.equal(response.body.totalCount, 3);
  assert.equal(response.body.percentage, 33);
  assert.equal(
    response.body.lessonProgress[snapshot.lessons[0].id].status,
    LessonProgressStatus.COMPLETED
  );
  assert.equal(
    response.body.lessonProgress[snapshot.lessons[1].id].status,
    LessonProgressStatus.IN_PROGRESS
  );
});
