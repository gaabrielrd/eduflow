import "reflect-metadata";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AuthModule } from "./auth/auth.module.js";
import { validateEnv } from "./config/env.schema.js";
import { CoursesModule } from "./courses/courses.module.js";
import { DatabaseModule } from "./database/database.module.js";
import { HealthModule } from "./health/health.module.js";
import { InvitationsModule } from "./invitations/invitations.module.js";
import { OrganizationsModule } from "./organizations/organizations.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv
    }),
    AuthModule,
    DatabaseModule,
    CoursesModule,
    HealthModule,
    InvitationsModule,
    OrganizationsModule
  ]
})
export class AppModule {}
