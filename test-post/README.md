# Test Post - Simplified Post Creation Feature

A simplified post creation service built with clean architecture principles, inspired by the `1test-question-service` structure.

## 🏗️ Architecture

This project follows Domain-Driven Design (DDD) and Clean Architecture principles:

- **Domain Layer**: Business entities and repository interfaces
- **Use Cases Layer**: Application business logic
- **Infrastructure Layer**: Database implementations and external services
- **Handlers Layer**: REST API endpoints

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+)
- PostgreSQL
- pnpm

### Installation

1. **Clone and setup**
   ```bash
   cd test-post
   pnpm install
   ```

2. **Environment Configuration**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials
   ```

3. **Database Setup**
   ```bash
   # Create database
   createdb test_post_db
   
   # Generate Prisma client
   pnpm prisma:generate
   
   # Run migrations
   pnpm prisma:migrate
   ```

4. **Start Development Server**
   ```bash
   pnpm dev
   ```

## 📋 API Endpoints

### Create Post
```bash
POST /posts
Content-Type: application/json

{
  "title": "My First Post",
  "content": "This is the content of my first post",
  "authorId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Get Post
```bash
GET /posts/:id
```

### Get Posts by Author
```bash
GET /authors/:authorId/posts
```

### Health Check
```bash
GET /health
```

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Run tests in watch mode
pnpm test:watch
```

## 🛠️ Development

```bash
# Start development server
pnpm dev

# Build project
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint

# Format code
pnpm format

# Open Prisma Studio
pnpm prisma:studio
```

## 📁 Project Structure

```
test-post/
├── src/
│   ├── core/
│   │   ├── business/
│   │   │   ├── domain/           # Domain models and interfaces
│   │   │   └── usecases/         # Business logic
│   │   ├── infrastructure/       # Database and external services
│   │   └── types/               # Base classes and types
│   ├── handlers/                # API endpoints
│   ├── config.ts               # Configuration
│   └── index.ts                # Application entry point
├── package.json
├── tsconfig.json
└── README.md
```

## 🔄 Simplified from Original

### Removed Components:
- gRPC/Protobuf (replaced with REST API)
- DynamoDB support
- AWS services (EventBridge, S3)
- Complex error handling
- Legacy utilities
- Multi-environment configurations

### Kept Components:
- Clean Architecture patterns
- Domain-Driven Design
- TypeScript with strict typing
- Prisma ORM with PostgreSQL
- Comprehensive validation
- Unit testing setup

## 🌟 Key Features

- **Clean Architecture**: Separation of concerns with clear layers
- **Domain-Driven Design**: Rich domain models with business logic
- **Type Safety**: Full TypeScript support with strict mode
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Jest setup with example tests
- **Validation**: Input validation using class-validator
- **REST API**: Simple Express.js server
- **Development Tools**: ESLint, Prettier, and hot reload

## 📝 Environment Variables

```bash
# Required
NODE_ENV=development
PG_HOST=localhost
PG_PORT=5432
PG_NAME=test_post_db
PG_USER=your_username
PG_PASSWORD=your_password

# Optional
SERVER_PORT=3000
SERVER_HOST=0.0.0.0
```

## 🤝 Contributing

This is a simplified example project. Feel free to extend it with additional features like:

- User authentication
- Post categories/tags
- Comments system
- File uploads
- Pagination
- Full CRUD operations

## 📄 License

ISC 