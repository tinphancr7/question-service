import { ListCategoriesUseCase } from '../list-categories.usecase';
import { Category, ICategoryRepository } from '@/core/business/domain';

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

describe('ListCategoriesUseCase', () => {
  let useCase: ListCategoriesUseCase;
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
    useCase = new ListCategoriesUseCase(mockCategoryRepository);
  });

  it('should list all categories without filters', async () => {
    // Arrange
    const input = {};

    const categories = [
      new Category({
        id: '1',
        name: 'Category 1',
        parentId: null,
      }),
      new Category({
        id: '2',
        name: 'Category 2',
        parentId: null,
      }),
    ];

    (
      mockCategoryRepository.validateCategoryPath as jest.Mock
    ).mockResolvedValue(true);
    (mockCategoryRepository.findAll as jest.Mock).mockResolvedValue(categories);

    // Act
    const result = await useCase.handle(input);

    // Assert
    expect(mockCategoryRepository.validateCategoryPath).toHaveBeenCalledWith(
      [],
    );
    expect(mockCategoryRepository.findAll).toHaveBeenCalledWith({
      filter: undefined,
      query: undefined,
    });
    expect(result).toEqual(categories);
  });

  it('should filter categories by path', async () => {
    // Arrange
    const input = {
      filter: {
        path: ['1', '2'],
      },
    };

    const filteredCategories = [
      new Category({
        id: '3',
        name: 'Subcategory',
        parentId: '2',
      }),
    ];

    (
      mockCategoryRepository.validateCategoryPath as jest.Mock
    ).mockResolvedValue(true);
    (mockCategoryRepository.findAll as jest.Mock).mockResolvedValue(
      filteredCategories,
    );

    // Act
    const result = await useCase.handle(input);

    // Assert
    expect(mockCategoryRepository.validateCategoryPath).toHaveBeenCalledWith([
      '1',
      '2',
    ]);
    expect(mockCategoryRepository.findAll).toHaveBeenCalledWith({
      filter: {
        path: ['1', '2'],
      },
      query: undefined,
    });
    expect(result).toEqual(filteredCategories);
  });

  it('should filter categories by query', async () => {
    // Arrange
    const input = {
      query: 'search term',
    };

    const searchedCategories = [
      new Category({
        id: '4',
        name: 'Search Result',
        parentId: null,
      }),
    ];

    (
      mockCategoryRepository.validateCategoryPath as jest.Mock
    ).mockResolvedValue(true);
    (mockCategoryRepository.findAll as jest.Mock).mockResolvedValue(
      searchedCategories,
    );

    // Act
    const result = await useCase.handle(input);

    // Assert
    expect(mockCategoryRepository.validateCategoryPath).toHaveBeenCalledWith(
      [],
    );
    expect(mockCategoryRepository.findAll).toHaveBeenCalledWith({
      filter: undefined,
      query: 'search term',
    });
    expect(result).toEqual(searchedCategories);
  });

  it('should handle empty results', async () => {
    // Arrange
    const input = {};

    (
      mockCategoryRepository.validateCategoryPath as jest.Mock
    ).mockResolvedValue(true);
    (mockCategoryRepository.findAll as jest.Mock).mockResolvedValue([]);

    // Act
    const result = await useCase.handle(input);

    // Assert
    expect(mockCategoryRepository.validateCategoryPath).toHaveBeenCalledWith(
      [],
    );
    expect(mockCategoryRepository.findAll).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('should apply both path filter and query search', async () => {
    // Arrange
    const input = {
      filter: {
        path: ['1'],
      },
      query: 'term',
    };

    const filteredCategories = [
      new Category({
        id: '5',
        name: 'Filtered Search',
        parentId: '1',
      }),
    ];

    (
      mockCategoryRepository.validateCategoryPath as jest.Mock
    ).mockResolvedValue(true);
    (mockCategoryRepository.findAll as jest.Mock).mockResolvedValue(
      filteredCategories,
    );

    // Act
    const result = await useCase.handle(input);

    // Assert
    expect(mockCategoryRepository.validateCategoryPath).toHaveBeenCalledWith([
      '1',
    ]);
    expect(mockCategoryRepository.findAll).toHaveBeenCalledWith({
      filter: {
        path: ['1'],
      },
      query: 'term',
    });
    expect(result).toEqual(filteredCategories);
  });

  it('should throw BadRequestError when category path is invalid', async () => {
    // Arrange
    const input = {
      filter: {
        path: ['invalid-id'],
      },
    };

    (
      mockCategoryRepository.validateCategoryPath as jest.Mock
    ).mockResolvedValue(false);

    // Act & Assert
    await expect(useCase.handle(input)).rejects.toThrow();
    expect(mockCategoryRepository.validateCategoryPath).toHaveBeenCalledWith([
      'invalid-id',
    ]);
    expect(mockCategoryRepository.findAll).not.toHaveBeenCalled();
  });

  it('should filter root categories when isRoot is true', async () => {
    // Arrange
    const input = {
      filter: {
        isRoot: true,
      },
    };

    const rootCategories = [
      new Category({
        id: '1',
        name: 'Root Category 1',
        parentId: null,
      }),
      new Category({
        id: '2',
        name: 'Root Category 2',
        parentId: null,
      }),
    ];

    (
      mockCategoryRepository.validateCategoryPath as jest.Mock
    ).mockResolvedValue(true);
    (mockCategoryRepository.findAll as jest.Mock).mockResolvedValue(
      rootCategories,
    );

    // Act
    const result = await useCase.handle(input);

    // Assert
    expect(mockCategoryRepository.validateCategoryPath).toHaveBeenCalledWith(
      [],
    );
    expect(mockCategoryRepository.findAll).toHaveBeenCalledWith({
      filter: {
        isRoot: true,
      },
      query: undefined,
    });
    expect(result).toEqual(rootCategories);
  });
});
