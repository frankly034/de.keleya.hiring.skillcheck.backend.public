import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { FindUserDto } from 'src/user/dto/find-user.dto';

interface IUserQueryStringPipe {
  limit: number;
  offset: number;
  updatedSince?: string;
  id?: string[];
  name?: string;
  credentials?: boolean;
  email?: string;
}

@Injectable()
export class UserQueryStringPipe implements PipeTransform<FindUserDto, IUserQueryStringPipe> {
  transform(findUserDto: FindUserDto, metadata: ArgumentMetadata) {
    const { limit, offset, updatedSince, id, name, credentials, email } = findUserDto;
    return {
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
      email: email || '',
      name: name || '',
      id: typeof id === 'string' ? [id] : id,
      updatedSince: updatedSince,
      credentials: Boolean(credentials)
    };
  }
}
