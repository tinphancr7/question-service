import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { v4 } from 'uuid';
import { ENTITY_PREFIXES } from '@/core/constants/error-code';
import { BaseModel } from '@/core/types/base-classes';

export interface CategoryProto {
  id?: string;
  name: string;
  parentId: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryProps {
  id: string;
  name: string;
  parentId: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export type CategoryUpdateProps = {
  [K in keyof Omit<CategoryProps, 'id' | 'createdAt'>]: CategoryProps[K];
};

export class Category extends BaseModel {
  @IsUUID('4')
  private _id: string;

  @IsString()
  private _name: string;

  @IsUUID('4')
  @IsOptional()
  private _parentId: string | null;

  @IsDateString()
  private _createdAt: string;

  @IsDateString()
  private _updatedAt: string;

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  get parentId() {
    return this._parentId;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  private set name(name: string) {
    this._name = name;
    this.updateTimestamp();
  }

  protected getEntityPrefix(): string {
    return ENTITY_PREFIXES.CATEGORY;
  }

  constructor(props: CategoryProto) {
    super();
    this._id = props.id ?? v4();
    this._name = props.name;
    this._parentId = props.parentId;
    this._createdAt = props.createdAt ?? new Date().toISOString();
    this._updatedAt = props.updatedAt ?? new Date().toISOString();

    this.validate();
  }

  private updateTimestamp() {
    this._updatedAt = new Date().toISOString();
  }

  update(props: Partial<CategoryUpdateProps>) {
    let isUpdated = false;

    if (props.name !== undefined) {
      this._name = props.name;
      isUpdated = true;
    }

    if (props.updatedAt !== undefined) {
      this._updatedAt = props.updatedAt;
    } else if (isUpdated) {
      this.updateTimestamp();
    }

    if (isUpdated) {
      this.validate();
    }

    return this;
  }

  toJSON(): CategoryProps {
    return {
      id: this._id,
      name: this._name,
      parentId: this._parentId ?? undefined,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
