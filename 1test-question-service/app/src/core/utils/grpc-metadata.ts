import { Metadata } from '@grpc/grpc-js';
import { OutgoingHttpHeaders } from 'http2';
import { ForbiddenError } from '../types/errors';

interface UserContext {
  id: string;
  email: string;
  userId: string;
  userGroups: string[];
}

type MidUserMetadata = Partial<UserContext>;

export class GrpcMetadata {
  static getKey(
    key: string,
    headers: OutgoingHttpHeaders,
  ): number | string | string[] | undefined {
    const data = headers[key];
    if (!data) {
      return undefined;
    }
    return data;
  }

  static getMidUserMetadata(metadata: Metadata): MidUserMetadata {
    const headers = metadata.toHttp2Headers();

    const id = this.getKey('mid-id', headers) as string[] | undefined;
    const email = this.getKey('mid-email', headers) as string[] | undefined;
    const userId = this.getKey('mid-user_id', headers) as string[] | undefined;
    const userGroups = this.getKey('mid-user_groups', headers) as
      | string[]
      | undefined;

    return {
      id: id?.[0],
      email: email?.[0],
      userId: userId?.[0],
      userGroups: userGroups,
    };
  }

  static getUserContext(metadata: Metadata): UserContext {
    const midUserMetadata = this.getMidUserMetadata(metadata);

    if (
      !midUserMetadata.id ||
      !midUserMetadata.email ||
      !midUserMetadata.userId ||
      !midUserMetadata.userGroups ||
      midUserMetadata.userGroups.length === 0
    ) {
      throw new ForbiddenError();
    }

    return {
      id: midUserMetadata.id,
      email: midUserMetadata.email,
      userId: midUserMetadata.userId,
      userGroups: midUserMetadata.userGroups,
    };
  }
}
