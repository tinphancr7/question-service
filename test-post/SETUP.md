# Test Post - Simplified Post Creation Feature

## Overview

This is a simplified version of a "create a post" feature based on the `1test-question-service` structure. It demonstrates clean architecture principles with Domain-Driven Design (DDD) patterns using PostgreSQL and Prisma.

## Architecture

```
test-post/
├── src/
│   ├── core/
│   │   ├── business/
│   │   │   ├── domain/
│   │   │   │   ├── models/
│   │   │   │   │   └── post.model.ts          # Post domain model
│   │   │   │   └── repositories/
│   │   │   │       └── post.repository.ts      # Post repository interface
│   │   │   └── usecases/
│   │   │       └── create-post.usecase.ts      # Create post business logic
│   │   ├── infrastructure/
│   │   │   └── data/
│   │   │       └── postgresql/
│   │   │           ├── datasources/
│   │   │           │   └── postgresql.datasource.ts
│   │   │           ├── mappers/
│   │   │           │   └── post.mapper.ts
│   │   │           ├── repositories/
│   │   │           │   └── post.repository.ts
│   │   │           └── prisma/
│   │   │               └── schema.prisma
│   │   └── types/
│   │       ├── base-classes/
│   │       │   ├── base-model.ts
│   │       │   └── base-use-case.ts
│   │       └── errors/
│   │           └── errors.ts
│   ├── handlers/
│   │   └── post.handler.ts                      # REST API handler
│   ├── config.ts                                # Configuration
│   └── index.ts                                 # Entry point
├── package.json
├── tsconfig.json
├── .env.example
└── SETUP.md (this file)
```

## Step-by-Step Setup

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- pnpm package manager

### Step 1: Initialize the Project

```bash
cd test-post
pnpm install
```

### Step 2: Environment Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update the `.env` file with your database credentials:
```env
NODE_ENV=development
PG_HOST=localhost
PG_PORT=5432
PG_NAME=test_post_db
PG_USER=your_username
PG_PASSWORD=your_password
SERVER_PORT=3000
```

### Step 3: Database Setup

1. Create the PostgreSQL database:
```sql
CREATE DATABASE test_post_db;
```

2. Generate Prisma client:
```bash
pnpm prisma:generate
```

3. Run database migrations:
```bash
pnpm prisma:migrate
```

### Step 4: Development

1. Start the development server:
```bash
pnpm dev
```

2. The server will be available at `http://localhost:3000`

### Step 5: Test the API

Create a new post:
```bash
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Post",
    "content": "This is the content of my first post",
    "authorId": "user-123"
  }'
```

## Key Features Simplified

### Removed from Original Structure:
- gRPC/Protobuf (using REST API instead)
- DynamoDB support
- AWS services (EventBridge, S3)
- Complex error handling and validation
- Legacy utilities
- Multiple environment configurations

### Kept from Original Structure:
- Clean Architecture with DDD
- Domain models with validation
- Use cases for business logic
- Repository pattern
- Infrastructure layer separation
- PostgreSQL with Prisma
- TypeScript with proper typing

## Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build the project
- `pnpm start` - Start production server
- `pnpm test` - Run tests
- `pnpm prisma:generate` - Generate Prisma client
- `pnpm prisma:migrate` - Run database migrations
- `pnpm prisma:studio` - Open Prisma Studio

## Project Structure Explanation

### Domain Layer (`src/core/business/domain/`)
- **Models**: Domain entities with business rules and validation
- **Repositories**: Interfaces defining data access contracts

### Use Cases Layer (`src/core/business/usecases/`)
- Contains business logic and application rules
- Orchestrates domain models and repositories

### Infrastructure Layer (`src/core/infrastructure/`)
- **Datasources**: Database connection management
- **Repositories**: Concrete implementations of repository interfaces
- **Mappers**: Convert between domain models and persistence models

### Handlers Layer (`src/handlers/`)
- REST API endpoints
- Request/response handling
- Integration with use cases

This simplified structure maintains the core principles of clean architecture while being much easier to understand and extend. 