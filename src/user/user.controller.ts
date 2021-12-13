import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  HttpCode,
  UseGuards,
  UsePipes,
  Headers,
  ParseIntPipe,
} from '@nestjs/common';
import { EndpointIsPublic } from '../../src/common/decorators/publicEndpoint.decorator';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { UserQueryStringPipe } from '../../src/common/pipes/user-query-string.pipe';
import { AuthenticateUserDto } from './dto/authenticate-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { FindUserDto } from './dto/find-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import RequestWithUser from '../../src/common/types/requestWithUser';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Get()
  @UsePipes(new UserQueryStringPipe())
  async find(@Query() findUserDto: FindUserDto, @Req() req: RequestWithUser) {
    const { user } = req;
    return this.usersService.find(findUserDto, user);
  }

  @Get(':id')
  async findUnique(@Param('id', ParseIntPipe) id, @Req() req: RequestWithUser) {
    const { user } = req;
    return this.usersService.findUnique({id}, true, user);
  }

  @Post()
  @EndpointIsPublic()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch()
  async update(@Body() updateUserDto: UpdateUserDto, @Req() req: RequestWithUser) {
    const { user } = req;
    return this.usersService.update(updateUserDto, user);
  }

  @Delete()
  async delete(@Body() deleteUserDto: DeleteUserDto, @Req() req: RequestWithUser) {
    const { user } = req;
    return this.usersService.delete(deleteUserDto, user);
  }

  @Post('validate')
  @EndpointIsPublic()
  @HttpCode(200)
  async userValidateToken(@Headers() headers) {
    return this.usersService.validateToken(headers.authorization);
  }

  @Post('authenticate')
  @EndpointIsPublic()
  @HttpCode(200)
  async userAuthenticate(@Body() authenticateUserDto: AuthenticateUserDto) {
    return this.usersService.authenticate(authenticateUserDto);
  }

  @Post('token')
  @EndpointIsPublic()
  @HttpCode(200)
  async userGetToken(@Body() authenticateUserDto: AuthenticateUserDto) {
    return this.usersService.authenticateAndGetJwtToken(authenticateUserDto);
  }
}
