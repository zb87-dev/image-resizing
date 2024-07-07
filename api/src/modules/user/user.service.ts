import { Injectable } from '@nestjs/common';
import { UserRepository } from './repository/user.repository';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  public async getUserById(userId: string): Promise<User> {
    return this.userRepository.getUserById(userId);
  }

  public async createUser(userId: string): Promise<User> {
    return this.userRepository.createUser({ id: userId });
  }
}
