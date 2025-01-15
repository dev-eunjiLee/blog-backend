import { Injectable } from '@nestjs/common';
import { LoginInputDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { CustomGraphQLError } from 'src/common/error';
import { JWT_PRIVATE_CLAIMS } from './types';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async login(input: LoginInputDto): Promise<string> {
    // 에러의 앞에 달 prefix 선언
    const errPrefix = `${this.constructor.name} - ${this.login.name}`;

    // 이 함수에서 발생하는 에러 케이스 정리
    const ERR_DELETED_USER = 'ERR_DELETED_USER';

    try {
      // 유저 정보 가져오기
      const user = await this.userService.readUserByOption({
        email: input.email,
      });

      // 해당 유저가 로그인할 수 있는지 확인하기 - 탈퇴 유저는 사용 불가
      if (user.deletedAt) {
        throw new CustomGraphQLError('탈퇴한 계정입니다.', {
          extensions: { code: ERR_DELETED_USER },
        });
      }

      // 토큰 생성하기 - payload 생성
      const payload: JWT_PRIVATE_CLAIMS = {
        uid: user.id,
        email: user.email,
      };

      // 토큰 생성하기
      // TODO 나중에 필요할 경우 refreshToken 생성
      const accessToken = await this.jwtService.signAsync(payload);

      return accessToken;
    } catch (error) {
      if (error.extensions.customFlag === true) {
        error.addBriefStacktraceToCode(errPrefix);
      }
      throw error;
    }
  }
}
