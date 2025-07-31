import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileService } from './file.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UPLOAD_TYPE } from './consts';

// TODO swagger 적용
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  /**
   * @description 파일 업로드. form-data의 key를 'file'로 설정해야한다.
   */
  @Post(':type')
  @UseInterceptors(
    // API의 request의 body의 form-data에 선언되어야 할 필드명
    FileInterceptor('file'),
  )
  async uploadFile(
    @Param('type') type: UPLOAD_TYPE,
    @UploadedFile()
    file: Express.Multer.File,
  ): Promise<string> {
    return await this.fileService.upload(file, type);
  }

  /**
   * 이미지 삭제 엔드 포인트
   */
  @Delete(':type')
  async deleteFile(
    @Param('type') type: UPLOAD_TYPE,
    @Body('url') url: string,
  ): Promise<boolean> {
    return await this.fileService.delete(type, url);
  }
}
