import { DeleteCategoriesUseCase } from '../delete-categories.usecase';
import { Category, ICategoryRepository } from '@/core/business/domain';
import { BadRequestError, NotFoundError } from '@/core/types/errors';
import * as validator from 'class-validator';

// Mock validateSync to bypass validation
jest.mock('class-validator', () => ({
  ...jest.requireActual('class-validator'),
  validateSync: jest.fn(() => []),
}));

// Mock the Category class to avoid validation errors
jest.mock('@/core/business/domain/models/category.model', () => {
  const originalModule = jest.requireActual(
    '@/core/business/domain/models/category.model',
  );

  // Define a type for the constructor props
  type MockCategoryProps = {
    id?: string;
    name: string;
    parentId: string | null;
    createdAt?: string;
    updatedAt?: string;
  };

  // Define a type for update props
  type MockUpdateProps = {
    name?: string;
    parentId?: string | null;
    updatedAt?: string;
  };

  return {
    ...originalModule,
    Category: class MockCategory {
      id: string;
      name: string;
      parentId: string | null;
      createdAt: string;
      updatedAt: string;

      constructor(props: MockCategoryProps) {
        this.id = props.id || 'mock-id';
        this.name = props.name;
        this.parentId = props.parentId;
        this.createdAt = props.createdAt || new Date().toISOString();
        this.updatedAt = props.updatedAt || new Date().toISOString();
      }

      update(props: MockUpdateProps) {
        if (props.name) this.name = props.name;
        this.updatedAt = new Date().toISOString();
        return this;
      }

      toJSON() {
        return {
          id: this.id,
          name: this.name,
          parentId: this.parentId,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
        };
      }
    },
  };
});

describe('DeleteCategoriesUseCase', () => {
  let useCase: DeleteCategoriesUseCase;
  let mockCategoryRepository: ICategoryRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCategoryRepository = {
      findOneByName: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      validateCategoryPath: jest.fn(),
      hasChildren: jest.fn(),
      deleteMany: jest.fn(),
    };
    useCase = new DeleteCategoriesUseCase(mockCategoryRepository);
  });

  it('should delete multiple categories successfully', async () => {
    // Arrange
    const categoryIds = [
      '123e4567-e89b-12d3-a456-426614174000',
      '123e4567-e89b-12d3-a456-426614174001',
    ];
    const input = {
      ids: categoryIds,
    };

    const existingCategories = categoryIds.map(
      (id) =>
        new Category({
          id,
          name: `Category ${id}`,
          parentId: null,
        }),
    );

    (mockCategoryRepository.findAll as jest.Mock).mockResolvedValue(
      existingCategories,
    );
    (mockCategoryRepository.hasChildren as jest.Mock).mockResolvedValue(false);
    (mockCategoryRepository.deleteMany as jest.Mock).mockResolvedValue(
      undefined,
    );

    // Act
    const result = await useCase.handle(input);

    // Assert
    expect(mockCategoryRepository.findAll).toHaveBeenCalledWith({
      filter: {
        ids: categoryIds,
      },
    });
    expect(mockCategoryRepository.hasChildren).toHaveBeenCalledWith(
      categoryIds,
    );
    expect(mockCategoryRepository.deleteMany).toHaveBeenCalledWith(categoryIds);
    expect(result).toBe(true);
  });

  it('should throw NotFoundError when some categories do not exist', async () => {
    // Arrange
    const existingId = '123e4567-e89b-12d3-a456-426614174000';
    const nonExistingId = '123e4567-e89b-12d3-a456-426614174001';
    const input = {
      ids: [existingId, nonExistingId],
    };

    const existingCategories = [
      new Category({
        id: existingId,
        name: 'Existing Category',
        parentId: null,
      }),
    ];

    (mockCategoryRepository.findAll as jest.Mock).mockResolvedValue(
      existingCategories,
    );

    // Act & Assert
    await expect(useCase.handle(input)).rejects.toThrow(NotFoundError);
    expect(mockCategoryRepository.findAll).toHaveBeenCalledWith({
      filter: {
        ids: [existingId, nonExistingId],
      },
    });
    expect(mockCategoryRepository.hasChildren).not.toHaveBeenCalled();
    expect(mockCategoryRepository.deleteMany).not.toHaveBeenCalled();
  });

  it('should throw BadRequestError when categories have children', async () => {
    // Arrange
    const categoryIds = [
      '123e4567-e89b-12d3-a456-426614174000',
      '123e4567-e89b-12d3-a456-426614174001',
    ];
    const input = {
      ids: categoryIds,
    };

    const existingCategories = categoryIds.map(
      (id) =>
        new Category({
          id,
          name: `Category ${id}`,
          parentId: null,
        }),
    );

    (mockCategoryRepository.findAll as jest.Mock).mockResolvedValue(
      existingCategories,
    );
    (mockCategoryRepository.hasChildren as jest.Mock).mockResolvedValue(true);

    // Act & Assert
    await expect(useCase.handle(input)).rejects.toThrow(BadRequestError);
    expect(mockCategoryRepository.findAll).toHaveBeenCalledWith({
      filter: {
        ids: categoryIds,
      },
    });
    expect(mockCategoryRepository.hasChildren).toHaveBeenCalledWith(
      categoryIds,
    );
    expect(mockCategoryRepository.deleteMany).not.toHaveBeenCalled();
  });

  it('should validate input before execution', async () => {
    // For this specific test case, we want validation to fail
    (validator.validateSync as jest.Mock).mockReturnValueOnce([
      {
        property: 'ids',
        constraints: { isUuid: 'each value in ids must be a UUID' },
      },
    ]);

    // Arrange
    const invalidInput = {
      ids: ['not-a-uuid', 'also-not-a-uuid'],
    } as any;

    // Act & Assert
    await expect(useCase.handle(invalidInput)).rejects.toThrow();
    expect(mockCategoryRepository.findAll).not.toHaveBeenCalled();
    expect(mockCategoryRepository.hasChildren).not.toHaveBeenCalled();
    expect(mockCategoryRepository.deleteMany).not.toHaveBeenCalled();
  });
});
