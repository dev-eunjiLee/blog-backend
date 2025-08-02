import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FileService } from './file.service';
import { FILE_TYPE } from './consts';

export const EVENT_FILE_DELETE = 'EVENT_FILE_DELETE';

@Injectable()
export class FileEventListener {
  constructor(private readonly fileService: FileService) {}
  /**
   * @description 파일 삭제
   */
  @OnEvent(EVENT_FILE_DELETE)
  private async deleteFile(type: FILE_TYPE, url: string) {
    await this.fileService.delete(type, url);
  }
}
