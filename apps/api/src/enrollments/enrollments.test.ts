import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";

import type { INestApplication } from "@nestjs/common";

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

  const snapshotModuleId = `snapshot-module-${uniqueSuffix()}`;
  const snapshotLessonId = `snapshot-lesson-${uniqueSuffix()}`;
  const snapshot = {
    schemaVersion: 1,
    publishedAt: new Date().toISOString(),
    publishedBy: {
      id: params.userId,
      name: "Course Publisher"
    },
    course: {
      id: course.id,
      organizationId: params.organizationId,
      title: course.title,
      slug: course.slug,
      description: course.description
    },
    modules: [
      {
        id: snapshotModuleId,
        title: "Getting Started",
        description: null,
        position: 1,
        lessonIds: [snapshotLessonId]
      }
    ],
    lessons: [
      {
        id: snapshotLessonId,
        moduleId: snapshotModuleId,
        title: "Welcome",
        description: null,
        contentType: "TEXT",
        position: 1,
        estimatedDurationMinutes: 5,
        isPreview: false
      }
    ],
    lessonDetails: [
      {
        id: snapshotLessonId,
        moduleId: snapshotModuleId,
        title: "Welcome",
        description: null,
        contentType: "TEXT",
        position: 1,
        estimatedDurationMinutes: 5,
        isPreview: false,
        contentJson: {
          version: 1,
          blocks: []
        },
        media: []
      }
    ]
  };

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

  return { course, courseVersion, snapshotLessonId };
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
