import { Category, Category as DomainCategory } from '@/core/business/domain';
import { Category as PersistenceCategory } from '@/generated/prisma/client';

export class CategoryMapper {
  static toDomain(persistenceModel: PersistenceCategory): DomainCategory {
    return new Category({
      id: persistenceModel.id,
      name: persistenceModel.name,
      parentId: persistenceModel.parentId,
      createdAt: persistenceModel.createdAt.toISOString(),
      updatedAt: persistenceModel.updatedAt.toISOString(),
    });
  }

  static toPersistence(domainModel: DomainCategory): PersistenceCategory {
    return {
      id: domainModel.id,
      name: domainModel.name,
      parentId: domainModel.parentId,
      createdAt: new Date(domainModel.createdAt),
      updatedAt: new Date(domainModel.updatedAt),
    };
  }
}
