import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Algorithm } from 'jsonwebtoken';

@Module({
  imports: [
    ConfigModule, // Đảm bảo ConfigModule được import để cung cấp ConfigService
    JwtModule.registerAsync({
      imports: [ConfigModule], // Đảm bảo ConfigModule được import vào JwtConfigModule
      inject: [ConfigService], // Inject ConfigService vào module
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // Lấy secret từ biến môi trường
        signOptions: {
          algorithm: configService.get<string>('JWT_ALGORITHM') as Algorithm, // Lấy thuật toán từ biến môi trường
          expiresIn: '7d', // Thời gian hết hạn của JWT
          issuer: configService.get<string>('JWT_ISSUER'), // Lấy issuer từ biến môi trường
        },
      }),
    }),
  ],
  exports: [JwtModule],
})
export class JwtConfigModule {}
