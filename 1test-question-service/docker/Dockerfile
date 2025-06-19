# Multi-stage Dockerfile for gRPC Service Application

# Stage 1: Base image with pnpm
FROM node:22-alpine AS base
RUN npm install -g pnpm@10.7.1
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY app/package.json ./app/
# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 3: Proto generation and build
FROM deps AS builder
# Copy source code
COPY . .
# Generate protobuf files
RUN pnpm gen:proto
# Generate Prisma client
RUN pnpm prisma:generate:app
# Build the application
RUN pnpm build:app

# Stage 4: AWS Credential Helper
FROM alpine:latest AS aws-tools
RUN apk add --no-cache wget
WORKDIR /tools

ENV AWS_SIGNING_HELPER_VERSION=1.6.0
# Download AWS credential helper (version 1.6.0)
RUN wget https://rolesanywhere.amazonaws.com/releases/${AWS_SIGNING_HELPER_VERSION}/X86_64/Linux/aws_signing_helper -O aws_signing_helper && \
    chmod +x aws_signing_helper

# Stage 5: Production image
FROM node:22-alpine AS production
# Install dumb-init and glibc compatibility for AWS signing helper
RUN apk add --no-cache dumb-init gcompat

# Install pnpm in production image
RUN npm install -g pnpm@10.7.1

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S grpc -u 1001

WORKDIR /app

# Copy package files for production install
COPY --from=builder --chown=grpc:nodejs /app/package.json ./package.json
COPY --from=builder --chown=grpc:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder --chown=grpc:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder --chown=grpc:nodejs /app/app/package.json ./app/package.json

# Install only production dependencies
ENV HUSKY=0
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Copy built application
COPY --from=builder --chown=grpc:nodejs /app/app/dist ./app/dist

# Copy generated Prisma client (needed at runtime)
COPY --from=builder --chown=grpc:nodejs /app/app/src/generated ./app/src/generated

# Copy proto files (needed at runtime)
COPY --from=builder --chown=grpc:nodejs /app/proto ./proto

# Copy AWS credential helper
COPY --from=aws-tools --chown=grpc:nodejs /tools/aws_signing_helper ./tools/aws_signing_helper

# Create tools directory and set permissions
RUN mkdir -p ./tools && \
    chown -R grpc:nodejs ./tools && \
    chmod +x ./tools/aws_signing_helper

# Set environment variables
ENV NODE_ENV=production \
    SERVER_HOST=0.0.0.0 \
    SERVER_PORT=50051

# Expose the gRPC port
EXPOSE 50051

# Health check for gRPC service
# TODO
# HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
#     CMD node -e "const grpc = require('@grpc/grpc-js'); const client = new grpc.Client('localhost:50051', grpc.credentials.createInsecure()); client.close();" || exit 1

# Switch to non-root user
USER grpc

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "app/dist/index.js"]