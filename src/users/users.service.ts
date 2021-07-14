import { Injectable } from '@nestjs/common';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  private readonly users: UserDto[] = [
    {
      username: 'john',
      password: 'changeme',
    },
    {
      username: 'maria',
      password: 'guess',
    },
  ];

  findUser(username: string): Promise<UserDto | undefined> {
    return Promise.resolve(
      this.users.find((user) => user.username === username),
    );
  }
}
