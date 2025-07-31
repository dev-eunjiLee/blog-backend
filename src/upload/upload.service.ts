import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { LoggerStorage } from 'src/logger/logger-storage';
import {
  UPLOAD_LIMIT_SIZE_OBJ_TOKEN,
  UPLOAD_TYPE,
  UPLOAD_TYPE_LIST_TOKEN,
  UPLOAD_VALID_FILE_EXTENSION_OBJ_TOKEN,
} from './consts';
import { HttpService } from '@nestjs/axios';
import FormData from 'form-data';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  constructor(
    // 로거
    private readonly als: LoggerStorage,
    // http 통신용
    private readonly httpService: HttpService,
    // 환경변수
    private readonly configService: ConfigService,
    /**
     * Module에서 주입: 업로드하는 케이스와 제약조건
     *
     * UPLOAD_TYPE_LIST: 업로드가 필요한 경우
     * UPLOAD_LIMIT_SIZE_OBJ: 각 경우별 파일 사이즈 크기
     * UPLOAD_VALID_FILE_EXTENSION_OBJ: 각 경우별 허용되는 확장자
     */
    @Inject(UPLOAD_TYPE_LIST_TOKEN)
    private readonly UPLOAD_TYPE_LIST: Array<UPLOAD_TYPE>,
    @Inject(UPLOAD_LIMIT_SIZE_OBJ_TOKEN)
    private readonly UPLOAD_LIMIT_SIZE_OBJ: Record<UPLOAD_TYPE, number>,
    @Inject(UPLOAD_VALID_FILE_EXTENSION_OBJ_TOKEN)
    private readonly UPLOAD_VALID_FILE_EXTENSION_OBJ: Record<
      UPLOAD_TYPE,
      Array<string>
    >,
  ) {}

  /**
   *
   * @description 범용 파일 업로드 함수
   * TODO 실제 파일 업로드 로직은 추가 구현 필요함
   */
  async uploadFile(
    file: Express.Multer.File,
    type: UPLOAD_TYPE,
  ): Promise<string> {
    // 에러 케이스
    const ERR_OVER_FILE_SIZE = 'ERR_OVER_FILE_SIZE'; // 허용 가능한 파일 사이즈를 오버한 경우
    const ERR_NOT_VALID_TYPE = 'ERR_NOT_VALID_TYPE'; // 업로드 할 수 있는 타입이 아닌 경우
    const ERR_NOT_VALID_EXTENSION = 'ERR_NOT_VALID_EXTENSION'; // 업로드 할 수 있는 타입이 아닌 경우
    const ERR_FAILED_UPLOAD = 'ERR_FAILED_UPLOAD'; // 업로드하다가 에러가 발생한 경우

    // 로거가져오기
    const logger = this.als.getStore()?.customLogger!;

    // file에서 buffer만 뺀 rest 객체 만들기(로그에서 buffer 제외시키기 위해)
    const { buffer, ...rest } = file;

    // 파일 로거 찍기(로그가 제대로 찍히지 않더라도)
    logger.customLog({
      input: {
        file: {
          ...rest,
        },
        type,
      },
    });

    const requestId = this.als.getStore()!.customLogger.getRequestId();

    if (!this.UPLOAD_TYPE_LIST.includes(type)) {
      // 예외처리 0. 파일 업로드 경우 확인
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: '잘못된 파일 타입입니다.',
          error: `Bad Request - ${ERR_NOT_VALID_TYPE} - [${requestId}]`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (file.size > this.UPLOAD_LIMIT_SIZE_OBJ[type]) {
      // 예외처리 1. 파일 사이즈 제한을 넘어가는 경우
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: '파일 사이즈를 확인해주세요.',
          error: `Bad Request - ${ERR_OVER_FILE_SIZE} - [${requestId}]`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!this.UPLOAD_VALID_FILE_EXTENSION_OBJ[type].includes(file.mimetype)) {
      // 예외처리 2. 업로드하는 파일의 확장자가 바르지않은경우
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `파일 확장자를 확인해주세요(허용하는 확장자: ${this.UPLOAD_VALID_FILE_EXTENSION_OBJ[type].map((elem) => `'${elem}'`)} )`,
          error: `Bad Request - ${ERR_NOT_VALID_EXTENSION} - [${requestId}]`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const form = new FormData();

    form.append('file', file.buffer, file.originalname);

    let url: string;

    try {
      // TODO 헥시고날 아키텍처로 변경하기
      const res = await this.httpService.axiosRef.post(
        `https://api.cloudflare.com/client/v4/accounts/${this.configService.get('CLOUDFLARE_ACCOUNT_ID')}/images/v1`,
        form,
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('CLOUDFLARE_API_TOKEN')}`,
            ...form.getHeaders(),
          },
        },
      );

      logger.customLog({
        'res.data': res.data,
      });

      const urlList: Array<string> = res.data.result.variants;

      url = urlList.filter((elem) => elem.includes('public'))[0];

      logger.customLog({
        url,
      });
    } catch (error) {
      logger.customError(error, {
        className: this.constructor.name,
        methodName: this.uploadFile.name,
      });

      // CLOUDFLARE를 이용해 파일을 업로드하다가 에러가 발생한 경우
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `파일을 업로드하는 중 오류가 발생했습니다. ${error.code}`,
          error: `INTERNAL_SERVER_ERROR - ${ERR_FAILED_UPLOAD} - [${requestId}]`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return url;
  }

  /**
   *
   * @description 이미지 삭제 실제 로직
   * @param type
   * @param url
   * @returns
   */
  async deleteFile(type: UPLOAD_TYPE, url: string): Promise<boolean> {
    return true;
  }
}
