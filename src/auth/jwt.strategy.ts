import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const jwtSecret = configService.get<string>("JWT_SECRET");
    const jwtAlgorithm = configService.get<string>("JWT_ALGORITHM");
    const jwtIssuer = configService.get<string>("JWT_ISSUER");

    console.log("=== JWT STRATEGY CONFIG ===");
    console.log("JWT_SECRET:", jwtSecret ? "✓ Set" : "✗ Missing");
    console.log("JWT_ALGORITHM:", jwtAlgorithm);
    console.log("JWT_ISSUER:", jwtIssuer);
    console.log("===========================");

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
      algorithms: [jwtAlgorithm],
      issuer: jwtIssuer,
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    console.log("=== JWT VALIDATE CALLED ===");
    console.log("Payload:", payload);
    console.log("===========================");

    // Payload chứa thông tin từ JWT token
    // payload.sub = email, payload.roles = array of role names
    const user = {
      userId: payload.sub, // sub contains email
      email: payload.email,
      roles: payload.roles, // roles is an array
    };

    console.log("=== RETURNING USER ===");
    console.log("User:", user);
    console.log("======================");

    return user;
  }
}
