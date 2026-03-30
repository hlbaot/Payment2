export class UpdateUserDto {
  fullName?: string;
  email?: string;
  password?: string;
  phoneNumber?: string | null;
  country?: string | null;
  isActive?: boolean;
  roleIds?: number[];
}
