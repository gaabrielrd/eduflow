import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { DatabaseModule } from "../database/database.module.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { JwtAuthGuard } from "./guards/jwt-auth.guard.js";
import { OrganizationContextGuard } from "./guards/organization-context.guard.js";
import { RolesGuard } from "./guards/roles.guard.js";

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, OrganizationContextGuard, RolesGuard],
  exports: [JwtAuthGuard, OrganizationContextGuard, RolesGuard]
})
export class AuthModule {}
