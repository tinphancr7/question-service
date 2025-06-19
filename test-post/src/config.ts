import dotenv from 'dotenv';

interface ServerConfig {
  host: string;
  port: number;
}

interface AppConfig {
  env: 'development' | 'production';
  server: ServerConfig;
  database: {
    url: string;
  };
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

const createConfig = (): AppConfig => {
  dotenv.config();

  const env = getEnv('NODE_ENV', 'development') as AppConfig['env'];
  const host = getEnv('SERVER_HOST', '0.0.0.0');
  const port = getEnvNumber('SERVER_PORT', 3000);

  // Build database URL
  const PG_USER = getEnv('PG_USER');
  const PG_PASSWORD = getEnv('PG_PASSWORD');
  const PG_HOST = getEnv('PG_HOST');
  const PG_PORT = getEnv('PG_PORT');
  const PG_NAME = getEnv('PG_NAME');
  const PG_URL = `postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${PG_NAME}`;

  return {
    env,
    server: {
      host,
      port,
    },
    database: {
      url: PG_URL,
    },
  };
};

export const config = createConfig();

export const validateConfig = (): void => {
  try {
    createConfig();
    console.log('✅ Configuration loaded successfully');
  } catch (error) {
    console.error('❌ Configuration validation failed:', error);
    process.exit(1);
  }
}; 