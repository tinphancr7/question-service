import { Category, CategoryUpdateProps } from '../models';

export type FindAllCategoriesInput = {
  filter?: {
    path?: string[];
    ids?: string[];
    isRoot?: boolean;
  };
  query?: string;
};

export interface ICategoryRepository {
  create(category: Category): Promise<Category>;
  findAll(input: FindAllCategoriesInput): Promise<Array<Category>>;
  findOne(id: string): Promise<Category | null>;
  findOneByName(name: string): Promise<Category | null>;
  update(id: string, props: Partial<CategoryUpdateProps>): Promise<Category>;
  deleteMany(ids: string[]): Promise<void>;
  delete(id: string): Promise<void>;
  validateCategoryPath(path: string[]): Promise<boolean>;
  hasChildren(ids: string[]): Promise<boolean>;
}
