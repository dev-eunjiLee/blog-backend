import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import {
  FILE_LIMIT_SIZE_OBJ_TOKEN,
  FILE_TYPE_LIST,
  FILE_TYPE_LIST_TOKEN,
  FILE_VALID_FILE_EXTENSION_OBJ_TOKEN,
} from './consts';
import { HttpModule } from '@nestjs/axios';
import { FileEventListener } from './file.event-listener';

// 파일을 업로드하는 경우

@Module({
  providers: [
    FileService,
    {
      // 파일을 업로드하는 경우
      provide: FILE_TYPE_LIST_TOKEN,
      useValue: FILE_TYPE_LIST,
    },
    {
      // 업로드 타입별 용량 제한
      provide: FILE_LIMIT_SIZE_OBJ_TOKEN,
      useValue: {
        'post-image': 8 * 1024 * 1024, // 8MB
        'profile-image': 3 * 1024 * 1024, // 3  MB
      },
    },
    {
      // 허용하는 파일 확장자 제한
      provide: FILE_VALID_FILE_EXTENSION_OBJ_TOKEN,
      useValue: {
        'post-image': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
        'profile-image': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
      },
    },
    FileEventListener,
  ],
  controllers: [FileController],
  imports: [HttpModule],
})
export class FileModule {}
