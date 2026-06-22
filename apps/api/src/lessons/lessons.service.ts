import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";

import type { OrganizationContext } from "../auth/types/organization-context.interface.js";
import { PrismaService } from "../database/prisma.service.js";
import { Prisma } from "../generated/prisma/client.js";
import {
  CourseModuleStatus,
  LessonStatus
} from "../generated/prisma/enums.js";
import type { CreateLessonDto } from "./dto/create-lesson.dto.js";
import type { UpdateLessonDto } from "./dto/update-lesson.dto.js";

const lessonSelect = {
  id: true,
  moduleId: true,
  title: true,
  description: true,
  contentType: true,
  contentJson: true,
  position: true,
  estimatedDurationMinutes: true,
  isPreview: true,
  status: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.LessonSelect;

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  async createLesson(
    context: OrganizationContext,
    moduleId: string,
    dto: CreateLessonDto
  ) {
    const module = await this.ensureActiveModuleExists(context, moduleId);
    const position = await this.getNextLessonPosition(moduleId);

    return this.prisma.lesson.create({
      data: {
        moduleId: module.id,
        title: this.normalizeTitle(dto.title),
        description: this.normalizeDescription(dto.description),
        contentType: dto.contentType,
        contentJson: dto.contentJson as Prisma.InputJsonValue,
        position,
        estimatedDurationMinutes: dto.estimatedDurationMinutes ?? null,
        isPreview: dto.isPreview ?? false,
        status: LessonStatus.ACTIVE
      },
      select: lessonSelect
    });
  }

  async updateLesson(
    context: OrganizationContext,
    lessonId: string,
    dto: UpdateLessonDto
  ) {
    await this.ensureLessonExists(context, lessonId);

    const data: Prisma.LessonUpdateInput = {};

    if (dto.title !== undefined) {
      data.title = this.normalizeTitle(dto.title);
    }

    if (dto.description !== undefined) {
      data.description = this.normalizeDescription(dto.description);
    }

    if (dto.contentType !== undefined) {
      data.contentType = dto.contentType;
    }

    if (dto.contentJson !== undefined) {
      data.contentJson = dto.contentJson as Prisma.InputJsonValue;
    }

    if (dto.estimatedDurationMinutes !== undefined) {
      data.estimatedDurationMinutes = dto.estimatedDurationMinutes;
    }

    if (dto.isPreview !== undefined) {
      data.isPreview = dto.isPreview;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        "at least one of title, description, contentType, contentJson, estimatedDurationMinutes, isPreview must be provided"
      );
    }

    return this.prisma.lesson.update({
      where: {
        id: lessonId
      },
      data,
      select: lessonSelect
    });
  }

  async archiveLesson(context: OrganizationContext, lessonId: string) {
    const lesson = await this.ensureLessonExists(context, lessonId);

    if (lesson.status === LessonStatus.ARCHIVED) {
      return lesson;
    }

    return this.prisma.lesson.update({
      where: {
        id: lessonId
      },
      data: {
        status: LessonStatus.ARCHIVED
      },
      select: lessonSelect
    });
  }

  private async ensureActiveModuleExists(
    context: OrganizationContext,
    moduleId: string
  ) {
    const module = await this.prisma.courseModule.findFirst({
      where: {
        id: moduleId,
        status: {
          not: CourseModuleStatus.ARCHIVED
        },
        course: {
          organizationId: context.organizationId
        }
      },
      select: {
        id: true
      }
    });

    if (!module) {
      throw new NotFoundException("Module not found");
    }

    return module;
  }

  private async ensureLessonExists(
    context: OrganizationContext,
    lessonId: string
  ) {
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id: lessonId,
        module: {
          course: {
            organizationId: context.organizationId
          }
        }
      },
      select: lessonSelect
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }

    return lesson;
  }

  private async getNextLessonPosition(moduleId: string) {
    const aggregate = await this.prisma.lesson.aggregate({
      where: {
        moduleId
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
