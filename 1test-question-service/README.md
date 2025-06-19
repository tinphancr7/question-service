# 1T Question Service

A gRPC service for managing questions.

## Setup

1. Fetch proto

```bash
git clone https://github.com/TE-System/1test-service-proto-definition proto

cd proto
# git checkout <branch> # switch branch if needed
```

2. Install dependencies:

```bash
pnpm install -r
```

3. Generate TypeScript code from protobuf definitions:

```bash
pnpm gen:proto
```

## Running the Service

Start the gRPC server:

```bash
pnpm start:app
```

For development with auto-restart on file changes:

```bash
pnpm dev:app
```

## Project Structure

- `<root>/proto/`: Contains protobuf service definitions (git clone/pull,...)

- `<root>/app/src/`: Source code
  - `handlers/`: Service implementation handlers
  - `protobuf/`: Generated TypeScript code from protobuf definitions (codegen)
  - `index.ts`: Main server entry point
