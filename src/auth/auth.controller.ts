import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { ApiBody } from '@nestjs/swagger';
import { LoginRequest } from './authentication/login.request';
import { LoginResponse } from './authentication/login.response';
import { RefreshTokenRequest } from './authentication/refresh-token.request';
import { RegisterRequest } from './authentication/register.request';
import { RegisterResponse } from './authentication/register.response';

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
}
