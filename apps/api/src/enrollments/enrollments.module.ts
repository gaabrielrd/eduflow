import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { DatabaseModule } from "../database/database.module.js";
import { CourseEnrollmentsController } from "./course-enrollments.controller.js";
import { EnrollmentsService } from "./enrollments.service.js";
import { LearningSnapshotService } from "./learning-snapshot.service.js";
import { LearningEnrollmentsController } from "./learning-enrollments.controller.js";

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [CourseEnrollmentsController, LearningEnrollmentsController],
  providers: [EnrollmentsService, LearningSnapshotService]
})
export class EnrollmentsModule {}
