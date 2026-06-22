import {
  IsBoolean,
  IsDefined,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength
} from "class-validator";

import { LessonContentType } from "../../generated/prisma/enums.js";

export class CreateLessonDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsEnum(LessonContentType)
  contentType!: LessonContentType;

  @IsDefined()
  @IsObject()
  contentJson!: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedDurationMinutes?: number;

  @IsOptional()
  @IsBoolean()
  isPreview?: boolean;
}
