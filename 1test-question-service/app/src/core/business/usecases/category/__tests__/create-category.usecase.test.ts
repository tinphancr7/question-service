import { CreateCategoryUseCase } from '../create-category.usecase';
import { Category, ICategoryRepository } from '@/core/business/domain';
import { AlreadyExistsError, NotFoundError } from '@/core/types/errors';
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

describe('CreateCategoryUseCase', () => {
  let useCase: CreateCategoryUseCase;
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
    useCase = new CreateCategoryUseCase(mockCategoryRepository);
  });

  it('should create a category successfully', async () => {
    // Arrange
    const input = {
      name: 'Test Category',
      parentId: null,
    };

    const expectedCategory = new Category({
      id: 'generated-id',
      name: 'Test Category',
      parentId: null,
    });

    (mockCategoryRepository.findOneByName as jest.Mock).mockResolvedValue(null);
    (mockCategoryRepository.create as jest.Mock).mockResolvedValue(
      expectedCategory,
    );

    // Act
    const result = await useCase.handle(input);

    // Assert
    expect(mockCategoryRepository.findOneByName).toHaveBeenCalledWith(
      'Test Category',
    );
    expect(mockCategoryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Category',
        parentId: null,
      }),
    );
    expect(result).toEqual(expectedCategory);
  });

  it('should create a category with parentId successfully', async () => {
    // Arrange
    const parentId = '123e4567-e89b-12d3-a456-426614174000';
    const input = {
      name: 'Child Category',
      parentId,
    };

    const parentCategory = new Category({
      id: parentId,
      name: 'Parent Category',
      parentId: null,
    });

    const expectedCategory = new Category({
      id: 'generated-id',
      name: 'Child Category',
      parentId,
    });

    (mockCategoryRepository.findOneByName as jest.Mock).mockResolvedValue(null);
    (mockCategoryRepository.findOne as jest.Mock).mockResolvedValue(
      parentCategory,
    );
    (mockCategoryRepository.create as jest.Mock).mockResolvedValue(
      expectedCategory,
    );

    // Act
    const result = await useCase.handle(input);

    // Assert
    expect(mockCategoryRepository.findOneByName).toHaveBeenCalledWith(
      'Child Category',
    );
    expect(mockCategoryRepository.findOne).toHaveBeenCalledWith(parentId);
    expect(mockCategoryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Child Category',
        parentId,
      }),
    );
    expect(result).toEqual(expectedCategory);
  });

  it('should throw NotFoundError when parent category does not exist', async () => {
    // Arrange
    const parentId = '123e4567-e89b-12d3-a456-426614174000';
    const input = {
      name: 'Child Category',
      parentId,
    };

    (mockCategoryRepository.findOneByName as jest.Mock).mockResolvedValue(null);
    (mockCategoryRepository.findOne as jest.Mock).mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.handle(input)).rejects.toThrow(NotFoundError);
    expect(mockCategoryRepository.findOneByName).toHaveBeenCalledWith(
      'Child Category',
    );
    expect(mockCategoryRepository.findOne).toHaveBeenCalledWith(parentId);
    expect(mockCategoryRepository.create).not.toHaveBeenCalled();
  });

  it('should throw AlreadyExistsError when category name already exists', async () => {
    // Arrange
    const input = {
      name: 'Existing Category',
      parentId: null,
    };

    const existingCategory = new Category({
      id: 'existing-id',
      name: 'Existing Category',
      parentId: null,
    });

    (mockCategoryRepository.findOneByName as jest.Mock).mockResolvedValue(
      existingCategory,
    );

    // Act & Assert
    await expect(useCase.handle(input)).rejects.toThrow(AlreadyExistsError);
    expect(mockCategoryRepository.findOneByName).toHaveBeenCalledWith(
      'Existing Category',
    );
    expect(mockCategoryRepository.create).not.toHaveBeenCalled();
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
      name: 123, // Should be string
      parentId: 'not-a-uuid',
    } as any;

    // Act & Assert
    await expect(useCase.handle(invalidInput)).rejects.toThrow();
  });
});
