import {
  IsArray,
  IsBoolean,
  IsInstance,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Category, ICategoryRepository } from '@/core/business/domain';
import {
  ENTITY_PREFIXES,
  USECASE_INPUT_PREFIXES,
} from '@/core/constants/error-code';
import { BaseUseCase, ProtoOf } from '@/core/types';
import { BadRequestError } from '@/core/types/errors';

export class ListCategoriesFilter {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  readonly path?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  readonly ids?: string[];

  @IsOptional()
  @IsBoolean()
  readonly isRoot?: boolean;

  constructor(data: ProtoOf<ListCategoriesFilter>) {
    Object.assign(this, data);
  }
}

export class ListCategoriesInput {
  @IsOptional()
  @ValidateNested()
  @IsInstance(ListCategoriesFilter)
  readonly filter?: ListCategoriesFilter;

  @IsOptional()
  @IsString()
  readonly query?: string;

  constructor(data: ProtoOf<ListCategoriesInput>) {
    Object.assign(this, data);
  }
}

export class ListCategoriesUseCase extends BaseUseCase<
  ListCategoriesInput,
  Category[]
> {
  constructor(private readonly categoryRepository: ICategoryRepository) {
    super();
  }

  protected getInputPrefix(): string {
    return USECASE_INPUT_PREFIXES.LIST_CATEGORIES;
  }

  protected async execute(input: ListCategoriesInput): Promise<Category[]> {
    const { filter, query } = input;

    const isValidPath = await this.categoryRepository.validateCategoryPath(
      filter?.path || [],
    );
    if (!isValidPath) {
      throw new BadRequestError(
        `Invalid category path: ${filter?.path?.join(' > ')}`,
        null,
        ENTITY_PREFIXES.CATEGORY,
      );
    }

    const categories = await this.categoryRepository.findAll({
      filter,
      query,
    });

    return categories;
  }
}
