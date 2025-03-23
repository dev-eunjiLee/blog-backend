import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogRepository } from './blog.repository';
import { BlogResolver } from './blog.resolver';

@Module({
  providers: [BlogResolver, BlogService, BlogRepository],
})
export class BlogModule {}
