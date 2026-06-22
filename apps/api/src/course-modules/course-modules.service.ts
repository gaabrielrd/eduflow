import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";

import type { OrganizationContext } from "../auth/types/organization-context.interface.js";
import { PrismaService } from "../database/prisma.service.js";
import { Prisma } from "../generated/prisma/client.js";
import { CourseModuleStatus, LessonStatus } from "../generated/prisma/enums.js";
import type { CreateCourseModuleDto } from "./dto/create-course-module.dto.js";
import type { UpdateCourseModuleDto } from "./dto/update-course-module.dto.js";

export const courseModuleSelect = {
  id: true,
  courseId: true,
  title: true,
  description: true,
  position: true,
  status: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.CourseModuleSelect;

@Injectable()
export class CourseModulesService {
  constructor(private readonly prisma: PrismaService) {}

  async createModule(
    context: OrganizationContext,
    courseId: string,
    dto: CreateCourseModuleDto
  ) {
    await this.ensureCourseExists(context, courseId);
    const position = await this.getNextModulePosition(courseId);

    return this.prisma.courseModule.create({
      data: {
        courseId,
        title: this.normalizeTitle(dto.title),
        description: this.normalizeDescription(dto.description),
        position,
        status: CourseModuleStatus.ACTIVE
      },
      select: courseModuleSelect
    });
  }

  async updateModule(
    context: OrganizationContext,
    courseId: string,
    moduleId: string,
    dto: UpdateCourseModuleDto
  ) {
    await this.ensureModuleExists(context, courseId, moduleId);

    const data: Prisma.CourseModuleUpdateInput = {};

    if (dto.title !== undefined) {
      data.title = this.normalizeTitle(dto.title);
    }

    if (dto.description !== undefined) {
      data.description = this.normalizeDescription(dto.description);
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        "at least one of title, description must be provided"
      );
    }

    return this.prisma.courseModule.update({
      where: {
        id: moduleId
      },
      data,
      select: courseModuleSelect
    });
  }

  async archiveModule(
    context: OrganizationContext,
    courseId: string,
    moduleId: string
  ) {
    const module = await this.ensureModuleExists(context, courseId, moduleId);

    if (module.status === CourseModuleStatus.ARCHIVED) {
      return module;
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.lesson.updateMany({
        where: {
          moduleId
        },
        data: {
          status: LessonStatus.ARCHIVED
        }
      });

      return tx.courseModule.update({
        where: {
          id: moduleId
        },
        data: {
          status: CourseModuleStatus.ARCHIVED
        },
        select: courseModuleSelect
      });
    });
  }

  async ensureCourseExists(context: OrganizationContext, courseId: string) {
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

    return course;
  }

  async ensureModuleExists(
    context: OrganizationContext,
    courseId: string,
    moduleId: string
  ) {
    const module = await this.prisma.courseModule.findFirst({
      where: {
        id: moduleId,
        courseId,
        course: {
          organizationId: context.organizationId
        }
      },
      select: courseModuleSelect
    });

    if (!module) {
      throw new NotFoundException("Module not found");
    }

    return module;
  }

  private async getNextModulePosition(courseId: string) {
    const aggregate = await this.prisma.courseModule.aggregate({
      where: {
        courseId
      },
      _max: {
        position: true
      }
    });

    return (aggregate._max.position ?? 0) + 1;
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
}
