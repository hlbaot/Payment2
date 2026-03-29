import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    console.log("=== JWT AUTH GUARD ===");
    console.log("Authorization header:", request.headers.authorization);
    console.log("======================");

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    console.log("=== JWT HANDLE REQUEST ===");
    console.log("Error:", err);
    console.log("User:", user);
    console.log("Info:", info);
    console.log("==========================");

    if (err || !user) {
      throw err || new UnauthorizedException("Invalid token");
    }
    return user;
  }
}
