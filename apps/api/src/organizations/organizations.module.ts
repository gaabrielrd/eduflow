import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { DatabaseModule } from "../database/database.module.js";
import { OrganizationsController } from "./organizations.controller.js";
import { OrganizationContextGuard } from "./guards/organization-context.guard.js";
import { OrganizationsService } from "./organizations.service.js";
import { AtLeastOneOfValidator } from "./validators/at-least-one-of.validator.js";

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [OrganizationsController],
  providers: [
    OrganizationsService,
    OrganizationContextGuard,
    AtLeastOneOfValidator
  ]
})
export class OrganizationsModule {}
