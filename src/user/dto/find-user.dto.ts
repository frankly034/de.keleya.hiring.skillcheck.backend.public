import { IsBooleanString, IsDateString, IsNumberString, IsOptional } from "class-validator";

export class FindUserDto {
  @IsOptional()
  @IsNumberString()
  limit: number;

  @IsOptional()
  @IsNumberString()
  offset: number;

  @IsOptional()
  @IsDateString()
  updatedSince: string;

  @IsOptional()
  id: number[];

  @IsOptional()
  name: string;

  @IsOptional()
  @IsBooleanString()
  credentials: boolean;

  @IsOptional()
  email: string;
}
