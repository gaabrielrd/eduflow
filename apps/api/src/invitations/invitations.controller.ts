import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.interface.js";
import { InvitationsService } from "./invitations.service.js";

@Controller("invitations")
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get(":token")
  getByToken(@Param("token") token: string) {
    return this.invitationsService.getInvitationByToken(token);
  }

  @Post(":token/accept")
  @UseGuards(JwtAuthGuard)
  accept(
    @Param("token") token: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.invitationsService.acceptInvitation(token, user);
  }
}
