import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { DatabaseModule } from "../database/database.module.js";
import { InvitationsController } from "./invitations.controller.js";
import { InvitationsService } from "./invitations.service.js";

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [InvitationsController],
  providers: [InvitationsService]
})
export class InvitationsModule {}
