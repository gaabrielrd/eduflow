import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength
} from "class-validator";

export class CreateCourseDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/[a-z0-9]/, {
    message: "slug must contain at least one letter or number"
  })
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;
}
