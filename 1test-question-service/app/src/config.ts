import dotenv from 'dotenv';
import { existsSync } from 'fs';

const PROTO_FILES = [
  'common/common.proto',
  'services/question/v1/question.proto',
  'services/question/v1/category.proto',
];

interface ServerConfig {
  host: string;
  port: number;
  address: string;
}

interface ProtoConfig {
  files: string[];
  includeDirs: string[];
  options: {
    keepCase: boolean;
    longs: Function;
    enums: Function;
    defaults: boolean;
    oneofs: boolean;
  };
}

interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
}

interface AWSConfig {
  region: string;
  profileArn?: string;
  roleArn?: string;
  trustAnchorArn?: string;
  certificatePath?: string;
  privateKeyPath?: string;
  credentialHelperPath: string;
  sessionDuration: number;
  profileName: string;
  credentialRefreshMinutes: number;
  enabled: boolean;
  fileS3BucketName: string;
  fileCloudfrontDistributionId: string;
}

interface AppConfig {
  infraEnv: 'dev' | 'prod';
  env: 'development' | 'production';
  server: ServerConfig;
  proto: ProtoConfig;
  logging: LoggingConfig;
  gracefulShutdown: {
    timeout: number; // in milliseconds
  };
  aws: AWSConfig;
}

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

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  return parsed;
};

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true';
};

/**
 * The possible proto dir:
 * - ./proto
 * - ../proto
 *
 * @returns proto dir
 */
const getProtoDir = (): string => {
  if (existsSync('../proto')) {
    return '../proto';
  }

  return './proto';
};

// Load configuration based on environment variables
const createConfig = (): AppConfig => {
  const app_env_path = process.env.APP_ENV_PATH || '.env.prod';

  dotenv.config({ path: ['.env.local', '../.env.local'] });
  dotenv.config({ path: [app_env_path], override: true });

  const env = getEnv('NODE_ENV', 'development') as AppConfig['env'];
  const infraEnv = getEnv('INFRA_ENV', 'dev') as AppConfig['infraEnv'];
  const host = getEnv('SERVER_HOST', '0.0.0.0');
  const port = getEnvNumber('SERVER_PORT', 50051);

  const protoDir = getProtoDir();

  return {
    infraEnv,
    env,
    server: {
      host,
      port,
      address: `${host}:${port}`,
    },
    proto: {
      files: PROTO_FILES,
      includeDirs: [protoDir],
      options: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    },
    logging: {
      level: getEnv(
        'LOG_LEVEL',
        env === 'production' ? 'info' : 'debug',
      ) as LoggingConfig['level'],
      format: getEnv('LOG_FORMAT', 'text') as LoggingConfig['format'],
    },
    gracefulShutdown: {
      timeout: getEnvNumber('SHUTDOWN_TIMEOUT', 5000),
    },
    aws: {
      region: getEnv('AWS_REGION', 'us-east-1'),
      profileArn: process.env.AWS_ROLES_ANYWHERE_PROFILE_ARN,
      roleArn: process.env.AWS_ROLES_ANYWHERE_ROLE_ARN,
      trustAnchorArn: process.env.AWS_ROLES_ANYWHERE_TRUST_ANCHOR_ARN,
      certificatePath: process.env.AWS_CERTIFICATE_PATH,
      privateKeyPath: process.env.AWS_PRIVATE_KEY_PATH,
      credentialHelperPath: getEnv(
        'AWS_CREDENTIAL_HELPER_PATH',
        './tools/aws_signing_helper',
      ),
      sessionDuration: getEnvNumber('AWS_SESSION_DURATION', 3600),
      profileName: getEnv('AWS_PROFILE_NAME', 'roles-anywhere'),
      credentialRefreshMinutes: getEnvNumber(
        'AWS_CREDENTIAL_REFRESH_MINUTES',
        30,
      ),
      enabled: getEnvBoolean('AWS_ROLES_ANYWHERE_ENABLED', false),
      fileS3BucketName: getEnv('FILE_S3_BUCKET_NAME', ''),
      fileCloudfrontDistributionId: getEnv('FILE_CF_DISTRIBUTION_ID', ''),
    },
  };
};

// Create and export the configuration
export const config = createConfig();

// Export types for use in other parts of the application
export type { AppConfig, ServerConfig, ProtoConfig, LoggingConfig, AWSConfig };

// Helper function to validate required environment variables
export const validateConfig = (): void => {
  try {
    createConfig();
    console.log('✅ Configuration loaded successfully');
  } catch (error) {
    console.error('❌ Configuration validation failed:', error);
    process.exit(1);
  }
};

// Development helper to print current configuration
export const printConfig = (): void => {
  if (config.env === 'development') {
    console.log('📋 Current Configuration:');
    console.log(JSON.stringify(config, null, 2));
  }
};
