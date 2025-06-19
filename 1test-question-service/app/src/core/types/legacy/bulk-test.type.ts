// It should be removed in the future
// or move to the business/domain scope
import { QuestionMode } from '@/core/business/domain';

import { TestCreatorRole, TestSpecialCategory, TestStatus } from './test.type';

export type BulkTestModeConfig = {
  mode: QuestionMode;
  questionCount: number;
  questionIds: string[];
};

export type BulkTestCategoryConfig = {
  areaId: string;
  areaName: string;
  questionCount: number;
  modeConfigs: BulkTestModeConfig[];
};

export enum BulkTestRecordStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export interface BulkTestRecord {
  id: string;
  testName: string;
  testCount: number;
  categoryConfigs: BulkTestCategoryConfig[];
  status: BulkTestRecordStatus;

  // test props
  author: string;
  specialCategory?: TestSpecialCategory;
  subjectId: string;
  subjectName: string;
  examClassificationId: string;
  examClassificationName: string;
  areaId?: string;
  areaName?: string;

  difficulty: number; // 1-5
  targetGroups: Array<string>;
  duration: number;
  creatorId: string;
  /**
   * enum: admin, provider, teacher, academy
   */
  creatorRole: TestCreatorRole;
  testStatus: TestStatus;
  /**
   * won
   */
  originalPrice: number;
  thumbnail: string;
  /**
   * 0 - 1
   *
   * eg: 0.15, 0.9
   */
  passRate: number;
  /**
   * eg: 2024-07-09T17:41:03.760Z
   */
  createdAt: string;
  /**
   * eg: 2024-07-09T17:41:03.760Z
   */
  updatedAt: string;

  academyId?: string;

  // Paper
  paperDate?: string;
  paperQuestionShowCategory: boolean;

  questionCount: number;
}

export type TestInfo = {
  name: string;
  questionIds: string[];
};
