import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/[a-z0-9]/, {
    message: "slug must contain at least one letter or number"
  })
  slug!: string;
}
