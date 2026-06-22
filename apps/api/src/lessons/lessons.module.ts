import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { AtLeastOneOfValidator } from "../common/validators/at-least-one-of.validator.js";
import { CourseModulesModule } from "../course-modules/course-modules.module.js";
import { DatabaseModule } from "../database/database.module.js";
import { LessonsController } from "./lessons.controller.js";
import { LessonsService } from "./lessons.service.js";

@Module({
  imports: [AuthModule, CourseModulesModule, DatabaseModule],
  controllers: [LessonsController],
  providers: [LessonsService, AtLeastOneOfValidator]
})
export class LessonsModule {}
