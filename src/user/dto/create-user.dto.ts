export class CreateUserDto {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  country?: string;
  isActive?: boolean;
  roleIds?: number[];
}
