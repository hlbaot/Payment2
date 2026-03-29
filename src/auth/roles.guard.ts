import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      "roles",
      context.getHandler()
    );

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Debug logging
    console.log("=== ROLES GUARD DEBUG ===");
    console.log("Required roles:", requiredRoles);
    console.log("User object:", user);
    console.log("User roles:", user?.roles);
    console.log("========================");

    // Check if user exists
    if (!user) {
      console.log("❌ No user found in request");
      return false;
    }

    // Handle both 'role' (singular) and 'roles' (plural)
    const userRoles = user.roles || (user.role ? [user.role] : []);
    console.log("Final user roles:", userRoles);

    const hasPermission = requiredRoles.some((role) =>
      userRoles.includes(role)
    );

    console.log("Has permission:", hasPermission);
    return hasPermission;
  }
}
