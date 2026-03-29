export class LoginResponse {
  userId: number;
  email: string;
  roleList: string[];
  token: string;
  refreshToken: string;
}
