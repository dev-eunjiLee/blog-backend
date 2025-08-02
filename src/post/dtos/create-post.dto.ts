import { Field, InputType, IntersectionType, PickType } from '@nestjs/graphql';
import { PostInputType } from '../post.entity';
import { IsAlpha, IsArray, IsOptional, IsString } from 'class-validator';

@InputType({ isAbstract: true })
export class PostFileInputDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Field(() => [String], {
    nullable: true,
    description: '삭제할 이미지 목록',
  })
  deletedUrlList?: string;
}

@InputType()
export class CreatePostInputDto extends IntersectionType(
  PickType(PostInputType, ['title', 'content', 'hashtagList']),
  PostFileInputDto,
) {}
