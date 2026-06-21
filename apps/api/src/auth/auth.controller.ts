import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";

import { CurrentUser } from "./decorators/current-user.decorator.js";
import { LoginDto } from "./dto/login.dto.js";
import { RefreshTokenDto } from "./dto/refresh-token.dto.js";
import { RegisterDto } from "./dto/register.dto.js";
import { AccessTokenGuard } from "./guards/access-token.guard.js";
import type { AuthenticatedUser } from "./types/authenticated-user.interface.js";
import { AuthService } from "./auth.service.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("refresh")
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post("logout")
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @UseGuards(AccessTokenGuard)
  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
