import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { Post } from './post.entity';
import { input } from 'src/common/consts';
import { PostService } from './post.service';
import { ReadPostInputDto } from './dtos/read-post.dto';
import { User } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { ReadPostListInputDto } from './dtos/read-post-list.dto';
import { CreatePostInputDto } from './dtos/create-post.dto';
import { AccessRole, AuthUser } from 'src/auth/auth.decorator';
import { UpdatePostInputDto } from './dtos/update-post.dto';

@Resolver(() => Post)
export class PostResolver {
  constructor(
    private readonly postService: PostService,
    private readonly userService: UserService,
  ) {}

  @AccessRole('USER')
  @Mutation(() => Post, { description: '게시글 작성하기' })
  async createPost(
    @Args(input) input: CreatePostInputDto,
    @AuthUser() user: User,
  ): Promise<Post> {
    return await this.postService.createPost(user, input);
  }

  @Query(() => [Post], { description: '게시글 목록 조회하기' })
  async readPostList(
    @Args(input) input: ReadPostListInputDto,
  ): Promise<Array<Post>> {
    return await this.postService.readPostList(input);
  }

  @Query(() => Post, { description: '게시글 조회하기' })
  async readPost(@Args(input) input: ReadPostInputDto): Promise<Post> {
    return await this.postService.readPost(input);
  }

  @Mutation(() => Post, { description: '게시글 수정하기' })
  async updatePost(@Args('input') input: UpdatePostInputDto) {
    return await this.postService.updatePost(input);
  }

  @ResolveField('writer', () => User, {
    description: '게시글 작성자',
  })
  async readUser(@Parent() post: Post): Promise<User> {
    return await this.userService.readUserByOption({
      userId: post.writerId,
    });
  }
}
