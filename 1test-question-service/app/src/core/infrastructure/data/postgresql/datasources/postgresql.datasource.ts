import { PrismaClient } from '@/generated/prisma/client';
import { getEnv } from '@/config';

export class PostgresqlDataSource {
  private readonly prisma: PrismaClient;

  constructor() {
    const PG_URL = this.getDatabaseUrl();

    this.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
      datasources: {
        db: {
          url: PG_URL,
        },
      },
    });
  }

  private getDatabaseUrl(): string {
    const PG_USER = getEnv('PG_USER');
    const PG_PASSWORD = getEnv('PG_PASSWORD');
    const PG_HOST = getEnv('PG_HOST');
    const PG_PORT = getEnv('PG_PORT');
    const PG_NAME = getEnv('PG_NAME');

    // Ideally, connection limit should be calculated based on the number of instances and pods.
    // But those values may change and connection limit may easily be forgotten,
    // so use fixed value from env is easier to manage.
    const PG_CONNECTION_LIMIT = getEnv('PG_CONNECTION_LIMIT');

    const POOL_TIMEOUT = 30;
    const PG_URL = `postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${PG_NAME}?connection_limit=${PG_CONNECTION_LIMIT}&pool_timeout=${POOL_TIMEOUT}`;

    return PG_URL;
  }

  get connection(): PrismaClient {
    return this.prisma;
  }

  async connect(): Promise<void> {
    return this.prisma.$connect();
  }

  async disconnect(): Promise<void> {
    return this.prisma.$disconnect();
  }

  async transaction<T>(
    fn: (
      prisma: Omit<
        PrismaClient,
        | '$connect'
        | '$disconnect'
        | '$on'
        | '$transaction'
        | '$use'
        | '$extends'
      >,
    ) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(
      (
        prisma: Omit<
          PrismaClient,
          | '$connect'
          | '$disconnect'
          | '$on'
          | '$transaction'
          | '$use'
          | '$extends'
        >,
      ) => {
        return fn(prisma);
      },
    );
  }
}
