import { UpdateCategoryUseCase } from '../update-category.usecase';
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

describe('UpdateCategoryUseCase', () => {
  let useCase: UpdateCategoryUseCase;
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
    useCase = new UpdateCategoryUseCase(mockCategoryRepository);
  });

  it('should update a category successfully', async () => {
    // Arrange
    const categoryId = '123e4567-e89b-12d3-a456-426614174000';
    const input = {
      id: categoryId,
      name: 'Updated Category Name',
    };

    const existingCategory = new Category({
      id: categoryId,
      name: 'Original Category Name',
      parentId: null,
    });

    const updatedCategory = new Category({
      id: categoryId,
      name: 'Updated Category Name',
      parentId: null,
    });

    (mockCategoryRepository.findOne as jest.Mock).mockResolvedValue(
      existingCategory,
    );
    (mockCategoryRepository.update as jest.Mock).mockResolvedValue(
      updatedCategory,
    );

    // Act
    const result = await useCase.handle(input);

    // Assert
    expect(mockCategoryRepository.findOne).toHaveBeenCalledWith(categoryId);
    expect(mockCategoryRepository.update).toHaveBeenCalledWith(categoryId, {
      name: 'Updated Category Name',
    });
    expect(result).toEqual(updatedCategory);
  });

  it('should throw NotFoundError when category does not exist', async () => {
    // Arrange
    const categoryId = '123e4567-e89b-12d3-a456-426614174000';
    const input = {
      id: categoryId,
      name: 'Updated Category Name',
    };

    (mockCategoryRepository.findOne as jest.Mock).mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.handle(input)).rejects.toThrow(NotFoundError);
    expect(mockCategoryRepository.findOne).toHaveBeenCalledWith(categoryId);
    expect(mockCategoryRepository.update).not.toHaveBeenCalled();
  });

  it('should call update method on the category entity', async () => {
    // Arrange
    const categoryId = '123e4567-e89b-12d3-a456-426614174000';
    const input = {
      id: categoryId,
      name: 'Updated Category Name',
    };

    const existingCategory = new Category({
      id: categoryId,
      name: 'Original Category Name',
      parentId: null,
    });

    // Create a spy on the update method
    const updateSpy = jest.spyOn(existingCategory, 'update');

    const updatedCategory = new Category({
      id: categoryId,
      name: 'Updated Category Name',
      parentId: null,
    });

    (mockCategoryRepository.findOne as jest.Mock).mockResolvedValue(
      existingCategory,
    );
    (mockCategoryRepository.update as jest.Mock).mockResolvedValue(
      updatedCategory,
    );

    // Act
    await useCase.handle(input);

    // Assert
    expect(updateSpy).toHaveBeenCalledWith({ name: 'Updated Category Name' });
  });

  it('should validate input before execution', async () => {
    // For this specific test case, we want validation to fail
    (validator.validateSync as jest.Mock).mockReturnValueOnce([
      {
        property: 'name',
        constraints: { isString: 'must be a string' },
      },
    ]);

    // Arrange
    const invalidInput = {
      id: 'not-a-uuid',
      name: 123, // Should be string
    } as any;

    // Act & Assert
    await expect(useCase.handle(invalidInput)).rejects.toThrow();
  });
});
