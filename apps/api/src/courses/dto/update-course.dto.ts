import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Validate
} from "class-validator";

import { AtLeastOneOfValidator } from "../../common/validators/at-least-one-of.validator.js";

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/[a-z0-9]/, {
    message: "slug must contain at least one letter or number"
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @Validate(AtLeastOneOfValidator, [["title", "slug", "description"]])
  private readonly atLeastOneField!: string;
}
