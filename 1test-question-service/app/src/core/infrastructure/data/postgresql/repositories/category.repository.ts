import {
  Category,
  CategoryUpdateProps,
  FindAllCategoriesInput,
  ICategoryRepository,
} from '@/core/business/domain';
import { CategoryMapper } from '../mappers';
import { PostgresqlDataSource } from '../datasources';
import { Prisma } from '@/generated/prisma/client';

export class CategoryRepository implements ICategoryRepository {
  constructor(private readonly dataSource: PostgresqlDataSource) {}

  async create(category: Category): Promise<Category> {
    const persistenceCategory = CategoryMapper.toPersistence(category);

    const createdCategory = await this.dataSource.connection.category.create({
      data: persistenceCategory,
    });

    return CategoryMapper.toDomain(createdCategory);
  }

  async findAll(input: FindAllCategoriesInput): Promise<Array<Category>> {
    // Execute query with combined where conditions
    const categories = await this.dataSource.connection.category.findMany({
      where: this.buildWhereConditions(input),
    });

    return categories.map(CategoryMapper.toDomain);
  }

  private buildWhereConditions(
    input: FindAllCategoriesInput,
  ): Prisma.CategoryWhereInput {
    const { filter, query } = input;
    const whereConditions: { AND: Prisma.CategoryWhereInput[] } = {
      AND: [],
    };

    if (query) {
      whereConditions.AND.push({
        name: { contains: query, mode: 'insensitive' },
      });
    }

    if (filter?.ids && filter.ids.length) {
      whereConditions.AND.push({
        id: { in: filter.ids },
      });
    }

    if (filter?.path && filter.path.length) {
      whereConditions.AND.push({
        parentId: filter.path[filter.path.length - 1],
      });
    }

    if (filter?.isRoot) {
      whereConditions.AND.push({
        parentId: null,
      });
    }

    return whereConditions;
  }

  async validateCategoryPath(path: string[]): Promise<boolean> {
    if (path.length === 0) {
      return true;
    }

    // Create segments of parent-child pairs
    const pathSegments: { parentId: string | null; childId: string }[] = path
      .slice(0, -1)
      .map((parentId, index) => ({
        parentId,
        childId: path[index + 1],
      }));

    pathSegments.push({
      parentId: null,
      childId: path[0],
    });

    // Check if all segments exist
    const count = await this.dataSource.connection.category.count({
      where: {
        OR: pathSegments.map((segment) => ({
          parentId: segment.parentId,
          id: segment.childId,
        })),
      },
    });

    // If all segments exist, return true, otherwise return false
    return count === path.length;
  }

  async findOne(id: string): Promise<Category | null> {
    const category = await this.dataSource.connection.category.findUnique({
      where: {
        id,
      },
    });

    return category ? CategoryMapper.toDomain(category) : null;
  }

  async findOneByName(name: string): Promise<Category | null> {
    const category = await this.dataSource.connection.category.findFirst({
      where: {
        name,
      },
    });

    return category ? CategoryMapper.toDomain(category) : null;
  }

  async update(
    id: string,
    props: Partial<CategoryUpdateProps>,
  ): Promise<Category> {
    const updatedCategory = await this.dataSource.connection.category.update({
      where: {
        id,
      },
      data: props,
    });

    return CategoryMapper.toDomain(updatedCategory);
  }

  async deleteMany(ids: string[]): Promise<void> {
    await this.dataSource.connection.category.deleteMany({
      where: {
        id: { in: ids },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.connection.category.delete({
      where: { id },
    });
  }

  async hasChildren(ids: string[]): Promise<boolean> {
    const children = await this.dataSource.connection.category.findMany({
      where: {
        OR: ids.map((id) => ({
          parentId: id,
        })),
      },
      select: { id: true },
    });

    return children.length > 0;
  }
}
