import { Injectable, NotFoundException } from "@nestjs/common";
import type { CourseVersionSnapshot } from "@eduflow/types";

import type { AuthenticatedUser } from "../auth/types/authenticated-user.interface.js";
import type { OrganizationContext } from "../auth/types/organization-context.interface.js";
import { PrismaService } from "../database/prisma.service.js";
import { Prisma } from "../generated/prisma/client.js";
import {
  CourseVersionStatus,
  EnrollmentStatus,
  LessonProgressStatus
} from "../generated/prisma/enums.js";
import { LearningSnapshotService } from "./learning-snapshot.service.js";

const enrollmentDetailSelect = {
  id: true,
  userId: true,
  organizationId: true,
  courseVersionId: true,
  status: true,
  enrolledAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  courseVersion: {
    select: {
      id: true,
      courseId: true,
      organizationId: true,
      versionNumber: true,
      title: true,
      description: true,
      status: true,
      publishedById: true,
      publishedBy: {
        select: {
          id: true,
          name: true
        }
      },
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      snapshotJson: true
    }
  },
  lessonProgress: {
    select: {
      id: true,
      enrollmentId: true,
      lessonId: true,
      status: true,
      startedAt: true,
      completedAt: true,
      lastAccessedAt: true,
      timeSpentSeconds: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: {
      createdAt: "asc"
    }
  }
} satisfies Prisma.EnrollmentSelect;

type EnrollmentDetail = Prisma.EnrollmentGetPayload<{
  select: typeof enrollmentDetailSelect;
}>;

type EnrollmentClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learningSnapshotService: LearningSnapshotService
  ) {}

  async enrollInLatestPublishedVersion(
    context: OrganizationContext,
    user: AuthenticatedUser,
    courseId: string
  ) {
    const course = await this.prisma.course.findFirst({
      where: {
        id: courseId,
        organizationId: context.organizationId
      },
      select: {
        id: true
      }
    });

    if (!course) {
      throw new NotFoundException("Course not found");
    }

    const latestVersion = await this.prisma.courseVersion.findFirst({
      where: {
        courseId,
        organizationId: context.organizationId,
        status: CourseVersionStatus.PUBLISHED
      },
      select: {
        id: true,
        snapshotJson: true
      },
      orderBy: [{ versionNumber: "desc" }, { publishedAt: "desc" }]
    });

    if (!latestVersion) {
      throw new NotFoundException("Published course version not found");
    }

    try {
      const enrollment = await this.prisma.$transaction(
        async (transaction) =>
          this.findOrCreateActiveEnrollment(transaction, {
            context,
            user,
            courseVersionId: latestVersion.id,
            snapshot: latestVersion.snapshotJson as unknown as CourseVersionSnapshot
          }),
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable
        }
      );

      return this.formatEnrollment(enrollment);
    } catch (error) {
      if (!this.isUniqueEnrollmentRace(error)) {
        throw error;
      }

      const enrollment = await this.prisma.$transaction(async (transaction) => {
        const existingEnrollment = await this.findActiveEnrollment(transaction, {
          context,
          user,
          courseVersionId: latestVersion.id
        });

        if (!existingEnrollment) {
          throw error;
        }

        await this.ensureProgressRows(transaction, {
          enrollmentId: existingEnrollment.id,
          snapshot: latestVersion.snapshotJson as unknown as CourseVersionSnapshot
        });

        return this.findEnrollmentById(transaction, {
          context,
          user,
          enrollmentId: existingEnrollment.id
        });
      });

      return this.formatEnrollment(enrollment);
    }
  }

  async getEnrollmentById(
    context: OrganizationContext,
    user: AuthenticatedUser,
    enrollmentId: string
  ) {
    const enrollment = await this.findEnrollmentById(this.prisma, {
      context,
      user,
      enrollmentId
    });

    if (!enrollment) {
      throw new NotFoundException("Enrollment not found");
    }

    return this.formatLearningEnrollment(enrollment);
  }

  async listMyCourses(context: OrganizationContext, user: AuthenticatedUser) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        userId: user.id,
        organizationId: context.organizationId
      },
      select: enrollmentDetailSelect,
      orderBy: [{ enrolledAt: "desc" }, { id: "asc" }]
    });

    return enrollments.map((enrollment) => this.formatMyCourse(enrollment));
  }

  private async findOrCreateActiveEnrollment(
    client: EnrollmentClient,
    params: {
      context: OrganizationContext;
      user: AuthenticatedUser;
      courseVersionId: string;
      snapshot: CourseVersionSnapshot;
    }
  ) {
    const existingEnrollment = await this.findActiveEnrollment(client, params);

    if (existingEnrollment) {
      await this.ensureProgressRows(client, {
        enrollmentId: existingEnrollment.id,
        snapshot: params.snapshot
      });

      const hydratedEnrollment = await this.findEnrollmentById(client, {
        context: params.context,
        user: params.user,
        enrollmentId: existingEnrollment.id
      });

      if (!hydratedEnrollment) {
        throw new NotFoundException("Enrollment not found");
      }

      return hydratedEnrollment;
    }

    const enrollment = await client.enrollment.create({
      data: {
        userId: params.user.id,
        organizationId: params.context.organizationId,
        courseVersionId: params.courseVersionId
      },
      select: {
        id: true
      }
    });

    await this.ensureProgressRows(client, {
      enrollmentId: enrollment.id,
      snapshot: params.snapshot
    });

    const hydratedEnrollment = await this.findEnrollmentById(client, {
      context: params.context,
      user: params.user,
      enrollmentId: enrollment.id
    });

    if (!hydratedEnrollment) {
      throw new NotFoundException("Enrollment not found");
    }

    return hydratedEnrollment;
  }

  private findActiveEnrollment(
    client: EnrollmentClient,
    params: {
      context: OrganizationContext;
      user: AuthenticatedUser;
      courseVersionId: string;
    }
  ) {
    return client.enrollment.findFirst({
      where: {
        userId: params.user.id,
        organizationId: params.context.organizationId,
        courseVersionId: params.courseVersionId,
        status: EnrollmentStatus.ACTIVE
      },
      select: {
        id: true
      }
    });
  }

  private findEnrollmentById(
    client: EnrollmentClient,
    params: {
      context: OrganizationContext;
      user: AuthenticatedUser;
      enrollmentId: string;
    }
  ) {
    return client.enrollment.findFirst({
      where: {
        id: params.enrollmentId,
        userId: params.user.id,
        organizationId: params.context.organizationId
      },
      select: enrollmentDetailSelect
    });
  }

  private ensureProgressRows(
    client: EnrollmentClient,
    params: {
      enrollmentId: string;
      snapshot: CourseVersionSnapshot;
    }
  ) {
    if (params.snapshot.lessons.length === 0) {
      return Promise.resolve({ count: 0 });
    }

    return client.lessonProgress.createMany({
      data: params.snapshot.lessons.map((lesson) => ({
        enrollmentId: params.enrollmentId,
        lessonId: lesson.id
      })),
      skipDuplicates: true
    });
  }

  private formatEnrollment(enrollment: EnrollmentDetail | null) {
    if (!enrollment) {
      throw new NotFoundException("Enrollment not found");
    }

    const snapshot = this.learningSnapshotService.parseSnapshot(
      enrollment.courseVersion.snapshotJson
    );
    const courseVersion: Partial<typeof enrollment.courseVersion> = {
      ...enrollment.courseVersion
    };
    delete courseVersion.snapshotJson;

    return {
      ...enrollment,
      courseVersion,
      snapshotMetadata: this.learningSnapshotService.getSnapshotMetadata(snapshot),
      progressSummary: {
        totalLessons: enrollment.lessonProgress.length,
        completedLessons: enrollment.lessonProgress.filter(
          (progress) => progress.status === LessonProgressStatus.COMPLETED
        ).length
      }
    };
  }

  private formatMyCourse(enrollment: EnrollmentDetail) {
    const snapshot = this.learningSnapshotService.parseSnapshot(
      enrollment.courseVersion.snapshotJson
    );

    return {
      id: enrollment.id,
      courseTitle: snapshot.course.title,
      courseDescription: snapshot.course.description,
      versionNumber: enrollment.courseVersion.versionNumber,
      status: enrollment.status,
      progressPercentage: this.learningSnapshotService.getProgressPercentage(
        snapshot,
        enrollment.lessonProgress
      ),
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt
    };
  }

  private formatLearningEnrollment(enrollment: EnrollmentDetail) {
    const snapshot = this.learningSnapshotService.parseSnapshot(
      enrollment.courseVersion.snapshotJson
    );

    return {
      id: enrollment.id,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      courseVersionId: enrollment.courseVersionId,
      snapshotMetadata: this.learningSnapshotService.getSnapshotMetadata(snapshot),
      modules: this.learningSnapshotService.getOrderedModules(snapshot),
      lessons: this.learningSnapshotService.getOrderedLessons(snapshot),
      lessonProgress: this.learningSnapshotService.getLessonProgressMap(
        enrollment.lessonProgress
      ),
      progressPercentage: this.learningSnapshotService.getProgressPercentage(
        snapshot,
        enrollment.lessonProgress
      )
    };
  }

  private isUniqueEnrollmentRace(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    );
  }
}
