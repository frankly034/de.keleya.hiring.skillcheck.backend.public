import { IsBoolean, IsNotEmpty, IsOptional } from "class-validator";

export class UpdateUserDto {
  @IsNotEmpty()
  id: string;
  
  @IsBoolean()
  @IsOptional()
  email_confirmed?: boolean;

  name?: string;

  hash?: string;
}
