import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Validate
} from "class-validator";

import { AtLeastOneOfValidator } from "../validators/at-least-one-of.validator.js";

export class UpdateCurrentOrganizationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/[a-z0-9]/, {
    message: "slug must contain at least one letter or number"
  })
  slug?: string;

  @Validate(AtLeastOneOfValidator, [["name", "slug"]])
  private readonly atLeastOneField!: string;
}
