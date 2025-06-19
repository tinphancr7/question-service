import { IsDateString, IsString, IsUUID, IsNotEmpty } from 'class-validator';
import { v4 } from 'uuid';
import { BaseModel } from '@/core/types/base-classes/base-model';

export interface PostProto {
  id?: string;
  title: string;
  content: string;
  authorId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PostProps {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export type PostUpdateProps = {
  [K in keyof Omit<PostProps, 'id' | 'createdAt'>]: PostProps[K];
};

export class Post extends BaseModel {
  @IsUUID('4')
  private _id: string;

  @IsString()
  @IsNotEmpty()
  private _title: string;

  @IsString()
  @IsNotEmpty()
  private _content: string;

  @IsUUID('4')
  private _authorId: string;

  @IsDateString()
  private _createdAt: string;

  @IsDateString()
  private _updatedAt: string;

  get id() {
    return this._id;
  }

  get title() {
    return this._title;
  }

  get content() {
    return this._content;
  }

  get authorId() {
    return this._authorId;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  constructor(props: PostProto) {
    super();
    this._id = props.id ?? v4();
    this._title = props.title;
    this._content = props.content;
    this._authorId = props.authorId;
    this._createdAt = props.createdAt ?? new Date().toISOString();
    this._updatedAt = props.updatedAt ?? new Date().toISOString();

    this.validate();
  }

  private updateTimestamp() {
    this._updatedAt = new Date().toISOString();
  }

  update(props: Partial<PostUpdateProps>) {
    let isUpdated = false;

    if (props.title !== undefined) {
      this._title = props.title;
      isUpdated = true;
    }

    if (props.content !== undefined) {
      this._content = props.content;
      isUpdated = true;
    }

    if (props.authorId !== undefined) {
      this._authorId = props.authorId;
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

  toJSON(): PostProps {
    return {
      id: this._id,
      title: this._title,
      content: this._content,
      authorId: this._authorId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
} 