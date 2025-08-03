import { InputType, IntersectionType, PickType } from '@nestjs/graphql';
import { PostFileInputDto, PostInputType } from '../post.entity';

@InputType()
export class CreatePostInputDto extends IntersectionType(
  PickType(PostInputType, ['title', 'content', 'hashtagList']),
  PostFileInputDto,
) {}
