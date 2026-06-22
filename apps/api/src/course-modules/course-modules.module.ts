import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { AtLeastOneOfValidator } from "../common/validators/at-least-one-of.validator.js";
import { DatabaseModule } from "../database/database.module.js";
import { CourseModulesController } from "./course-modules.controller.js";
import { CourseModulesService } from "./course-modules.service.js";

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [CourseModulesController],
  providers: [CourseModulesService, AtLeastOneOfValidator],
  exports: [CourseModulesService]
})
export class CourseModulesModule {}
