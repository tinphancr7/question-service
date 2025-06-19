import { IsNotEmpty, IsUUID } from 'class-validator';
import { Category, ICategoryRepository } from '@/core/business/domain';
import {
  ENTITY_PREFIXES,
  USECASE_INPUT_PREFIXES,
} from '@/core/constants/error-code';
import { BaseUseCase, ProtoOf } from '@/core/types';
import { BadRequestError, NotFoundError } from '@/core/types/errors';

export class DeleteCategoryInput {
  @IsUUID('4')
  @IsNotEmpty()
  readonly id: string;

  constructor(data: ProtoOf<DeleteCategoryInput>) {
    Object.assign(this, data);
  }
}

export class DeleteCategoryUseCase extends BaseUseCase<
  DeleteCategoryInput,
  Category
> {
  constructor(private readonly categoryRepository: ICategoryRepository) {
    super();
  }

  protected getInputPrefix(): string {
    return USECASE_INPUT_PREFIXES.DELETE_CATEGORY;
  }

  protected async execute(input: DeleteCategoryInput): Promise<Category> {
    const { id } = input;

    const foundCategory = await this.categoryRepository.findOne(id);
    if (!foundCategory) {
      throw new NotFoundError(
        `Category with id '${id}' not found`,
        null,
        ENTITY_PREFIXES.CATEGORY,
      );
    }

    const hasChildren = await this.categoryRepository.hasChildren([id]);
    if (hasChildren) {
      throw new BadRequestError(
        `Category with id '${id}' has children`,
        null,
        ENTITY_PREFIXES.CATEGORY,
      );
    }

    await this.categoryRepository.delete(id);
    return foundCategory;
  }
}
