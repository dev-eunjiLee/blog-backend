import { EventDto } from 'src/common/event.dto';

export class IncreaseViewCountEventDto extends EventDto<{
  postId: string;
}> {}
