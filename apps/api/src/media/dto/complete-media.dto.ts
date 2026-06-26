import { IsString, MinLength } from "class-validator";

export class CompleteMediaDto {
  @IsString()
  @MinLength(1)
  mediaId!: string;
}
