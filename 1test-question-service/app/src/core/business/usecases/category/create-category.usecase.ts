import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Category, ICategoryRepository } from '@/core/business/domain';
import {
  ENTITY_PREFIXES,
  USECASE_INPUT_PREFIXES,
} from '@/core/constants/error-code';
import { BaseUseCase, ProtoOf } from '@/core/types';
import { AlreadyExistsError, NotFoundError } from '@/core/types/errors';

export class CreateCategoryInput {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsUUID('4')
  @IsOptional()
  readonly parentId: string | null;

  constructor(data: ProtoOf<CreateCategoryInput>) {
    Object.assign(this, data);
  }
}

export class CreateCategoryUseCase extends BaseUseCase<
  CreateCategoryInput,
  Category
> {
  constructor(private readonly categoryRepository: ICategoryRepository) {
    super();
  }

  protected getInputPrefix(): string {
    return USECASE_INPUT_PREFIXES.CREATE_CATEGORY;
  }

  protected async execute(input: CreateCategoryInput): Promise<Category> {
    const { name, parentId } = input;

    const conflictCategory = await this.categoryRepository.findOneByName(name);
    if (conflictCategory) {
      throw new AlreadyExistsError(
        `Category with name '${name}' already exists`,
        null,
        ENTITY_PREFIXES.CATEGORY,
      );
    }

    if (parentId) {
      const parentCategory = await this.categoryRepository.findOne(parentId);
      if (!parentCategory) {
        throw new NotFoundError(
          `Parent category with id '${parentId}' not found`,
          null,
          ENTITY_PREFIXES.CATEGORY,
        );
      }
    }

    const category = new Category({
      name,
      parentId,
    });

    const createdCategory = await this.categoryRepository.create(category);
    return createdCategory;
  }
}
