import { Post, PostUpdateProps } from '../models/post.model';

export interface IPostRepository {
  create(post: Post): Promise<Post>;
  findOne(id: string): Promise<Post | null>;
  findByAuthor(authorId: string): Promise<Post[]>;
  update(id: string, props: Partial<PostUpdateProps>): Promise<Post>;
  delete(id: string): Promise<void>;
} 