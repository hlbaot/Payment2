import * as bcrypt from "bcrypt";
import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Role } from 'src/role/entities/role.entity';
import { LoginRequest } from './authentication/login.request';
import { LoginResponse } from './authentication/login.response';
import { RegisterRequest } from "./authentication/register.request";
import { RegisterResponse } from "./authentication/register.response";

@Injectable()
export class AuthService {
  constructor(
    private readonly JwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new UnauthorizedException('Invalid password');
    }

    return user;
  }

  // ===================== LOGIN =====================
  async login(loginRequest: LoginRequest): Promise<LoginResponse> {
    const user = await this.validateUser(
      loginRequest.email,
      loginRequest.password,
    );

    const tokens = await this.getTokens(
      user.id,
      user.email,
      user.roleSet.map((r) => r.name),
    );
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      userId: user.id,
      email: user.email,
      roleList: user.roleSet.map((r) => r.name),
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
  // ===================== REGISTER =====================
  async register(registerRequest: RegisterRequest): Promise<RegisterResponse> {
    const exist = await this.userRepository.findOne({
      where: { email: registerRequest.email },
    });
    if (exist) {
      throw new BadRequestException("Email is already in use");
    }

    const hashedPassword = await bcrypt.hash(registerRequest.password, 10);
    const userRole = await this.roleRepository.findOne({
      where: { name: "USER" },
    }); // Ví dụ tìm role từ database

    if (!userRole) {
      throw new Error("Role not found");
    }

    const user = this.userRepository.create({
      email: registerRequest.email, // Đảm bảo rằng registerRequest.email là một chuỗi hợp lệ
      password: hashedPassword, // Đảm bảo rằng hashedPassword đã được băm đúng cách
      roleSet: [userRole], // Gán roleSet là một mảng với role hợp lệ
    });

    await this.userRepository.save(user);
    return {
      email: registerRequest.email,
      password: registerRequest.password,
    };
  }
  // ===================== LOGOUT =====================
  async logout(userId: number) {
    return this.userRepository.update(userId, { refreshToken: null });
  }

  // ===================== REFRESH TOKEN =====================
  async refreshTokens(refreshToken: string): Promise<LoginResponse> {
    try {
      const payload = await this.JwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || "REFRESH_SECRET_KEY",
      });
      const userId = payload.sub;

      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user || !user.refreshToken)
        throw new ForbiddenException("Access Denied");

      const refreshTokenMatches = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );
      if (!refreshTokenMatches) throw new ForbiddenException("Access Denied");

      const tokens = await this.getTokens(
        user.id,
        user.email,
        user.roleSet.map((r) => r.name),
      );
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return {
        userId: user.id,
        email: user.email,
        roleList: user.roleSet.map((r) => r.name),
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (e) {
      throw new ForbiddenException("Access Denied");
    }
  }

  async updateRefreshToken(userId: number, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  async getTokens(userId: number, email: string, roles: string[]) {
    const payload = {
      sub: userId,
      email: email,
      roles: roles,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.JwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: "15m",
      }),
      this.JwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || "REFRESH_SECRET_KEY",
        expiresIn: "7d", // Refresh token lives longer
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
