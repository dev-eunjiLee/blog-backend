import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { CustomGraphQLError } from 'src/common/error';
import { UserRepository } from './user.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserInputDto } from './dtos/create-user.dto';
import { CustomLogger } from 'src/logger/logger';
import { IOLogger } from 'src/logger/log.decorator';

@Injectable()
@IOLogger()
export class UserService {
  constructor(
    @InjectRepository(UserRepository)
    private readonly userRepository: UserRepository,
    private readonly logger: CustomLogger,
  ) {}

  async createUser(input: CreateUserInputDto): Promise<User> {
    try {
      const user = await this.userRepository.createUser(input);
      return user;
    } catch (e) {
      // user 테이블에서 email을 고유키로 설정해둠
      if (e.code === 'ER_DUP_ENTRY') {
        throw new CustomGraphQLError(
          '유저의 이메일이 중복되어 확인이 필요합니다.',
          {
            extensions: { code: 'ERR_DUPLICATION_EMAIL' },
          },
        );
      }
      // 잡지못한 에러는 아래와 같은 형태로 날리기
      throw new CustomGraphQLError(e, {
        extensions: { code: 'ERR_UNEXPECTED' },
      });
    }
  }

  /**
   * @description 옵션에 맞게 유저 조회
   * @param option: userId
   * @returns: User
   */
  async readUserByOption(option: {
    userId?: number;
    email?: string;
  }): Promise<User> {
    const keyListLength = Object.keys(option).length;

    if (keyListLength === 0) {
      throw new CustomGraphQLError(
        '유저 조회를 위한 옵션이 설정되지 않았습니다.',
        {
          extensions: { code: 'NO_OPTION' },
        },
      );
    }

    const userList = await this.userRepository.readUserList({
      where: {
        ...(option.userId && { id: option.userId }),
        ...(option.email && { email: option.email }),
      },
    });

    if (!userList || userList.length === 0) {
      throw new CustomGraphQLError('유저가 조회되지 않습니다.', {
        extensions: { code: 'NO_USER' },
      });
    } else if (userList.length > 1) {
      throw new CustomGraphQLError('조건에 맞는 유저가 여러명입니다.', {
        extensions: { code: 'MULTIPLE_USER' },
      });
    } else {
      return userList[0];
    }
  }
}
