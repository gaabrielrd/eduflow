import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateCourseModuleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;
}
