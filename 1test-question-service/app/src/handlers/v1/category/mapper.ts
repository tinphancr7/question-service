import {
  CreateCategoryInput,
  DeleteCategoriesInput,
  DeleteCategoryInput,
  ListCategoriesFilter,
  ListCategoriesInput,
  UpdateCategoryInput,
} from '@/core/business/usecases';
import {
  CreateCategoryRequest,
  DeleteCategoriesRequest,
  DeleteCategoryRequest,
  ListCategoriesRequest,
  UpdateCategoryRequest,
} from '@/protobuf/services/question/v1/category';

export class ProtoMapper {
  static toCreateCategoryInput(
    request: CreateCategoryRequest,
  ): CreateCategoryInput {
    return new CreateCategoryInput({
      name: request.name,
      parentId: request.parentId ?? null,
    });
  }

  static toUpdateCategoryInput(
    request: UpdateCategoryRequest,
  ): UpdateCategoryInput {
    return new UpdateCategoryInput({
      id: request.id,
      name: request.name,
    });
  }

  static toListCategoriesInput(
    request: ListCategoriesRequest,
  ): ListCategoriesInput {
    return new ListCategoriesInput({
      filter: request.filter
        ? new ListCategoriesFilter(request.filter)
        : undefined,
      query: request.query,
    });
  }

  static toDeleteCategoryInput(
    request: DeleteCategoryRequest,
  ): DeleteCategoryInput {
    return new DeleteCategoryInput({
      id: request.id,
    });
  }

  static toDeleteCategoriesInput(
    request: DeleteCategoriesRequest,
  ): DeleteCategoriesInput {
    return new DeleteCategoriesInput({ ids: request.ids });
  }
}
