import type { ProtoPackage } from '@/core/types';

import * as v1 from './v1';

export const protoPackages: Array<ProtoPackage> = [...v1.protoPackages];
