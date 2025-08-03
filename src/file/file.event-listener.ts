import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { CustomLogger } from 'src/logger/logger';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { FileDeleteEventDto } from './file.event.dto';

export const EVENT_FILE_DELETE = 'EVENT_FILE_DELETE';

/**
 * * README
 * Event로 받은 경우 비동기/동기 방식으로 구현한 Wrapper가 정상 동작을 하지 않아, 각 함수 내에서 로그 호출 후 구현필요
 */
@Injectable()
export class FileEventListener {
  // ===== 최대 재시도 횟수 ===== //
  private readonly MAX_RETRY_COUNT = 10;

  constructor(
    // 환경변수
    private readonly configService: ConfigService,
    // http 통신용
    private readonly httpService: HttpService,
    // 이벤트 발행
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * @description 파일 삭제
   */
  @OnEvent(EVENT_FILE_DELETE)
  private async deleteFile(input: FileDeleteEventDto) {
    // ===== 로거 셋팅 ===== //
    const logger = new CustomLogger(
      `(event - ${EVENT_FILE_DELETE}) ${input.requestId} ${input.retryCount}`,
    );
    // const prefix = `${this.constructor.name} - ${this.deleteFile.name}`;

    // ===== input 로그 ===== //
    logger.customLog(
      { input },
      {
        className: this.constructor.name,
        methodName: this.deleteFile.name,
      },
    );

    try {
      // ===== 이미지 삭제 ===== //
      const res = await this.httpService.axiosRef.delete(
        `${input.payload.url}`,
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('CLOUDFLARE_API_TOKEN')}`,
          },
        },
      );

      logger.customLog(
        { status: res.status },
        {
          className: this.constructor.name,
          methodName: this.deleteFile.name,
        },
      );
    } catch (error) {
      // MAX_RETRY_COUNT만큼 재시도
      if (input.retryCount < this.MAX_RETRY_COUNT) {
        this.eventEmitter.emit(
          EVENT_FILE_DELETE,
          new FileDeleteEventDto(
            input.requestId,
            input.payload,
            input.retryCount + 1,
          ),
        );
      } else {
        // ===== 최대 횟수를 초과한 경우 메세지만 추가하기 ===== //
        error.message = `${error.message} [🚀 파일 삭제 최대 횟수를 초과했습니다.]`;
      }

      // ===== 에러 로그 ===== //
      logger.customError(error, {
        className: this.constructor.name,
        methodName: this.deleteFile.name,
      });
    } finally {
      logger.destroy();
    }
  }
}
