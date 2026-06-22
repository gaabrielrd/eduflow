import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";

import type { AuthenticatedUser } from "../auth/types/authenticated-user.interface.js";
import type { OrganizationContext } from "../auth/types/organization-context.interface.js";
import { PrismaService } from "../database/prisma.service.js";
import { Prisma } from "../generated/prisma/client.js";
import {
  CourseModuleStatus,
  CourseStatus,
  LessonStatus
} from "../generated/prisma/enums.js";
import { courseModuleSelect } from "../course-modules/course-modules.service.js";
import { lessonSelect } from "../lessons/lessons.service.js";
import type { CreateCourseDto } from "./dto/create-course.dto.js";
import type { UpdateCourseDto } from "./dto/update-course.dto.js";

const courseSelect = {
  id: true,
  organizationId: true,
  title: true,
  slug: true,
  description: true,
  status: true,
  createdById: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.CourseSelect;

const courseCurriculumSelect = {
  ...courseSelect,
  modules: {
    where: {
      status: {
        not: CourseModuleStatus.ARCHIVED
      }
    },
    select: {
      ...courseModuleSelect,
      lessons: {
        where: {
          status: {
            not: LessonStatus.ARCHIVED
          }
        },
        select: lessonSelect,
        orderBy: [{ position: "asc" }, { id: "asc" }]
      }
    },
    orderBy: [{ position: "asc" }, { id: "asc" }]
  }
} satisfies Prisma.CourseSelect;

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async createCourse(
    context: OrganizationContext,
    user: AuthenticatedUser,
    dto: CreateCourseDto
  ) {
    try {
      return await this.prisma.course.create({
        data: {
          organizationId: context.organizationId,
          title: this.normalizeTitle(dto.title),
          slug: this.normalizeSlug(dto.slug),
          description: this.normalizeDescription(dto.description),
          status: CourseStatus.DRAFT,
          createdById: user.id
        },
        select: courseSelect
      });
    } catch (error) {
      this.handleKnownPersistenceErrors(error);
    }
  }

  async listCourses(context: OrganizationContext) {
    return this.prisma.course.findMany({
      where: {
        organizationId: context.organizationId,
        status: {
          not: CourseStatus.ARCHIVED
        }
      },
      select: courseSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }]
    });
  }

  async getCourseById(context: OrganizationContext, id: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        id,
        organizationId: context.organizationId
      },
      select: courseSelect
    });

    if (!course) {
      throw new NotFoundException("Course not found");
    }

    return course;
  }

  async getCourseCurriculum(context: OrganizationContext, id: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        id,
        organizationId: context.organizationId
      },
      select: courseCurriculumSelect
    });

    if (!course) {
      throw new NotFoundException("Course not found");
    }

    return course;
  }

  async updateCourse(
    context: OrganizationContext,
    id: string,
    dto: UpdateCourseDto
  ) {
    await this.ensureCourseExists(context, id);

    const data: Prisma.CourseUpdateInput = {};

    if (dto.title !== undefined) {
      data.title = this.normalizeTitle(dto.title);
    }

    if (dto.slug !== undefined) {
      data.slug = this.normalizeSlug(dto.slug);
    }

    if (dto.description !== undefined) {
      data.description = this.normalizeDescription(dto.description);
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        "at least one of title, slug, description must be provided"
      );
    }

    try {
      return await this.prisma.course.update({
        where: {
          id
        },
        data,
        select: courseSelect
      });
    } catch (error) {
      this.handleKnownPersistenceErrors(error);
    }
  }

  async archiveCourse(context: OrganizationContext, id: string) {
    const course = await this.ensureCourseExists(context, id);

    if (course.status === CourseStatus.ARCHIVED) {
      return course;
    }

    return this.prisma.course.update({
      where: {
        id
      },
      data: {
        status: CourseStatus.ARCHIVED
      },
      select: courseSelect
    });
  }

  private async ensureCourseExists(context: OrganizationContext, id: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        id,
        organizationId: context.organizationId
      },
      select: courseSelect
    });

    if (!course) {
      throw new NotFoundException("Course not found");
    }

    return course;
  }

  private normalizeSlug(slug: string) {
    const normalized = slug
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!normalized) {
      throw new BadRequestException("Slug is invalid");
    }

    return normalized;
  }

  private normalizeTitle(title: string) {
    const normalized = title.trim();

    if (!normalized) {
      throw new BadRequestException("Title is invalid");
    }

    return normalized;
  }

  private normalizeDescription(description?: string) {
    if (description === undefined) {
      return undefined;
    }

    const normalized = description.trim();

    return normalized.length > 0 ? normalized : null;
  }

  private handleKnownPersistenceErrors(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException("Slug already in use");
    }

    throw error;
  }
}
