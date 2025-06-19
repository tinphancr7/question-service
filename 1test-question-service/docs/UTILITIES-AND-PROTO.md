# Utilities và Proto System - 1Test Question Service

## 🔧 **LUỒNG HOẠT ĐỘNG CỦA UTILITIES (CORE/UTILS/) VÀ PROTO**

Utilities và Proto system tạo ra một **foundation layer** vững chắc cho toàn bộ application, handle các cross-cutting concerns như error handling, authentication, validation, và code generation một cách **consistent** và **reusable**.

### **📁 CẤU TRÚC UTILITIES**

```text
core/utils/
├── grpc-error-mapper.ts      # Convert errors → gRPC format
├── grpc-metadata.ts          # Extract user context từ gRPC metadata
├── validation-error-mapper.ts # Map validation errors → domain errors
├── aws-creds.ts             # AWS Roles Anywhere credential management
├── env.util.ts              # Environment variable utilities
├── create-mock-function.ts   # Mock functions cho testing
├── mixin.util.ts            # Utility mixins
└── guards/                  # Error code builders và validation guards
    ├── error-code-builder.ts
    ├── base.error.ts
    └── index.ts
```

### **🔄 LUỒNG HOẠT ĐỘNG CHI TIẾT**

#### **1. gRPC Error Mapping Flow**

```typescript
// GrpcErrorMapper.ts - Convert domain errors thành gRPC errors
export class GrpcErrorMapper {
  static toGrpcError(error: Error): ErrorResponse {
    // 1. Validation Errors (400)
    if (error instanceof ValidationError) {
      return {
        httpStatusCode: 400,
        code: error.response.error.code,
        message: error.message,
        details: error.response.error.details.map((detail) => ({
          code: detail.code,
          message: detail.message,
          field: detail.field,
          codeParams: detail.codeParams,
        })),
      };
    }

    // 2. HTTP Errors (4xx/5xx)
    if (error instanceof HTTPError) {
      return {
        httpStatusCode: error.statusCode,
        code: error.response.error.code,
        message: error.message,
        details: [],
      };
    }

    // 3. System Errors (500)
    const systemError = new HTTPSystemError(
      error.message,
      CommonSystemCode.UNEXPECTED,
    );
    return {
      httpStatusCode: systemError.statusCode,
      code: systemError.response.error.code,
      message: error.message,
      details: [],
    };
  }

  // Handler wrapper để catch và convert errors
  static handle<T>(callback: sendUnaryData<ResponseType<T>>, f: () => void) {
    try {
      f();
    } catch (e) {
      callback(null, { error: GrpcErrorMapper.toGrpcError(e as Error) });
    }
  }
}
```

**Luồng Error Handling:**

```text
Domain Error → GrpcErrorMapper → gRPC ErrorResponse → Client
```

**Các loại errors được handle:**

- **ValidationError**: Input validation failures (400)
- **HTTPError**: Business logic errors (4xx/5xx)
- **System Errors**: Unexpected errors (500)

**Sử dụng trong Handler:**

```typescript
// Trong CategoryHandler
createCategory(call, callback) {
  GrpcErrorMapper.handle(callback, () => {
    // Business logic
    // Nếu có error được throw, sẽ tự động được catch và convert
  });
}
```

#### **2. gRPC Metadata Processing**

```typescript
// GrpcMetadata.ts - Extract user context từ gRPC headers
export class GrpcMetadata {
  static getUserContext(metadata: Metadata): UserContext {
    const midUserMetadata = this.getMidUserMetadata(metadata);

    // Validate required fields
    if (
      !midUserMetadata.id ||
      !midUserMetadata.email ||
      !midUserMetadata.userId ||
      !midUserMetadata.userGroups
    ) {
      throw new ForbiddenError();
    }

    return {
      id: midUserMetadata.id,
      email: midUserMetadata.email,
      userId: midUserMetadata.userId,
      userGroups: midUserMetadata.userGroups,
    };
  }

  private static getMidUserMetadata(metadata: Metadata): MidUserMetadata {
    const headers = metadata.toHttp2Headers();

    return {
      id: this.getKey('mid-id', headers)?.[0],
      email: this.getKey('mid-email', headers)?.[0],
      userId: this.getKey('mid-user_id', headers)?.[0],
      userGroups: this.getKey('mid-user_groups', headers),
    };
  }

  static getKey(
    key: string,
    headers: OutgoingHttpHeaders,
  ): number | string | string[] | undefined {
    const data = headers[key];
    if (!data) return undefined;
    return data;
  }
}
```

**Authentication Flow:**

```text
gRPC Request → Metadata Headers → GrpcMetadata → UserContext → Handler
```

**User Context Structure:**

```typescript
interface UserContext {
  id: string; // User ID
  email: string; // User email
  userId: string; // Internal user ID
  userGroups: string[]; // User roles/groups
}
```

**Sử dụng trong Handler:**

```typescript
createCategory(call, callback) {
  const userContext = GrpcMetadata.getUserContext(call.metadata);

  // Có thể sử dụng userContext cho authorization
  if (!userContext.userGroups.includes('admin')) {
    throw new ForbiddenError('Insufficient permissions');
  }
}
```

#### **3. Validation Error Mapping**

```typescript
// validation-error-mapper.ts
function mapValidationErrorDetails(
  errors: ClassValidatorError[],
  entityPrefix: string,
  parentPath: string = '',
) {
  let result: any[] = [];

  errors.forEach((error) => {
    // Handle nested validation errors
    if (error.children && error.children.length > 0) {
      const nestedPath = parentPath
        ? `${parentPath}.${error.property}`
        : error.property;
      const nestedErrors = mapValidationErrorDetails(
        error.children,
        entityPrefix,
        nestedPath,
      );
      result = [...result, ...nestedErrors];
    } else {
      // Map individual validation error
      const field = parentPath
        ? `${parentPath}.${error.property}`
        : error.property.startsWith('_')
          ? error.property.substring(1)
          : error.property;

      result.push({
        code: this.buildErrorCode(entityPrefix, error),
        message: error.constraints?.[Object.keys(error.constraints)[0]],
        field: field,
        codeParams: [],
      });
    }
  });

  return result;
}

// Export functions for different validation contexts
export function mapInputValidationErrors(
  errors: ClassValidatorError[],
  inputPrefix: string,
  message: string,
): InputValidationError {
  const details = mapValidationErrorDetails(errors, inputPrefix);
  return new InputValidationError(message, details);
}

export function mapModelValidationErrors(
  errors: ClassValidatorError[],
  entityPrefix: string,
  message: string,
): ModelValidationError {
  const details = mapValidationErrorDetails(errors, entityPrefix);
  return new ModelValidationError(message, details);
}
```

**Validation Flow:**

```text
class-validator errors → mapValidationErrorDetails → Domain ValidationError → gRPC ErrorResponse
```

**Features:**

- **Nested Validation**: Handle complex object validation
- **Field Path**: Full path to invalid field (e.g., `user.address.street`)
- **Error Codes**: Structured error codes với entity prefix
- **Multiple Errors**: Collect all validation errors, không chỉ first error

#### **4. AWS Credentials Management**

```typescript
// aws-creds.ts - AWS Roles Anywhere cho service authentication
export class AWSRolesAnywhereManager {
  private credentialsFilePath: string;
  private updateProcess: ChildProcess | null = null;
  private serveProcess: ChildProcess | null = null;

  async startCredentialServer(): Promise<void> {
    this.validateConfiguration();

    if (!this.isServeRunning) {
      await this.startServeProcess();
    }

    if (!this.isUpdateRunning) {
      await this.startUpdateProcess();
    }
  }

  private async startUpdateProcess(): Promise<void> {
    const updateCommand = [
      config.aws.credentialHelperPath,
      'update',
      '--profile-arn',
      config.aws.profileArn,
      '--role-arn',
      config.aws.roleArn,
      '--trust-anchor-arn',
      config.aws.trustAnchorArn,
      '--certificate',
      config.aws.certificatePath,
      '--private-key',
      config.aws.privateKeyPath,
      '--session-duration',
      config.aws.sessionDuration.toString(),
    ].join(' ');

    this.updateProcess = exec(updateCommand);
    this.isUpdateRunning = true;
  }

  private async startServeProcess(): Promise<void> {
    const serveCommand = [
      config.aws.credentialHelperPath,
      'serve',
      '--port',
      this.serverPort.toString(),
    ].join(' ');

    this.serveProcess = exec(serveCommand);
    this.isServeRunning = true;
  }

  getStatus(): object {
    return {
      isUpdateRunning: this.isUpdateRunning,
      isServeRunning: this.isServeRunning,
      serverPort: this.serverPort,
      credentialsFilePath: this.credentialsFilePath,
    };
  }
}
```

**AWS Authentication Flow:**

```text
Certificate + Private Key → AWS Roles Anywhere → Temporary Credentials → AWS Services
```

**Features:**

- **Certificate-based Authentication**: Không cần long-term credentials
- **Automatic Refresh**: Credentials được refresh tự động
- **Credential Server**: Local server provide credentials cho AWS SDKs
- **Configuration Validation**: Validate required settings trước khi start

### **📦 PROTOBUF SYSTEM**

#### **1. Proto File Generation**

```typescript
// scripts/gen_protobuf.ts - Generate TypeScript từ .proto files
function generateProtobufCode(): void {
  const pluginPath = getPluginPath();

  const command = [
    PROTOC_PATH,
    `--plugin=protoc-gen-ts_proto=${pluginPath}`,
    `--ts_proto_out=${OUT_DIR}`,
    '--ts_proto_opt=esModuleInterop=true',
    '--ts_proto_opt=forceLong=long',
    '--ts_proto_opt=useOptionals=messages',
    '--ts_proto_opt=outputServices=grpc-js',
    '--ts_proto_opt=env=node',
    `--proto_path=${PROTO_DIR}`,
    ...protoFiles,
  ].join(' ');

  console.log(`🔧 Generating protobuf code...`);
  console.log(`Command: ${command}`);

  execSync(command, { stdio: 'inherit' });

  console.log(`✅ Protobuf code generated successfully!`);
}

function cleanOutputDir(dir: string): void {
  if (!fs.existsSync(dir)) return;

  const items = fs.readdirSync(dir);
  items.forEach((item) => {
    const itemPath = path.join(dir, item);

    // Skip .gitignore and .gitkeep files
    if (item === '.gitignore' || item === '.gitkeep') {
      return;
    }

    if (fs.statSync(itemPath).isDirectory()) {
      cleanOutputDir(itemPath);
      try {
        fs.rmdirSync(itemPath);
      } catch (e) {
        // Directory may not be empty, that's fine
      }
    } else {
      fs.unlinkSync(itemPath);
    }
  });
}
```

**Proto Generation Flow:**

```text
.proto files → protoc compiler → TypeScript interfaces & gRPC services → app/src/protobuf/
```

**Generation Process:**

1. **Clean Output**: Remove old generated files
2. **Find Proto Files**: Scan proto directory
3. **Run protoc**: Generate TypeScript code
4. **Validate Output**: Ensure files were created

**Script Usage:**

```bash
# Generate proto files
pnpm gen:proto

# Or manually
ts-node scripts/gen_protobuf.ts
```

#### **2. Generated Proto Structures**

##### **Common Types:**

```typescript
// protobuf/common/common.ts - Common shared types
export interface ErrorDetail {
  code: string;
  message?: string | undefined;
  field?: string | undefined;
  codeParams: string[];
}

export interface ErrorResponse {
  httpStatusCode: number;
  code: string;
  message?: string | undefined;
  details: ErrorDetail[];
}

export interface Pagination {
  limit: number;
  offset?: string | undefined;
  previousOffset?: string | undefined;
}

export interface PaginationV2 {
  limit: number;
  offset: number;
}

export interface PaginationMetadataV2 {
  itemsPerPage: number;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  nextPage: number;
  previousPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

##### **Service-specific Types:**

```typescript
// protobuf/services/question/v1/category.ts - Category service definitions
export interface Category {
  id: string;
  name: string;
  parentId?: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryList {
  items: Category[];
}

export interface CreateCategoryRequest {
  name: string;
  parentId?: string | undefined;
}

export interface CreateCategoryResponse {
  data?: Category | undefined;
  error?: ErrorResponse | undefined;
}

export interface UpdateCategoryRequest {
  id: string;
  name: string;
}

export interface ListCategoriesRequest {
  filter?: ListCategoriesFilter | undefined;
  query?: string | undefined;
}

export interface ListCategoriesFilter {
  path?: string[] | undefined;
  ids?: string[] | undefined;
  isRoot?: boolean | undefined;
}

// gRPC Service Definition
export interface CategoryServiceServer extends UntypedServiceImplementation {
  createCategory: handleUnaryCall<
    CreateCategoryRequest,
    CreateCategoryResponse
  >;
  updateCategory: handleUnaryCall<
    UpdateCategoryRequest,
    UpdateCategoryResponse
  >;
  deleteCategory: handleUnaryCall<
    DeleteCategoryRequest,
    DeleteCategoryResponse
  >;
  deleteCategories: handleUnaryCall<
    DeleteCategoriesRequest,
    DeleteCategoriesResponse
  >;
  listCategories: handleUnaryCall<
    ListCategoriesRequest,
    ListCategoriesResponse
  >;
}

export const CategoryServiceService: ServiceDefinition<CategoryServiceServer> =
  {
    createCategory: {
      path: '/services.question.v1.CategoryService/CreateCategory',
      requestStream: false,
      responseStream: false,
      requestSerialize: (value: CreateCategoryRequest) =>
        Buffer.from(CreateCategoryRequest.encode(value).finish()),
      requestDeserialize: (value: Buffer) =>
        CreateCategoryRequest.decode(value),
      responseSerialize: (value: CreateCategoryResponse) =>
        Buffer.from(CreateCategoryResponse.encode(value).finish()),
      responseDeserialize: (value: Buffer) =>
        CreateCategoryResponse.decode(value),
    },
    // ... other methods
  };
```

#### **3. Proto Integration Flow**

```text
Proto Definition → Generated TypeScript → Handler Implementation → Business Logic
```

**Ví dụ cụ thể:**

##### **1. Proto Definition:**

```protobuf
// proto/services/question/v1/category.proto
syntax = "proto3";
package services.question.v1;

import "common/common.proto";

service CategoryService {
  rpc CreateCategory(CreateCategoryRequest) returns (CreateCategoryResponse);
  rpc UpdateCategory(UpdateCategoryRequest) returns (UpdateCategoryResponse);
  rpc DeleteCategory(DeleteCategoryRequest) returns (DeleteCategoryResponse);
  rpc ListCategories(ListCategoriesRequest) returns (ListCategoriesResponse);
}

message CreateCategoryRequest {
  string name = 1;
  optional string parent_id = 2;
}

message CreateCategoryResponse {
  oneof response {
    Category data = 1;
    common.ErrorResponse error = 2;
  }
}

message Category {
  string id = 1;
  string name = 2;
  optional string parent_id = 3;
  string created_at = 4;
  string updated_at = 5;
}
```

##### **2. Generated TypeScript:**

```typescript
// Generated automatically
export interface CreateCategoryRequest {
  name: string;
  parentId?: string | undefined;
}

export interface CreateCategoryResponse {
  data?: Category | undefined;
  error?: ErrorResponse | undefined;
}

export interface CategoryServiceServer {
  createCategory: handleUnaryCall<
    CreateCategoryRequest,
    CreateCategoryResponse
  >;
}
```

##### **3. Handler Implementation:**

```typescript
// handlers/v1/category/handler.ts
const CategoryHandler: CategoryServiceServer = {
  createCategory(call, callback) {
    // call.request có type CreateCategoryRequest
    // callback có type sendUnaryData<CreateCategoryResponse>

    GrpcErrorMapper.handle(callback, () => {
      const usecase = new CreateCategoryUseCase(
        registry.postgresql.categoryRepository,
      );

      const executed = usecase.handle(
        ProtoMapper.toCreateCategoryInput(call.request),
      );

      executed
        .then((category) => {
          callback(null, { data: category.toJSON() });
        })
        .catch((error) => {
          callback(null, {
            error: GrpcErrorMapper.toGrpcError(error as Error),
          });
        });
    });
  },
};

export const CategoryServicePackage: ProtoPackage = {
  Handler: CategoryHandler,
  Definition: CategoryServiceService,
};
```

### **🔧 ERROR CODE SYSTEM**

#### **Error Code Builder Pattern**

```typescript
// guards/error-code-builder.ts
export enum ErrorType {
  VALIDATION = 'VAL', // Validation errors
  BUSINESS = 'BIZ', // Business logic errors
  SYSTEM = 'SYS', // System/technical errors
}

export enum CommonValidationCode {
  REQUIRED = '001',
  MIN_LENGTH = '002',
  MAX_LENGTH = '003',
  PATTERN_MISMATCH = '004',
  INVALID_FORMAT = '005',
  INVALID_TYPE = '006',
  INVALID_RANGE = '007',
  INVALID_VALUE = '008',
  MIN_ITEMS = '009',
  MAX_ITEMS = '010',
  UNIQUE_ITEMS = '011',
  INVALID_ITEM = '012',
  REQUIRED_FIELDS = '013',
  INVALID_FIELD = '014',
  VALUE_MUST_GREATER_THAN = '015',
  VALUE_MUST_LESS_THAN = '016',
  VALUE_MUST_BE_GREATER_THAN_OR_EQUAL_TO = '017',
  VALUE_MUST_BE_LESS_THAN_OR_EQUAL_TO = '018',
}

export enum CommonBusinessCode {
  NOT_FOUND = '001',
  ALREADY_EXISTS = '002',
  INVALID_STATE = '003',
  INVALID_OPERATION = '004',
  INSUFFICIENT_PERMISSIONS = '005',
}

export enum CommonSystemCode {
  UNEXPECTED = '001',
  DATABASE_ERROR = '002',
  EXTERNAL_SERVICE_ERROR = '003',
  CONFIGURATION_ERROR = '004',
  NETWORK_ERROR = '005',
}

// Build structured error codes
export function errorCodeBuilder(
  servicePrefix: string,
  entityPrefix: string,
  errorType: ErrorType,
  specificCode: string,
): string {
  return `${servicePrefix}.${entityPrefix}.${errorType}.${specificCode}`;
}
```

**Error Code Format:**

```text
QS.CAT.VAL.001 = Question Service + Category + Validation + Required Field
QS.CAT.BIZ.002 = Question Service + Category + Business + Already Exists
QS.SYS.GEN.001 = Question Service + System + General + Unexpected Error
```

**Usage Example:**

```typescript
// In validation error mapper
const errorCode = errorCodeBuilder(
  SERVICE_PREFIX.QUESTION_SERVICE, // 'QS'
  ENTITY_PREFIXES.CATEGORY, // 'CAT'
  ErrorType.VALIDATION, // 'VAL'
  CommonValidationCode.REQUIRED, // '001'
);
// Result: 'QS.CAT.VAL.001'
```

**Benefits:**

- **Consistent Structure**: All error codes follow same pattern
- **Easy Categorization**: Service, Entity, Type, Specific code
- **Internationalization**: Error codes can be mapped to localized messages
- **Debugging**: Easy to identify source of error

### **🎭 UTILITY PATTERNS**

#### **1. Mock Function Creator**

```typescript
// create-mock-function.ts - Tạo mock functions cho testing
export function createMockFunction<T extends (...args: any[]) => any>(
  implementation?: T,
): jest.MockedFunction<T> {
  return jest.fn(implementation) as jest.MockedFunction<T>;
}

// Usage in tests
const mockRepository = {
  create: createMockFunction<ICategoryRepository['create']>(),
  findOne: createMockFunction<ICategoryRepository['findOne']>(),
  findOneByName: createMockFunction<ICategoryRepository['findOneByName']>(),
};

// Setup mock behavior
mockRepository.findOneByName.mockResolvedValue(null);
mockRepository.create.mockResolvedValue(expectedCategory);
```

#### **2. Environment Utilities**

```typescript
// env.util.ts - Environment variable helpers
export const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is required`);
    }
    return defaultValue;
  }
  return value;
};

export const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;

  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  return parsed;
};

export const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
};

export const getEnvArray = (key: string, separator: string = ','): string[] => {
  const value = process.env[key];
  if (!value) return [];
  return value
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
};
```

**Usage in Config:**

```typescript
// config.ts
export const config = {
  server: {
    host: getEnv('SERVER_HOST', '0.0.0.0'),
    port: getEnvNumber('SERVER_PORT', 50051),
  },
  aws: {
    enabled: getEnvBoolean('AWS_ENABLED', false),
    region: getEnv('AWS_REGION', 'us-east-1'),
    sessionDuration: getEnvNumber('AWS_SESSION_DURATION', 3600),
  },
  proto: {
    files: getEnvArray('PROTO_FILES', ','),
  },
};
```

#### **3. Mixin Utilities**

```typescript
// mixin.util.ts - Utility mixins cho class extension
type Constructor<T = {}> = new (...args: any[]) => T;

// Timestampable mixin
export function Timestampable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    createdAt: Date = new Date();
    updatedAt: Date = new Date();

    updateTimestamp() {
      this.updatedAt = new Date();
    }
  };
}

// Auditable mixin
export function Auditable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    createdBy?: string;
    updatedBy?: string;

    setAuditInfo(userId: string) {
      if (!this.createdBy) {
        this.createdBy = userId;
      }
      this.updatedBy = userId;
    }
  };
}

// Usage
class BaseEntity {
  id: string;
}

class Category extends Auditable(Timestampable(BaseEntity)) {
  name: string;

  update(name: string, userId: string) {
    this.name = name;
    this.updateTimestamp();
    this.setAuditInfo(userId);
  }
}
```

### **🔄 INTEGRATION FLOW**

#### **Complete Request Processing:**

```text
1. gRPC Request → GrpcMetadata.getUserContext() → UserContext
2. Handler → GrpcErrorMapper.handle() → Error Protection
3. ProtoMapper → Domain Input → Validation
4. ValidationErrorMapper → Structured Error Details
5. Use Case → Business Logic → Repository
6. Domain Model → ProtoMapper → gRPC Response
7. Error → GrpcErrorMapper.toGrpcError() → ErrorResponse
8. AWS Services → AWSRolesAnywhereManager → Credentials
```

#### **Development Workflow:**

```text
1. Define .proto service/messages
2. Run `pnpm gen:proto` → Generate TypeScript
3. Implement Handler với generated interfaces
4. Use utilities cho error handling, validation, auth
5. Test với mock utilities
6. Deploy với AWS credentials
```

#### **Error Flow:**

```text
Domain Error → ValidationErrorMapper → GrpcErrorMapper → ErrorResponse → Client
```

#### **Authentication Flow:**

```text
gRPC Metadata → GrpcMetadata → UserContext → Authorization Check → Handler
```

### **🛡️ CROSS-CUTTING CONCERNS**

#### **1. Authentication & Authorization**

**Features:**

- **GrpcMetadata**: Extract user context từ headers
- **User Groups**: Role-based access control
- **Forbidden Errors**: When authentication fails
- **Middleware Pattern**: Consistent auth across handlers

**Implementation:**

```typescript
// In handler
export function requireAuth(userGroups: string[]) {
  return (call: any) => {
    const userContext = GrpcMetadata.getUserContext(call.metadata);

    const hasPermission = userGroups.some((group) =>
      userContext.userGroups.includes(group),
    );

    if (!hasPermission) {
      throw new ForbiddenError('Insufficient permissions');
    }

    return userContext;
  };
}

// Usage
const userContext = requireAuth(['admin', 'editor'])(call);
```

#### **2. Error Handling**

**Features:**

- **Structured Error Codes**: Consistent error format
- **Error Mapping**: Domain errors → gRPC errors
- **Validation Errors**: Field-level validation details
- **Error Categorization**: Validation, Business, System

**Error Response Format:**

```typescript
interface ErrorResponse {
  httpStatusCode: number; // HTTP status code
  code: string; // Structured error code
  message: string; // Human-readable message
  details: ErrorDetail[]; // Field-specific errors
}

interface ErrorDetail {
  code: string; // Field-specific error code
  message: string; // Field error message
  field: string; // Field path
  codeParams: string[]; // Parameters for error message
}
```

#### **3. AWS Integration**

**Features:**

- **Roles Anywhere**: Certificate-based authentication
- **Credential Management**: Automatic credential refresh
- **Service Integration**: S3, DynamoDB, EventBridge
- **Configuration**: Environment-based setup

**Services Supported:**

```typescript
// AWS Services configuration
const awsServices = {
  s3: {
    bucketName: config.aws.fileS3BucketName,
    region: config.aws.region,
  },
  dynamodb: {
    region: config.aws.region,
    tables: {
      // Table configurations
    },
  },
  eventbridge: {
    region: config.aws.region,
    eventBusName: 'default',
  },
  cloudfront: {
    distributionId: config.aws.fileCloudfrontDistributionId,
  },
};
```

#### **4. Development Support**

**Features:**

- **Mock Functions**: Testing utilities
- **Proto Generation**: Automated code generation
- **Environment Management**: Configuration utilities
- **Type Safety**: Generated types từ proto

**Testing Utilities:**

```typescript
// Test setup helpers
export function setupTestEnvironment() {
  // Mock AWS services
  jest.mock('@aws-sdk/client-s3');
  jest.mock('@aws-sdk/client-dynamodb');

  // Mock environment variables
  process.env.NODE_ENV = 'test';
  process.env.AWS_ENABLED = 'false';
}

export function createTestMetadata(
  userContext: Partial<UserContext>,
): Metadata {
  const metadata = new Metadata();
  metadata.set('mid-id', userContext.id || 'test-id');
  metadata.set('mid-email', userContext.email || 'test@example.com');
  metadata.set('mid-user_id', userContext.userId || 'test-user-id');
  metadata.set(
    'mid-user_groups',
    JSON.stringify(userContext.userGroups || ['user']),
  );
  return metadata;
}
```

### **🎯 BENEFITS CỦA UTILITY SYSTEM**

#### **1. Consistency**

- **Error Format**: Tất cả errors có cùng structure
- **Authentication**: Unified user context extraction
- **Validation**: Consistent validation error mapping
- **Code Generation**: Automated và consistent proto handling

#### **2. Reusability**

- **Shared Utilities**: Reuse across handlers
- **Common Patterns**: Error handling, validation, auth
- **Type Safety**: Generated types từ proto
- **Cross-Service**: Utilities có thể reuse across services

#### **3. Maintainability**

- **Centralized Logic**: Error handling ở một nơi
- **Clear Separation**: Utilities vs business logic
- **Easy Testing**: Mock-friendly design
- **Documentation**: Well-documented APIs

#### **4. Developer Experience**

- **Auto-generation**: Proto → TypeScript tự động
- **Clear APIs**: Well-defined utility functions
- **Rich Error Info**: Detailed error messages và codes
- **IDE Support**: Full TypeScript support với autocomplete

#### **5. Production Ready**

- **AWS Integration**: Production-ready cloud services
- **Security**: Certificate-based authentication
- **Monitoring**: Structured logging và error tracking
- **Scalability**: Efficient error handling và validation

### **🔧 MAINTENANCE & EXTENSIBILITY**

#### **1. Adding New Utilities**

```typescript
// Example: Adding new utility
export class CacheManager {
  private cache = new Map<string, any>();

  set<T>(key: string, value: T, ttl?: number): void {
    this.cache.set(key, {
      value,
      expires: ttl ? Date.now() + ttl : null,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }
}
```

#### **2. Extending Error System**

```typescript
// Add new error types
export enum CategorySpecificCode {
  INVALID_HIERARCHY = '001',
  CIRCULAR_REFERENCE = '002',
  MAX_DEPTH_EXCEEDED = '003',
}

// Custom error class
export class CategoryHierarchyError extends HTTPError {
  constructor(message: string, code: CategorySpecificCode) {
    super(
      400,
      message,
      errorCodeBuilder(
        SERVICE_PREFIX.QUESTION_SERVICE,
        ENTITY_PREFIXES.CATEGORY,
        ErrorType.BUSINESS,
        code,
      ),
    );
  }
}
```

#### **3. Proto Schema Evolution**

```typescript
// Handle backward compatibility
export interface CategoryV1 {
  id: string;
  name: string;
  parentId?: string;
}

export interface CategoryV2 extends CategoryV1 {
  description?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}

// Migration utilities
export function migrateCategoryV1ToV2(v1: CategoryV1): CategoryV2 {
  return {
    ...v1,
    isActive: true, // Default value
    // description and metadata are optional
  };
}
```

---

## 🎯 **TÓM TẮT UTILITIES & PROTO SYSTEM**

### **📋 Thành phần chính:**

1. **GrpcErrorMapper**: Centralized error handling và mapping
2. **GrpcMetadata**: User authentication và authorization
3. **ValidationErrorMapper**: Structured validation error handling
4. **AWSRolesAnywhereManager**: AWS service authentication
5. **Proto Generation**: Automated TypeScript code generation

### **🔑 Nguyên tắc thiết kế:**

- **Consistency**: Uniform error handling và response format
- **Type Safety**: Strong typing với generated proto interfaces
- **Reusability**: Shared utilities across all handlers
- **Testability**: Mock-friendly design cho easy testing

### **⚡ Lợi ích:**

- **Development Speed**: Automated code generation và utilities
- **Quality**: Consistent error handling và validation
- **Security**: Robust authentication và authorization
- **Maintainability**: Clear separation of concerns
- **Scalability**: Production-ready AWS integration

### **🛡️ Cross-cutting concerns:**

- **Authentication**: gRPC metadata → user context
- **Error Handling**: Domain errors → structured gRPC responses
- **Validation**: class-validator → detailed error messages
- **AWS Integration**: Certificate-based authentication cho cloud services

Utilities và Proto system tạo ra một **solid foundation** cho toàn bộ microservice, đảm bảo **consistency**, **reliability**, và **developer productivity** trong development process.
