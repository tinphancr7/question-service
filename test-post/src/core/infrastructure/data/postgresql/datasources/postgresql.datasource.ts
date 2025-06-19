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

    const PG_URL = `postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${PG_NAME}`;
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
} 