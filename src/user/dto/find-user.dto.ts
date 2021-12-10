export class FindUserDto {
  limit?: number;
  offset?: number;
  updatedSince?: string;
  id?: string[];
  name?: string;
  credentials: boolean;
  email: string;
}
