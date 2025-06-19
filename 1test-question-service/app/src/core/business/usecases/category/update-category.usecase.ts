import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Category, ICategoryRepository } from '@/core/business/domain';
import {
  ENTITY_PREFIXES,
  USECASE_INPUT_PREFIXES,
} from '@/core/constants/error-code';
import { BaseUseCase, ProtoOf } from '@/core/types';
import { NotFoundError } from '@/core/types/errors';

export class UpdateCategoryInput {
  @IsUUID('4')
  @IsNotEmpty()
  readonly id: string;

  @IsString()
  @IsNotEmpty()
  readonly name: string;

  constructor(data: ProtoOf<UpdateCategoryInput>) {
    Object.assign(this, data);
  }
}

export class UpdateCategoryUseCase extends BaseUseCase<
  UpdateCategoryInput,
  Category
> {
  constructor(private readonly categoryRepository: ICategoryRepository) {
    super();
  }

  protected getInputPrefix(): string {
    return USECASE_INPUT_PREFIXES.UPDATE_CATEGORY;
  }

  protected async execute(input: UpdateCategoryInput): Promise<Category> {
    const { id, name } = input;

    const foundCategory = await this.categoryRepository.findOne(id);
    if (!foundCategory) {
      throw new NotFoundError(
        `Category with id '${id}' not found`,
        null,
        ENTITY_PREFIXES.CATEGORY,
      );
    }

    foundCategory.update({ name });

    const updatedCategory = await this.categoryRepository.update(id, {
      name,
    });
    return updatedCategory;
  }
}
