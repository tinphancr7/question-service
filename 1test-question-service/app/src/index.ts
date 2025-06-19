import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { ReflectionService } from '@grpc/reflection';
import 'module-alias/register';

import { config, printConfig, validateConfig } from '@/config';
import { AWSRolesAnywhereManager } from '@/core/utils/aws-creds';
import { protoPackages } from '@/handlers';
import { registry } from '@/registry';

// Validate configuration on startup
validateConfig();

// Print configuration in development
printConfig();

// Initialize AWS service
const awsService = new AWSRolesAnywhereManager();

// Initialize registry
registry.initialize();

const packageDefinition = protoLoader.loadSync(config.proto.files, {
  ...config.proto.options,
  includeDirs: config.proto.includeDirs,
});

// Create a new gRPC server
const server = new grpc.Server();

protoPackages.forEach((protoPackage) => {
  server.addService(protoPackage.Definition, protoPackage.Handler);
});

const reflection = new ReflectionService(packageDefinition);

reflection.addToServer(server);

// Initialize AWS before starting the server
async function initializeServices() {
  try {
    // Initialize AWS Roles Anywhere
    await awsService.startCredentialServer();

    // Optional: Test credential functionality
    if (config.aws.enabled) {
      console.log('📊 AWS Service Status:', awsService.getStatus());
    }
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    if (config.aws.enabled) {
      // If AWS is required, exit on failure
      process.exit(1);
    }
  }
}

// Start the server
async function startServer() {
  // Initialize services first
  await initializeServices();

  server.bindAsync(
    config.server.address,
    grpc.ServerCredentials.createInsecure(),
    (error) => {
      if (error) {
        console.error('Failed to bind server:', error);
        process.exit(1);
      }

      console.log(`gRPC server running at ${config.server.address}`);
    },
  );
}

// Handle graceful shutdown with timeout
const shutdown = async () => {
  console.log('Shutting down gRPC server...');

  const shutdownTimer = setTimeout(() => {
    console.log('Force shutdown after timeout');
    process.exit(1);
  }, config.gracefulShutdown.timeout);

  // Cleanup AWS services
  try {
    await awsService.stopAllProcesses();
  } catch (error) {
    console.error('Error during AWS cleanup:', error);
  }

  server.tryShutdown(() => {
    clearTimeout(shutdownTimer);
    console.log('Server successfully shutdown');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the application
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
