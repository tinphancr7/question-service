import { ICategoryRepository } from '@/core/business/domain';
import {
  CategoryRepository,
  PostgresqlDataSource,
} from './core/infrastructure/data/postgresql';

export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private _initialized = false;

  // Repository singletons
  private _categoryRepository!: ICategoryRepository;

  private constructor() {}

  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  initialize(): void {
    if (this._initialized) {
      console.log('🔄 Service registry already initialized');
      return;
    }

    console.log('🚀 Initializing service registry...');

    try {
      // Initialize datasource
      const postgresqlDataSource = new PostgresqlDataSource();

      // Initialize repositories
      this._categoryRepository = new CategoryRepository(postgresqlDataSource);

      this._initialized = true;
      console.log('✅ Service registry initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize service registry:', error);
      throw error;
    }
  }

  get dynamodb() {
    this.ensureInitialized();
    return {};
  }

  get postgresql() {
    this.ensureInitialized();
    return {
      categoryRepository: this._categoryRepository,
    };
  }

  private ensureInitialized(): void {
    if (!this._initialized) {
      throw new Error(
        'Service registry not initialized. Call initialize() first.',
      );
    }
  }

  cleanup(): void {
    console.log('🧹 Cleaning up service registry...');
    this._initialized = false;
  }

  get isInitialized(): boolean {
    return this._initialized;
  }
}

export const registry = ServiceRegistry.getInstance();
