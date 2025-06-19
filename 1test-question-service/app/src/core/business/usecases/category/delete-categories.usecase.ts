import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';
import { ICategoryRepository } from '@/core/business/domain';
import {
  ENTITY_PREFIXES,
  USECASE_INPUT_PREFIXES,
} from '@/core/constants/error-code';
import { BaseUseCase, ProtoOf } from '@/core/types';
import { BadRequestError, NotFoundError } from '@/core/types/errors';

export class DeleteCategoriesInput {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  readonly ids: string[];

  constructor(data: ProtoOf<DeleteCategoriesInput>) {
    Object.assign(this, data);
  }
}

export class DeleteCategoriesUseCase extends BaseUseCase<
  DeleteCategoriesInput,
  boolean
> {
  constructor(private readonly categoryRepository: ICategoryRepository) {
    super();
  }

  protected getInputPrefix(): string {
    return USECASE_INPUT_PREFIXES.DELETE_CATEGORY;
  }

  protected async execute(input: DeleteCategoriesInput): Promise<boolean> {
    const { ids } = input;

    const foundCategories = await this.categoryRepository.findAll({
      filter: {
        ids,
      },
    });

    if (foundCategories.length !== ids.length) {
      const foundIds = foundCategories.map((category) => category.id);
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      throw new NotFoundError(
        `Category with id ${notFoundIds.join(', ')} not found`,
        null,
        ENTITY_PREFIXES.CATEGORY,
      );
    }

    const hasChildren = await this.categoryRepository.hasChildren(ids);
    if (hasChildren) {
      throw new BadRequestError(
        `There are ids that have children, delete the children first`,
        null,
        ENTITY_PREFIXES.CATEGORY,
      );
    }

    await this.categoryRepository.deleteMany(ids);

    return true;
  }
}
