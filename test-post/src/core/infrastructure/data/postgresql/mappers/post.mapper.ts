import { Post, Post as DomainPost } from '@/core/business/domain';
import { Post as PersistencePost } from '@/generated/prisma/client';

export class PostMapper {
  static toDomain(persistenceModel: PersistencePost): DomainPost {
    return new Post({
      id: persistenceModel.id,
      title: persistenceModel.title,
      content: persistenceModel.content,
      authorId: persistenceModel.authorId,
      createdAt: persistenceModel.createdAt.toISOString(),
      updatedAt: persistenceModel.updatedAt.toISOString(),
    });
  }

  static toPersistence(domainModel: DomainPost): Omit<PersistencePost, 'createdAt' | 'updatedAt'> & { createdAt: Date; updatedAt: Date } {
    return {
      id: domainModel.id,
      title: domainModel.title,
      content: domainModel.content,
      authorId: domainModel.authorId,
      createdAt: new Date(domainModel.createdAt),
      updatedAt: new Date(domainModel.updatedAt),
    };
  }
} 