import { DeleteCategoryUseCase } from '../delete-category.usecase';
import { Category, ICategoryRepository } from '@/core/business/domain';
import { NotFoundError } from '@/core/types/errors';
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

describe('DeleteCategoryUseCase', () => {
  let useCase: DeleteCategoryUseCase;
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
    useCase = new DeleteCategoryUseCase(mockCategoryRepository);
  });

  it('should delete a category successfully', async () => {
    // Arrange
    const categoryId = '123e4567-e89b-12d3-a456-426614174000';
    const input = {
      id: categoryId,
    };

    const existingCategory = new Category({
      id: categoryId,
      name: 'Category to Delete',
      parentId: null,
    });

    (mockCategoryRepository.findOne as jest.Mock).mockResolvedValue(
      existingCategory,
    );
    (mockCategoryRepository.hasChildren as jest.Mock).mockResolvedValue(false);
    (mockCategoryRepository.delete as jest.Mock).mockResolvedValue(undefined);

    // Act
    const result = await useCase.handle(input);

    // Assert
    expect(mockCategoryRepository.findOne).toHaveBeenCalledWith(categoryId);
    expect(mockCategoryRepository.hasChildren).toHaveBeenCalledWith([
      categoryId,
    ]);
    expect(mockCategoryRepository.delete).toHaveBeenCalledWith(categoryId);
    expect(result).toEqual(existingCategory);
  });

  it('should throw BadRequestError when category has children', async () => {
    // Arrange
    const categoryId = '123e4567-e89b-12d3-a456-426614174000';
    const input = {
      id: categoryId,
    };

    const existingCategory = new Category({
      id: categoryId,
      name: 'Category with Children',
      parentId: null,
    });

    (mockCategoryRepository.findOne as jest.Mock).mockResolvedValue(
      existingCategory,
    );
    (mockCategoryRepository.hasChildren as jest.Mock).mockResolvedValue(true);

    // Act & Assert
    await expect(useCase.handle(input)).rejects.toThrow('Category with id');
    expect(mockCategoryRepository.findOne).toHaveBeenCalledWith(categoryId);
    expect(mockCategoryRepository.hasChildren).toHaveBeenCalledWith([
      categoryId,
    ]);
    expect(mockCategoryRepository.delete).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when category does not exist', async () => {
    // Arrange
    const categoryId = '123e4567-e89b-12d3-a456-426614174000';
    const input = {
      id: categoryId,
    };

    (mockCategoryRepository.findOne as jest.Mock).mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.handle(input)).rejects.toThrow(NotFoundError);
    expect(mockCategoryRepository.findOne).toHaveBeenCalledWith(categoryId);
    expect(mockCategoryRepository.delete).not.toHaveBeenCalled();
  });

  it('should validate input before execution', async () => {
    // For this specific test case, we want validation to fail
    (validator.validateSync as jest.Mock).mockReturnValueOnce([
      {
        property: 'id',
        constraints: { isUuid: 'must be a UUID' },
      },
    ]);

    // Arrange
    const invalidInput = {
      id: 'not-a-uuid',
    } as any;

    // Act & Assert
    await expect(useCase.handle(invalidInput)).rejects.toThrow();
  });
});
