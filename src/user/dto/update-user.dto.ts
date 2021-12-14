import { IsBoolean, IsNotEmpty, IsOptional } from "class-validator";

export class UpdateUserDto {
  @IsNotEmpty()
  id: number ;
  
  @IsBoolean()
  @IsOptional()
  emailConfirmed?: boolean;

  name?: string;

  hash?: string;
}
