# Luồng Hoạt Động của Handler - 1Test Question Service

## 🔄 **LUỒNG HOẠT ĐỘNG CỦA HANDLER**

### **1. TỔNG QUAN CẤU TRÚC HANDLER**

Dự án sử dụng **gRPC** làm giao thức communication, và handlers được tổ chức theo mô hình layered architecture:

```text
handlers/
├── index.ts (export tất cả services)
├── services.ts (tập hợp tất cả proto packages)
└── v1/ (version 1 của API)
    └── category/
        ├── handler.ts (logic xử lý gRPC)
        └── mapper.ts (chuyển đổi data)
```

### **2. LUỒNG HOẠT ĐỘNG CHI TIẾT**

#### **Bước 1: Client gửi gRPC Request**

```text
Client → gRPC Server → CategoryHandler.createCategory()
```

#### **Bước 2: Handler nhận request**

```typescript
// Trong handler.ts
createCategory(call, callback) {
  GrpcErrorMapper.handle(callback, () => {
    // Xử lý logic
  });
}
```

**Giải thích:**

- `call`: Chứa gRPC request data từ client
- `callback`: Function để trả response về client
- `GrpcErrorMapper.handle()`: Wrapper để xử lý errors tự động

#### **Bước 3: Chuyển đổi dữ liệu (Data Mapping)**

```typescript
// Sử dụng ProtoMapper để convert
const input = ProtoMapper.toCreateCategoryInput(call.request);
// Proto Request → Domain Input Object
```

**Tại sao cần mapping:**

- Proto messages có format khác với Domain objects
- Domain objects có validation và business rules
- Tách biệt giao thức gRPC khỏi business logic

#### **Bước 4: Khởi tạo Use Case**

```typescript
const usecase = new CreateCategoryUseCase(
  registry.postgresql.categoryRepository, // Dependency injection
);
```

**Dependency Injection Pattern:**

- Handler không tạo trực tiếp repository
- Sử dụng registry để quản lý dependencies
- Dễ dàng testing và mocking

#### **Bước 5: Thực thi Use Case**

```typescript
const executed = usecase.handle(input);
```

**Business Logic Layer:**

- Use case chứa toàn bộ business logic
- Validation rules
- Data transformation
- Repository calls

#### **Bước 6: Xử lý kết quả**

```typescript
executed
  .then((category) => {
    callback(null, {
      data: category.toJSON(), // Domain Object → JSON
    });
  })
  .catch((error) => {
    callback(null, {
      error: GrpcErrorMapper.toGrpcError(error), // Error mapping
    });
  });
```

**Response Handling:**

- Success case: Convert domain object to JSON
- Error case: Map domain errors to gRPC errors
- Consistent response format

### **3. CÁC THÀNH PHẦN QUAN TRỌNG**

#### **A. GrpcErrorMapper**

**Mục đích:** Xử lý error và convert thành gRPC error format

**Tại sao cần:**

- Đảm bảo errors được trả về đúng format gRPC
- Consistent error handling across all handlers
- Security: Không expose internal error details

**Cách hoạt động:**

```typescript
GrpcErrorMapper.handle(callback, () => {
  // Business logic
  // Nếu có exception → tự động catch và convert
});
```

#### **B. ProtoMapper**

**Mục đích:** Chuyển đổi giữa Proto messages và Domain objects

**Các phương thức:**

- `toCreateCategoryInput()`: Proto Request → Domain Input
- `toUpdateCategoryInput()`: Proto Request → Domain Input
- `toListCategoriesInput()`: Proto Request → Domain Input
- `toDeleteCategoryInput()`: Proto Request → Domain Input
- `toDeleteCategoriesInput()`: Proto Request → Domain Input

**Ví dụ cụ thể:**

```typescript
static toCreateCategoryInput(
  request: CreateCategoryRequest,
): CreateCategoryInput {
  return new CreateCategoryInput({
    name: request.name,
    parentId: request.parentId ?? null, // Handle optional fields
  });
}
```

#### **C. Registry Pattern**

**Mục đích:** Dependency injection container

**Lợi ích:**

- Singleton pattern cho shared resources
- Centralized dependency management
- Easy testing với mock dependencies
- Lazy initialization

**Cách sử dụng:**

```typescript
// Trong handler
const usecase = new CreateCategoryUseCase(
  registry.postgresql.categoryRepository,
);
```

### **4. FLOW DIAGRAM**

```text
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Client    │───▶│   Handler    │───▶│   Mapper    │
│ (gRPC call) │    │ (validation) │    │ (convert)   │
└─────────────┘    └──────────────┘    └─────────────┘
                            │                   │
                            ▼                   ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Response   │◀───│   Use Case   │◀───│   Domain    │
│ (callback)  │    │ (business)   │    │   Input     │
└─────────────┘    └──────────────┘    └─────────────┘
                            │
                            ▼
                   ┌─────────────┐
                   │ Repository  │
                   │ (database)  │
                   └─────────────┘
```

### **5. CHI TIẾT CÁC HANDLER METHODS**

#### **A. createCategory**

**Luồng hoạt động:**

1. Nhận `CreateCategoryRequest` từ client
2. Map sang `CreateCategoryInput`
3. Tạo `CreateCategoryUseCase` với repository
4. Execute use case
5. Convert result sang JSON response

**Code flow:**

```typescript
createCategory(call, callback) {
  GrpcErrorMapper.handle(callback, () => {
    // Step 1: Get usecase with dependency
    const usecase = new CreateCategoryUseCase(
      registry.postgresql.categoryRepository,
    );

    // Step 2: Map proto request to domain input
    const executed = usecase.handle(
      ProtoMapper.toCreateCategoryInput(call.request),
    );

    // Step 3: Handle async result
    executed
      .then((category) => {
        callback(null, {
          data: category.toJSON(),
        });
      })
      .catch((error) => {
        callback(null, {
          error: GrpcErrorMapper.toGrpcError(error as Error),
        });
      });
  });
}
```

#### **B. updateCategory**

**Khác biệt với createCategory:**

- Cần ID để identify category cần update
- Validation rules khác (category phải tồn tại)
- Use case khác nhau

#### **C. listCategories**

**Đặc điểm:**

- Trả về array của categories
- Có thể có filtering và pagination
- Response format khác (có `items` array)

```typescript
callback(null, {
  data: {
    items: categories.map((category) => category.toJSON()),
  },
});
```

#### **D. deleteCategory & deleteCategories**

**Khác biệt:**

- `deleteCategory`: Xóa một category
- `deleteCategories`: Xóa nhiều categories (bulk operation)

### **6. PATTERN VÀ BEST PRACTICES**

#### **Error Handling Pattern**

```typescript
GrpcErrorMapper.handle(callback, () => {
  // Logic xử lý
  // Nếu có lỗi throw, GrpcErrorMapper sẽ tự động catch và convert
});
```

**Lợi ích:**

- Consistent error format
- Automatic error logging
- Security (không expose internal errors)

#### **Async/Promise Pattern**

```typescript
usecase
  .handle(input)
  .then((success) => callback(null, { data: success }))
  .catch((error) => callback(null, { error: mappedError }));
```

**Tại sao sử dụng Promise:**

- Database operations are async
- Non-blocking I/O
- Better error propagation

#### **Dependency Injection Pattern**

```typescript
// Handler không tạo trực tiếp repository
// Mà nhận từ registry (IoC Container)
const usecase = new CreateCategoryUseCase(
  registry.postgresql.categoryRepository,
);
```

**Lợi ích:**

- Loose coupling
- Easy testing
- Centralized configuration
- Singleton management

### **7. TÁCH BIỆT TRÁCH NHIỆM (SEPARATION OF CONCERNS)**

#### **Handler Layer:**

- **Trách nhiệm:** gRPC protocol handling
- **Không làm:** Business logic, data validation
- **Chỉ làm:** Request/response mapping, error handling

#### **Mapper Layer:**

- **Trách nhiệm:** Data transformation
- **Chuyển đổi:** Proto ↔ Domain objects
- **Validation:** Basic format validation

#### **Use Case Layer:**

- **Trách nhiệm:** Business logic chính
- **Validation:** Business rules
- **Orchestration:** Coordinate repository calls

#### **Repository Layer:**

- **Trách nhiệm:** Data access
- **Abstraction:** Hide database implementation details

### **8. VERSIONING STRATEGY**

Dự án hỗ trợ versioning thông qua folder structure:

```text
handlers/
├── v1/
│   └── category/    ← Version 1 của Category API
└── v2/              ← Có thể có Version 2 trong tương lai
    └── category/
```

**Lợi ích:**

- Backward compatibility
- Gradual migration
- Multiple API versions cùng lúc

### **9. PERFORMANCE CONSIDERATIONS**

#### **A. Connection Pooling**

- Registry quản lý database connections
- Reuse connections across requests
- Avoid connection overhead

#### **B. Error Caching**

- GrpcErrorMapper cache common errors
- Reduce error object creation overhead

#### **C. Lazy Loading**

- Registry initialize dependencies on-demand
- Reduce startup time

### **10. TESTING STRATEGY**

#### **Unit Testing Handlers:**

```typescript
// Mock dependencies
const mockRepository = {
  create: jest.fn(),
  findById: jest.fn(),
};

// Inject mock vào registry
registry.postgresql.categoryRepository = mockRepository;

// Test handler methods
```

#### **Integration Testing:**

- Test full flow từ gRPC request đến database
- Use test database
- Verify data persistence

### **11. MONITORING VÀ DEBUGGING**

#### **Logging:**

- Request/response logging trong handler
- Error logging trong GrpcErrorMapper
- Performance metrics

#### **Tracing:**

- Request ID để track flow
- Database query tracing
- Error stack traces

---

**Tóm lại:** Handler đóng vai trò như **Gateway Layer**, nhận requests từ clients, validate, chuyển đổi dữ liệu, gọi business logic, và trả về responses. Nó tuân thủ Clean Architecture với việc tách biệt rõ ràng các concerns, đảm bảo code dễ maintain, test và scale.
