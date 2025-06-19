import { CreatePostUseCase, CreatePostInput } from '../create-post.usecase';
import { IPostRepository, Post } from '@/core/business/domain';

// Mock repository
const mockPostRepository: jest.Mocked<IPostRepository> = {
  create: jest.fn(),
  findOne: jest.fn(),
  findByAuthor: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('CreatePostUseCase', () => {
  let useCase: CreatePostUseCase;

  beforeEach(() => {
    useCase = new CreatePostUseCase(mockPostRepository);
    jest.clearAllMocks();
  });

  it('should create a post successfully', async () => {
    // Arrange
    const input = new CreatePostInput({
      title: 'Test Post',
      content: 'This is a test post content',
      authorId: '123e4567-e89b-12d3-a456-426614174000',
    });

    const expectedPost = new Post({
      title: 'Test Post',
      content: 'This is a test post content',
      authorId: '123e4567-e89b-12d3-a456-426614174000',
    });

    mockPostRepository.create.mockResolvedValue(expectedPost);

    // Act
    const result = await useCase.handle(input);

    // Assert
    expect(mockPostRepository.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expectedPost);
    expect(result.title).toBe('Test Post');
    expect(result.content).toBe('This is a test post content');
    expect(result.authorId).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should throw error for invalid input', async () => {
    // Arrange
    const input = new CreatePostInput({
      title: '', // Invalid empty title
      content: 'This is a test post content',
      authorId: '123e4567-e89b-12d3-a456-426614174000',
    });

    // Act & Assert
    await expect(useCase.handle(input)).rejects.toThrow();
    expect(mockPostRepository.create).not.toHaveBeenCalled();
  });
}); 