import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Validate
} from "class-validator";

import { AtLeastOneOfValidator } from "../../common/validators/at-least-one-of.validator.js";

export class UpdateCourseModuleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @Validate(AtLeastOneOfValidator, [["title", "description"]])
  private readonly atLeastOneField!: string;
}
