import { IsString } from 'class-validator';

export class RepresentsDto {
  @IsString()
  public organizationNumber: string;
}
