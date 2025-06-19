import 'reflect-metadata';

import {
  CreateCategoryUseCase,
  DeleteCategoriesUseCase,
  DeleteCategoryUseCase,
  ListCategoriesUseCase,
  UpdateCategoryUseCase,
} from '@/core/business/usecases';
import { ProtoPackage } from '@/core/types';
import { GrpcErrorMapper } from '@/core/utils/grpc-error-mapper';
import {
  CategoryServiceServer,
  CategoryServiceService,
} from '@/protobuf/services/question/v1/category';
import { registry } from '@/registry';
import { ProtoMapper } from './mapper';

const CategoryHandler: CategoryServiceServer = {
  createCategory(call, callback) {
    GrpcErrorMapper.handle(callback, () => {
      const usecase = new CreateCategoryUseCase(
        registry.postgresql.categoryRepository,
      );

      const executed = usecase.handle(
        ProtoMapper.toCreateCategoryInput(call.request),
      );

      executed
        .then((category) => {
          callback(null, {
            data: category.toJSON(),
          });
        })
        .catch((error) => {
          callback(null, {
            error: GrpcErrorMapper.toGrpcError(error as Error),
          });
        });
    });
  },

  updateCategory(call, callback) {
    GrpcErrorMapper.handle(callback, () => {
      const usecase = new UpdateCategoryUseCase(
        registry.postgresql.categoryRepository,
      );

      const executed = usecase.handle(
        ProtoMapper.toUpdateCategoryInput(call.request),
      );

      executed
        .then((category) => {
          callback(null, {
            data: category.toJSON(),
          });
        })
        .catch((error) => {
          callback(null, {
            error: GrpcErrorMapper.toGrpcError(error as Error),
          });
        });
    });
  },

  deleteCategory(call, callback) {
    GrpcErrorMapper.handle(callback, () => {
      const usecase = new DeleteCategoryUseCase(
        registry.postgresql.categoryRepository,
      );

      const executed = usecase.handle(
        ProtoMapper.toDeleteCategoryInput(call.request),
      );

      executed
        .then((category) => {
          callback(null, {
            data: category.toJSON(),
          });
        })
        .catch((error) => {
          callback(null, {
            error: GrpcErrorMapper.toGrpcError(error as Error),
          });
        });
    });
  },

  deleteCategories(call, callback) {
    GrpcErrorMapper.handle(callback, () => {
      const usecase = new DeleteCategoriesUseCase(
        registry.postgresql.categoryRepository,
      );

      const executed = usecase.handle(
        ProtoMapper.toDeleteCategoriesInput(call.request),
      );

      executed
        .then((result) => {
          callback(null, {
            data: result,
          });
        })
        .catch((error) => {
          callback(null, {
            error: GrpcErrorMapper.toGrpcError(error as Error),
          });
        });
    });
  },

  listCategories(call, callback) {
    GrpcErrorMapper.handle(callback, () => {
      const usecase = new ListCategoriesUseCase(
        registry.postgresql.categoryRepository,
      );

      const executed = usecase.handle(
        ProtoMapper.toListCategoriesInput(call.request),
      );

      executed
        .then((categories) => {
          callback(null, {
            data: {
              items: categories.map((category) => category.toJSON()),
            },
          });
        })
        .catch((error) => {
          callback(null, {
            error: GrpcErrorMapper.toGrpcError(error as Error),
          });
        });
    });
  },
};

export const CategoryServicePackage: ProtoPackage = {
  Handler: CategoryHandler,
  Definition: CategoryServiceService,
};
