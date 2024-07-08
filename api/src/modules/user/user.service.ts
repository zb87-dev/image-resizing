import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from './repository/user.repository';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: Logger,
  ) {}

  public async getUserById(userId: string): Promise<User> {
    let user = await this.userRepository.getUserById(userId);
    if (!user) {
      this.logger.debug(`User with id ${userId} not found, creating new user`);
      user = await this.createUser(userId);
    }

    return user;
  }

  public async createUser(userId: string): Promise<User> {
    return this.userRepository.createUser({ id: userId });
  }
}
