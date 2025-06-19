import { Request, Response } from 'express';
import { CreatePostUseCase, CreatePostInput } from '@/core/business/usecases';
import { PostRepository } from '@/core/infrastructure/data/postgresql';
import { PostgresqlDataSource } from '@/core/infrastructure/data/postgresql';

// Initialize dependencies
const dataSource = new PostgresqlDataSource();
const postRepository = new PostRepository(dataSource);

export class PostHandler {
  static async createPost(req: Request, res: Response): Promise<void> {
    try {
      // Extract data from request body
      const { title, content, authorId } = req.body;

      // Validate required fields
      if (!title || !content || !authorId) {
        res.status(400).json({
          error: 'Missing required fields: title, content, authorId',
        });
        return;
      }

      // Create input for use case
      const input = new CreatePostInput({
        title,
        content,
        authorId,
      });

      // Execute use case
      const useCase = new CreatePostUseCase(postRepository);
      const createdPost = await useCase.handle(input);

      // Return success response
      res.status(201).json({
        success: true,
        data: createdPost.toJSON(),
      });
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getPost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Post ID is required',
        });
        return;
      }

      const post = await postRepository.findOne(id);

      if (!post) {
        res.status(404).json({
          error: 'Post not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: post.toJSON(),
      });
    } catch (error) {
      console.error('Error getting post:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getPostsByAuthor(req: Request, res: Response): Promise<void> {
    try {
      const { authorId } = req.params;

      if (!authorId) {
        res.status(400).json({
          error: 'Author ID is required',
        });
        return;
      }

      const posts = await postRepository.findByAuthor(authorId);

      res.status(200).json({
        success: true,
        data: posts.map(post => post.toJSON()),
      });
    } catch (error) {
      console.error('Error getting posts by author:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
} 