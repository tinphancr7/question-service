# Core Business Logic - 1Test Question Service

## 🏗️ **LUỒNG HOẠT ĐỘNG CỦA CORE BUSINESS LOGIC**

Core Business Logic trong dự án này được thiết kế theo **Clean Architecture** với sự tách biệt rõ ràng giữa các layers để đảm bảo code **testable**, **maintainable** và **scalable**.

### **📁 CẤU TRÚC CORE/**

```text
core/
├── business/           # Business Logic Layer
│   ├── domain/        # Domain Layer (Models, Repositories)
│   └── usecases/      # Application Layer (Use Cases)
├── infrastructure/    # Infrastructure Layer (Data Access)
├── types/            # Shared Types & Base Classes
├── constants/        # Business Constants
└── utils/            # Utility Functions
```

### **🔄 LUỒNG HOẠT ĐỘNG CHI TIẾT**

#### **BƯỚC 1: Handler → Use Case**

```typescript
// Handler gọi Use Case
const usecase = new CreateCategoryUseCase(
  registry.postgresql.categoryRepository,
);
const result = await usecase.handle(domainInput);
```

**Giải thích:**

- Handler nhận gRPC request đã được map thành Domain Input
- Khởi tạo Use Case với repository được inject từ Registry
- Gọi `handle()` method để thực thi business logic

#### **BƯỚC 2: Use Case Validation**

```typescript
// Trong BaseUseCase.handle()
async handle(input: TInput): Promise<TOutput> {
  // 1. Validate input
  const validationErrors = validateSync(input);
  if (validationErrors.length > 0) {
    throw mapInputValidationErrors(validationErrors, this.getInputPrefix());
  }

  // 2. Execute business logic
  return this.execute(input);
}
```

**Input Validation Process:**

- Sử dụng **class-validator** để validate Domain Input
- Kiểm tra format, required fields, data types
- Throw validation errors nếu input không hợp lệ
- Chỉ proceed khi input đã validated

#### **BƯỚC 3: Business Logic Execution**

```typescript
// Trong CreateCategoryUseCase.execute()
protected async execute(input: CreateCategoryInput): Promise<Category> {
  const { name, parentId } = input;

  // Business Rule 1: Name không được trùng
  const conflictCategory = await this.categoryRepository.findOneByName(name);
  if (conflictCategory) {
    throw new AlreadyExistsError(`Category with name '${name}' already exists`);
  }

  // Business Rule 2: Parent phải tồn tại (nếu có)
  if (parentId) {
    const parentCategory = await this.categoryRepository.findOne(parentId);
    if (!parentCategory) {
      throw new NotFoundError(`Parent category with id '${parentId}' not found`);
    }
  }

  // Tạo Domain Model
  const category = new Category({ name, parentId });

  // Persist vào database
  const createdCategory = await this.categoryRepository.create(category);
  return createdCategory;
}
```

**Business Rules Implementation:**

- **Uniqueness Check**: Đảm bảo tên category không trùng lặp
- **Referential Integrity**: Parent category phải tồn tại
- **Domain Model Creation**: Tạo entity với business rules
- **Persistence**: Lưu trữ thông qua repository pattern

#### **BƯỚC 4: Domain Model Creation**

```typescript
// Category constructor
constructor(props: CategoryProto) {
  super();
  this._id = props.id ?? v4();           // Auto-generate ID
  this._name = props.name;
  this._parentId = props.parentId;
  this._createdAt = props.createdAt ?? new Date().toISOString();
  this._updatedAt = props.updatedAt ?? new Date().toISOString();

  this.validate();  // Validate domain rules
}
```

**Domain Model Features:**

- **Auto ID Generation**: UUID v4 nếu không được cung cấp
- **Timestamp Management**: Tự động set created/updated timestamps
- **Immutable Properties**: Sử dụng private fields với getters
- **Self Validation**: Validate ngay khi tạo object

#### **BƯỚC 5: Repository Pattern**

```typescript
// ICategoryRepository interface (Domain Layer)
export interface ICategoryRepository {
  create(category: Category): Promise<Category>;
  findAll(input: FindAllCategoriesInput): Promise<Array<Category>>;
  findOne(id: string): Promise<Category | null>;
  findOneByName(name: string): Promise<Category | null>;
  update(id: string, props: Partial<CategoryUpdateProps>): Promise<Category>;
  deleteMany(ids: string[]): Promise<void>;
  delete(id: string): Promise<void>;
  validateCategoryPath(path: string[]): Promise<boolean>;
  hasChildren(ids: string[]): Promise<boolean>;
}
```

**Repository Pattern Benefits:**

- **Abstraction**: Domain layer không biết về database implementation
- **Testability**: Dễ dàng mock cho testing
- **Flexibility**: Có thể đổi database mà không ảnh hưởng business logic
- **Single Responsibility**: Mỗi method có một nhiệm vụ rõ ràng

#### **BƯỚC 6: Infrastructure Implementation**

```typescript
// CategoryRepository implementation (Infrastructure Layer)
export class CategoryRepository implements ICategoryRepository {
  constructor(private readonly dataSource: PostgresqlDataSource) {}

  async create(category: Category): Promise<Category> {
    // 1. Convert Domain → Persistence
    const persistenceCategory = CategoryMapper.toPersistence(category);

    // 2. Save to database
    const createdCategory = await this.dataSource.connection.category.create({
      data: persistenceCategory,
    });

    // 3. Convert Persistence → Domain
    return CategoryMapper.toDomain(createdCategory);
  }
}
```

**Infrastructure Responsibilities:**

- **Data Mapping**: Convert giữa Domain objects và Persistence models
- **Database Operations**: Thực hiện actual database calls
- **Connection Management**: Quản lý database connections
- **Error Handling**: Handle database-specific errors

### **🏛️ CÁC LAYER VÀ TRÁCH NHIỆM**

#### **1. Domain Layer (`business/domain/`)**

##### **Models (Entities):**

```typescript
export class Category extends BaseModel {
  @IsUUID('4') private _id: string;
  @IsString() private _name: string;
  @IsUUID('4') @IsOptional() private _parentId: string | null;

  // Business Methods
  update(props: Partial<CategoryUpdateProps>) {
    if (props.name !== undefined) {
      this._name = props.name;
      this.updateTimestamp();  // Business rule: update timestamp
    }
    this.validate();  // Always validate after changes
    return this;
  }

  // Domain Rules
  private updateTimestamp() {
    this._updatedAt = new Date().toISOString();
  }

  toJSON(): CategoryProps {
    return {
      id: this._id,
      name: this._name,
      parentId: this._parentId ?? undefined,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
```

**Domain Model Features:**

- **Encapsulation**: Private fields với public getters
- **Business Methods**: Methods thể hiện business operations
- **Validation**: Self-validating objects
- **Immutability**: Controlled mutation through methods
- **Serialization**: toJSON() cho external representation

##### **Repositories (Interfaces):**

**Trách nhiệm:**

- Định nghĩa **contract** cho data access
- **Không** implement, chỉ định nghĩa interface
- **Domain Layer** không biết về database implementation
- Provide abstraction cho data operations

#### **2. Use Cases Layer (`business/usecases/`)**

##### **Application Services:**

```typescript
export class CreateCategoryUseCase extends BaseUseCase<
  CreateCategoryInput,
  Category
> {
  constructor(private readonly categoryRepository: ICategoryRepository) {
    super();
  }

  protected getInputPrefix(): string {
    return USECASE_INPUT_PREFIXES.CREATE_CATEGORY;
  }

  protected async execute(input: CreateCategoryInput): Promise<Category> {
    // Orchestrate business operations
    // 1. Business validations
    // 2. Domain model creation
    // 3. Repository calls
    // 4. Return domain model
  }
}
```

**Use Case Responsibilities:**

- **Orchestration**: Điều phối các domain objects
- **Business Rules**: Implement complex business logic
- **Transaction Management**: Quản lý transactions
- **Input Validation**: Validate business inputs
- **Error Handling**: Convert technical errors to business errors

**Các Use Cases trong Category:**

- `CreateCategoryUseCase`: Tạo mới category
- `UpdateCategoryUseCase`: Cập nhật category
- `DeleteCategoryUseCase`: Xóa một category
- `DeleteCategoriesUseCase`: Xóa nhiều categories (bulk)
- `ListCategoriesUseCase`: Lấy danh sách categories với filtering

#### **3. Infrastructure Layer (`infrastructure/`)**

##### **Data Access:**

```typescript
export class CategoryRepository implements ICategoryRepository {
  constructor(private readonly dataSource: PostgresqlDataSource) {}

  async create(category: Category): Promise<Category> {
    const persistenceCategory = CategoryMapper.toPersistence(category);

    const createdCategory = await this.dataSource.connection.category.create({
      data: persistenceCategory,
    });

    return CategoryMapper.toDomain(createdCategory);
  }

  async findAll(input: FindAllCategoriesInput): Promise<Array<Category>> {
    const categories = await this.dataSource.connection.category.findMany({
      where: this.buildWhereConditions(input),
    });

    return categories.map(CategoryMapper.toDomain);
  }

  private buildWhereConditions(
    input: FindAllCategoriesInput,
  ): Prisma.CategoryWhereInput {
    const { filter, query } = input;
    const whereConditions: { AND: Prisma.CategoryWhereInput[] } = { AND: [] };

    if (query) {
      whereConditions.AND.push({
        name: { contains: query, mode: 'insensitive' },
      });
    }

    if (filter?.ids && filter.ids.length) {
      whereConditions.AND.push({
        id: { in: filter.ids },
      });
    }

    return whereConditions;
  }
}
```

##### **Mappers:**

```typescript
export class CategoryMapper {
  static toDomain(persistence: PrismaCategory): Category {
    return new Category({
      id: persistence.id,
      name: persistence.name,
      parentId: persistence.parentId,
      createdAt: persistence.createdAt.toISOString(),
      updatedAt: persistence.updatedAt.toISOString(),
    });
  }

  static toPersistence(domain: Category): CreateCategoryData {
    return {
      id: domain.id,
      name: domain.name,
      parentId: domain.parentId,
      createdAt: new Date(domain.createdAt),
      updatedAt: new Date(domain.updatedAt),
    };
  }
}
```

**Infrastructure Responsibilities:**

- **Database Implementation**: Actual database operations
- **Data Mapping**: Convert between Domain ↔ Persistence
- **Query Building**: Construct database queries
- **Connection Management**: Handle database connections
- **Performance Optimization**: Indexing, query optimization

### **🔀 DEPENDENCY FLOW**

```text
Handler → Use Case → Domain Model → Repository Interface
                ↓                         ↑
          Infrastructure ← Repository Implementation
```

**Dependency Inversion Principle:**

- **Domain Layer** không phụ thuộc vào Infrastructure
- **Use Cases** chỉ biết về Repository interfaces
- **Infrastructure** implement interfaces từ Domain
- **Dependencies point inward** (towards domain)

**Registry Pattern cho Dependency Injection:**

```typescript
export class ServiceRegistry {
  private _categoryRepository!: ICategoryRepository;

  initialize(): void {
    const postgresqlDataSource = new PostgresqlDataSource();
    this._categoryRepository = new CategoryRepository(postgresqlDataSource);
  }

  get postgresql() {
    this.ensureInitialized();
    return {
      categoryRepository: this._categoryRepository,
    };
  }
}
```

### **⚙️ VALIDATION STRATEGY**

#### **1. Input Validation (Use Case Level)**

```typescript
export class CreateCategoryInput {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsUUID('4')
  @IsOptional()
  readonly parentId: string | null;

  constructor(data: ProtoOf<CreateCategoryInput>) {
    Object.assign(this, data);
  }
}
```

**Features:**

- **Decorator-based validation** với class-validator
- **Type safety** với TypeScript
- **Immutable properties** với readonly
- **Optional fields** handling

#### **2. Domain Validation (Model Level)**

```typescript
export class Category extends BaseModel {
  @IsUUID('4') private _id: string;
  @IsString() private _name: string;

  protected validate() {
    const validationErrors = validateSync(this);
    if (validationErrors.length > 0) {
      throw mapModelValidationErrors(
        validationErrors,
        this.getEntityPrefix(),
        `Invalid ${this.constructor.name}`
      );
    }
  }
}
```

**Domain Validation Features:**

- **Automatic validation** trong constructor và update methods
- **Business rule validation** thông qua decorators
- **Custom error mapping** cho consistent error format
- **Entity-specific error prefixes**

#### **3. Business Rules Validation (Use Case Level)**

```typescript
// Name uniqueness check
const conflictCategory = await this.categoryRepository.findOneByName(name);
if (conflictCategory) {
  throw new AlreadyExistsError(
    `Category with name '${name}' already exists`,
    null,
    ENTITY_PREFIXES.CATEGORY,
  );
}

// Parent existence check
if (parentId) {
  const parentCategory = await this.categoryRepository.findOne(parentId);
  if (!parentCategory) {
    throw new NotFoundError(
      `Parent category with id '${parentId}' not found`,
      null,
      ENTITY_PREFIXES.CATEGORY,
    );
  }
}
```

**Business Rules Examples:**

- **Uniqueness constraints**: Tên category không được trùng
- **Referential integrity**: Parent category phải tồn tại
- **Business invariants**: Category không thể là parent của chính nó
- **State validation**: Category status transitions

### **🎯 ERROR HANDLING STRATEGY**

#### **1. Domain Errors**

```typescript
// Business errors với meaningful messages
throw new AlreadyExistsError(
  'Category name already exists',
  null,
  ENTITY_PREFIXES.CATEGORY,
);

throw new NotFoundError(
  'Parent category not found',
  null,
  ENTITY_PREFIXES.CATEGORY,
);

throw new BadRequestError(
  'Category cannot be its own parent',
  null,
  ENTITY_PREFIXES.CATEGORY,
);
```

#### **2. Validation Errors**

```typescript
// Input validation errors
throw mapInputValidationErrors(
  validationErrors,
  this.getInputPrefix(),
  `Invalid use case input: ${this.constructor.name}`,
);

// Model validation errors
throw mapModelValidationErrors(
  validationErrors,
  this.getEntityPrefix(),
  `Invalid ${this.constructor.name}`,
);
```

#### **3. Infrastructure Errors**

```typescript
// Database errors are caught and re-thrown as domain errors
try {
  await this.dataSource.connection.category.create(data);
} catch (dbError) {
  if (dbError.code === 'P2002') {
    // Prisma unique constraint error
    throw new AlreadyExistsError('Category already exists');
  }
  if (dbError.code === 'P2025') {
    // Record not found
    throw new NotFoundError('Category not found');
  }
  throw dbError; // Re-throw unexpected errors
}
```

**Error Handling Benefits:**

- **Consistent error format** across all layers
- **Meaningful error messages** cho developers và users
- **Proper error categorization** (validation, business, technical)
- **Error code mapping** cho internationalization

### **🧪 TESTING STRATEGY**

#### **1. Unit Testing Use Cases**

```typescript
describe('CreateCategoryUseCase', () => {
  let useCase: CreateCategoryUseCase;
  let mockRepository: jest.Mocked<ICategoryRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findOneByName: jest.fn(),
      findOne: jest.fn(),
      // ... other methods
    } as jest.Mocked<ICategoryRepository>;

    useCase = new CreateCategoryUseCase(mockRepository);
  });

  it('should create category successfully', async () => {
    // Arrange
    const input = new CreateCategoryInput({
      name: 'Programming',
      parentId: null,
    });

    mockRepository.findOneByName.mockResolvedValue(null);
    mockRepository.create.mockResolvedValue(expectedCategory);

    // Act
    const result = await useCase.handle(input);

    // Assert
    expect(result).toEqual(expectedCategory);
    expect(mockRepository.findOneByName).toHaveBeenCalledWith('Programming');
    expect(mockRepository.create).toHaveBeenCalled();
  });

  it('should throw error when category name already exists', async () => {
    // Arrange
    const input = new CreateCategoryInput({
      name: 'Programming',
      parentId: null,
    });

    mockRepository.findOneByName.mockResolvedValue(existingCategory);

    // Act & Assert
    await expect(useCase.handle(input)).rejects.toThrow(AlreadyExistsError);
  });
});
```

#### **2. Testing Domain Models**

```typescript
describe('Category', () => {
  it('should create category with valid data', () => {
    // Arrange
    const props = {
      name: 'Programming',
      parentId: null,
    };

    // Act
    const category = new Category(props);

    // Assert
    expect(category.name).toBe('Programming');
    expect(category.parentId).toBeNull();
    expect(category.id).toBeDefined();
    expect(category.createdAt).toBeDefined();
  });

  it('should throw validation error for invalid data', () => {
    // Arrange
    const props = {
      name: '', // Invalid: empty string
      parentId: null,
    };

    // Act & Assert
    expect(() => new Category(props)).toThrow('Validation failed');
  });

  it('should update category and timestamp', () => {
    // Arrange
    const category = new Category({ name: 'Old Name', parentId: null });
    const originalUpdatedAt = category.updatedAt;

    // Act
    category.update({ name: 'New Name' });

    // Assert
    expect(category.name).toBe('New Name');
    expect(category.updatedAt).not.toBe(originalUpdatedAt);
  });
});
```

#### **3. Integration Testing**

```typescript
describe('CategoryRepository Integration', () => {
  let repository: CategoryRepository;
  let dataSource: PostgresqlDataSource;

  beforeAll(async () => {
    dataSource = new PostgresqlDataSource();
    repository = new CategoryRepository(dataSource);
  });

  it('should create and retrieve category', async () => {
    // Arrange
    const category = new Category({
      name: 'Test Category',
      parentId: null,
    });

    // Act
    const created = await repository.create(category);
    const found = await repository.findOne(created.id);

    // Assert
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Test Category');
  });
});
```

### **📊 PERFORMANCE CONSIDERATIONS**

#### **1. Repository Patterns**

```typescript
export class CategoryRepository {
  // Connection pooling
  constructor(private readonly dataSource: PostgresqlDataSource) {}

  // Query optimization
  async findAll(input: FindAllCategoriesInput): Promise<Array<Category>> {
    return this.dataSource.connection.category.findMany({
      where: this.buildWhereConditions(input),
      // Add indexes on frequently queried fields
      orderBy: { name: 'asc' },
      // Pagination for large datasets
      take: input.limit,
      skip: input.offset,
    });
  }

  // Efficient bulk operations
  async deleteMany(ids: string[]): Promise<void> {
    await this.dataSource.connection.category.deleteMany({
      where: { id: { in: ids } },
    });
  }
}
```

#### **2. Domain Model Optimization**

```typescript
export class Category extends BaseModel {
  // Immutable properties với getters (no setters)
  get name() {
    return this._name;
  }
  get id() {
    return this._id;
  }

  // Validation caching để tránh re-validate
  private _isValid = false;

  protected validate() {
    if (this._isValid) return;

    const validationErrors = validateSync(this);
    if (validationErrors.length > 0) {
      throw mapModelValidationErrors(validationErrors, this.getEntityPrefix());
    }

    this._isValid = true;
  }

  // Efficient serialization
  toJSON(): CategoryProps {
    return {
      id: this._id,
      name: this._name,
      parentId: this._parentId ?? undefined,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
```

#### **3. Use Case Optimization**

```typescript
export class ListCategoriesUseCase {
  protected async execute(input: ListCategoriesInput): Promise<Category[]> {
    // Single database call với optimized query
    const categories = await this.categoryRepository.findAll({
      filter: input.filter,
      query: input.query,
      // Pagination để handle large datasets
      limit: input.limit ?? 100,
      offset: input.offset ?? 0,
    });

    // Minimal object creation
    return categories; // Already mapped by repository
  }
}
```

### **🔧 MAINTENANCE & EXTENSIBILITY**

#### **1. Adding New Use Cases**

```typescript
// Tạo new use case bằng cách extend BaseUseCase
export class ArchiveCategoryUseCase extends BaseUseCase<
  ArchiveCategoryInput,
  Category
> {
  constructor(private readonly categoryRepository: ICategoryRepository) {
    super();
  }

  protected getInputPrefix(): string {
    return USECASE_INPUT_PREFIXES.ARCHIVE_CATEGORY;
  }

  protected async execute(input: ArchiveCategoryInput): Promise<Category> {
    // Business logic for archiving
  }
}
```

#### **2. Extending Domain Models**

```typescript
export class Category extends BaseModel {
  // Thêm new properties
  @IsBoolean()
  @IsOptional()
  private _isArchived: boolean = false;

  get isArchived() { return this._isArchived; }

  // Thêm new business methods
  archive() {
    this._isArchived = true;
    this.updateTimestamp();
    this.validate();
    return this;
  }

  unarchive() {
    this._isArchived = false;
    this.updateTimestamp();
    this.validate();
    return this;
  }
}
```

#### **3. Repository Extension**

```typescript
export interface ICategoryRepository {
  // Existing methods...

  // New methods
  findArchived(): Promise<Array<Category>>;
  findByPath(path: string[]): Promise<Array<Category>>;
  bulkUpdate(
    updates: Array<{ id: string; props: Partial<CategoryUpdateProps> }>,
  ): Promise<void>;
}
```

---

## 🎯 **TÓM TẮT CORE BUSINESS LOGIC**

**Core Business Logic** trong dự án này tuân thủ **Clean Architecture** với:

### **📋 Kiến trúc phân lớp:**

1. **Domain Layer**: Models và Repository interfaces
2. **Use Case Layer**: Application services và business logic
3. **Infrastructure Layer**: Database implementations và mappers

### **🔑 Nguyên tắc chính:**

- **Dependency Inversion**: Dependencies point inward
- **Single Responsibility**: Mỗi class có một nhiệm vụ rõ ràng
- **Open/Closed**: Mở cho extension, đóng cho modification
- **Interface Segregation**: Interfaces nhỏ và focused

### **⚡ Lợi ích:**

- **Testability**: Dễ dàng unit test với mocking
- **Maintainability**: Code organization rõ ràng
- **Scalability**: Dễ dàng thêm features mới
- **Flexibility**: Có thể đổi infrastructure mà không ảnh hưởng business logic

### **🛡️ Error Handling:**

- **Validation** ở multiple levels (Input, Domain, Business Rules)
- **Consistent error format** với meaningful messages
- **Proper error categorization** và mapping

### **🔄 Flow tóm tắt:**

```text
Handler → Use Case → Validation → Business Rules → Domain Model → Repository → Database
                ↓                                                        ↑
              Response ← JSON Serialization ← Domain Model ← Mapper ← Database Result
```

Kiến trúc này đảm bảo business logic **pure**, **testable** và **independent** khỏi external concerns như database, gRPC protocol, hay infrastructure details.
