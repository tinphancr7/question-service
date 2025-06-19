import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Post, IPostRepository } from '@/core/business/domain';
import { BaseUseCase, ProtoOf } from '@/core/types';

export class CreatePostInput {
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @IsString()
  @IsNotEmpty()
  readonly content: string;

  @IsUUID('4')
  readonly authorId: string;

  constructor(data: ProtoOf<CreatePostInput>) {
    Object.assign(this, data);
  }
}

export class CreatePostUseCase extends BaseUseCase<CreatePostInput, Post> {
  constructor(private readonly postRepository: IPostRepository) {
    super();
  }

  protected async execute(input: CreatePostInput): Promise<Post> {
    const { title, content, authorId } = input;

    const post = new Post({
      title,
      content,
      authorId,
    });

    const createdPost = await this.postRepository.create(post);
    return createdPost;
  }
} 