import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Blog } from 'src/blog/blog.entity';
import { CommonEntity } from 'src/common/common.entity';
import { Post } from 'src/post/post.entity';
import { Column, Entity, OneToMany, OneToOne, Relation, Unique } from 'typeorm';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
abstract class IUser extends CommonEntity {
  @Field(() => String, { description: '유저의 이름' })
  @Column({ type: 'varchar', length: 256, comment: '유저의 이름' })
  name: string;

  @Field(() => String, { description: '유저의 이메일' })
  @Column({
    type: 'varchar',
    length: 256,
    comment: '유저의 이메일',
  })
  email: string;

  @OneToMany(() => Post, (post) => post.writer, { nullable: true })
  @Field(() => [Post], { nullable: true })
  postList?: Array<Post>;

  @OneToOne(() => Blog, (blog) => blog.owner, { nullable: true })
  @Field(() => Blog, { nullable: true })
  blog?: Relation<Blog>;
}

@ObjectType()
@Entity('user')
@Unique('unique_email_for_user', ['email']) // email을 unique키로 설정했고 중복인 경우 create에서 에러 메세지를 따로 처리하고 있다
export class User extends IUser {}

@InputType()
export class UserInputType extends IUser {}
