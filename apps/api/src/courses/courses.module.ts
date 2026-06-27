import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { AtLeastOneOfValidator } from "../common/validators/at-least-one-of.validator.js";
import { DatabaseModule } from "../database/database.module.js";
import { StorageModule } from "../storage/storage.module.js";
import { CoursePublishValidationService } from "./course-publish-validation.service.js";
import { CourseVersionSnapshotService } from "./course-version-snapshot.service.js";
import { CoursesController } from "./courses.controller.js";
import { CoursesService } from "./courses.service.js";

@Module({
  imports: [AuthModule, DatabaseModule, StorageModule],
  controllers: [CoursesController],
  providers: [
    CoursesService,
    CoursePublishValidationService,
    CourseVersionSnapshotService,
    AtLeastOneOfValidator
  ]
})
export class CoursesModule {}
