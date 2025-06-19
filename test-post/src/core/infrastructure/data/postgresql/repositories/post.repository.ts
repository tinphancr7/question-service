import { Post, PostUpdateProps, IPostRepository } from '@/core/business/domain';
import { PostMapper } from '../mappers/post.mapper';
import { PostgresqlDataSource } from '../datasources/postgresql.datasource';

export class PostRepository implements IPostRepository {
  constructor(private readonly dataSource: PostgresqlDataSource) {}

  async create(post: Post): Promise<Post> {
    const persistencePost = PostMapper.toPersistence(post);

    const createdPost = await this.dataSource.connection.post.create({
      data: persistencePost,
    });

    return PostMapper.toDomain(createdPost);
  }

  async findOne(id: string): Promise<Post | null> {
    const post = await this.dataSource.connection.post.findUnique({
      where: { id },
    });

    return post ? PostMapper.toDomain(post) : null;
  }

  async findByAuthor(authorId: string): Promise<Post[]> {
    const posts = await this.dataSource.connection.post.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
    });

    return posts.map(PostMapper.toDomain);
  }

  async update(id: string, props: Partial<PostUpdateProps>): Promise<Post> {
    const updatedPost = await this.dataSource.connection.post.update({
      where: { id },
      data: props,
    });

    return PostMapper.toDomain(updatedPost);
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.connection.post.delete({
      where: { id },
    });
  }
} 