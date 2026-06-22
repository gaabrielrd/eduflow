import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { AtLeastOneOfValidator } from "../common/validators/at-least-one-of.validator.js";
import { DatabaseModule } from "../database/database.module.js";
import { CoursesController } from "./courses.controller.js";
import { CoursesService } from "./courses.service.js";

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [CoursesController],
  providers: [CoursesService, AtLeastOneOfValidator]
})
export class CoursesModule {}
