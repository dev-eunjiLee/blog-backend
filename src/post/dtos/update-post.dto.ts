import {
  InputType,
  IntersectionType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { PostFileInputDto, PostInputType } from '../post.entity';

@InputType()
export class UpdatePostInputDto extends IntersectionType(
  PostFileInputDto,
  IntersectionType(
    PickType(PostInputType, ['id']),
    PartialType(PickType(PostInputType, ['title', 'content', 'hashtagList'])),
  ),
) {}
