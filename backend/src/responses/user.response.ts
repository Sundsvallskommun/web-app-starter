import ApiResponse from '@/interfaces/api-service.interface';
import { ClientUser } from '@/interfaces/users.interface';
import { PickType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

// export class Permissions implements IPermissions {
//   @IsBoolean()
//   canEditSystemMessages: boolean;
// }

export class UserContract {
  @IsString()
  name!: string;

  @IsString()
  username!: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  role?: string;

  // @IsEnum(InternalRoleEnum)
  // role: InternalRole;
  // @ValidateNested()
  // @Type(() => Permissions)
  // permissions: Permissions;
}

export class User extends PickType(UserContract, ['name', 'username'] as const) implements ClientUser {}

export class UserApiResponse implements ApiResponse<User> {
  @ValidateNested()
  @Type(() => User)
  data!: User;
  @IsString()
  message!: string;
}
