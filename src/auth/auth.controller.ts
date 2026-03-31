import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody } from '@nestjs/swagger';
import { LoginRequest } from './authentication/login.request';
import { LoginResponse } from './authentication/login.response';
import { RefreshTokenRequest } from './authentication/refresh-token.request';
import { RegisterRequest } from './authentication/register.request';
import { RegisterResponse } from './authentication/register.response';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiBody({ type: LoginRequest }) // Đảm bảo Swagger biết kiểu dữ liệu của body
  // @UseGuards(JwtAuthGuard)
  @Post("login")
  async login(@Body() loginRequest: LoginRequest): Promise<LoginResponse> {
    console.log("Login request received:", loginRequest);
    const loginResponse = await this.authService.login(loginRequest);
    console.log("Login response:", loginResponse);
    return loginResponse;
  }

  @Post("refresh")
  async refresh(@Body() request: RefreshTokenRequest): Promise<LoginResponse> {
    return this.authService.refreshTokens(request.refreshToken);
  }

  @Post("register")
  async register(
    @Body() registerRequest: RegisterRequest,
  ): Promise<RegisterResponse> {
    return this.authService.register(registerRequest);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async profile(@Req() req: { user: { userId: number } }) {
    return this.authService.getProfile(req.user.userId);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: { user: { userId: number } }) {
    await this.authService.logout(req.user.userId);
    return { success: true };
  }
}
