import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  Validate
} from "class-validator";

import { AtLeastOneOfValidator } from "../../common/validators/at-least-one-of.validator.js";
import { LessonContentType } from "../../generated/prisma/enums.js";

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsEnum(LessonContentType)
  contentType?: LessonContentType;

  @IsOptional()
  @IsObject()
  contentJson?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedDurationMinutes?: number;

  @IsOptional()
  @IsBoolean()
  isPreview?: boolean;

  @Validate(AtLeastOneOfValidator, [[
    "title",
    "description",
    "contentType",
    "contentJson",
    "estimatedDurationMinutes",
    "isPreview"
  ]])
  private readonly atLeastOneField!: string;
}
