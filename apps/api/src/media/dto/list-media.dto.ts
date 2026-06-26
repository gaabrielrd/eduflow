import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

const MEDIA_MIME_GROUPS = ["image", "document"] as const;

export type MediaMimeGroup = (typeof MEDIA_MIME_GROUPS)[number];

export class ListMediaDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @IsOptional()
  @IsIn(MEDIA_MIME_GROUPS)
  mimeGroup?: MediaMimeGroup;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}
