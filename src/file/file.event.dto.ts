import { EventDto } from 'src/common/event.dto';
import { FILE_TYPE } from './consts';

export class FileDeleteEventDto extends EventDto<{
  type: FILE_TYPE;
  url: string;
}> {}
