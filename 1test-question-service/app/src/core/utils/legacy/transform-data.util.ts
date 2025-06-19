import { InvalidPathPropsError } from '@/core/types/errors';
import { BuildPathProps, TargetGroupsExpression } from '@/core/types/legacy';

import { isPathValid } from './validate.util';

export const removeEmptyValues = (
  obj: Record<string, string | undefined>,
): Record<string, string> => {
  const newObj: Record<string, string> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key]) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
};

export const buildPath = (props: BuildPathProps): string => {
  const {
    subjectId,
    examClassificationId,
    areaId,
    questionTypeId,
    questionFormatId,
    createdAt,
  } = props;

  if (
    !isPathValid({
      subjectId,
      examClassificationId,
      areaId,
      questionTypeId,
      questionFormatId,
    })
  ) {
    const pathObj = removeEmptyValues({
      subjectId,
      examClassificationId,
      areaId,
      questionTypeId,
      questionFormatId,
    });

    throw new InvalidPathPropsError(
      null,
      `Invalid path props: ${Object.keys(pathObj).join(', ')}`,
    );
  }

  let path = '';

  if (subjectId) {
    path += `SUBJECT#${subjectId}`;
  }

  if (examClassificationId) {
    path += `#EXAM_CLASSIFICATION#${examClassificationId}`;
  }

  if (areaId) {
    path += `#AREA#${areaId}`;
  }

  if (questionTypeId) {
    path += `#QUESTION_TYPE#${questionTypeId}`;
  }

  if (questionFormatId) {
    path += `#QUESTION_FORMAT#${questionFormatId}`;
  }

  if (!path) return '';

  if (createdAt) {
    path += `#CREATED_AT#${createdAt}`;
  }

  return path;
};

export const createTargetGroupsExpression = (
  targetGroups: string[],
): TargetGroupsExpression => {
  const initialTargetGroupsExpression = {
    FilterExpression: '',
    ExpressionAttributeValues: {},
  };

  const targetGroupsExpression: TargetGroupsExpression = targetGroups.reduce(
    (expression, currentGroup, index) => {
      const expressionAttribute = `:tg${index}`;
      let filterExpression = '';

      if (index === 0) {
        filterExpression = `contains(TargetGroups, ${expressionAttribute})`;
      } else {
        filterExpression =
          expression.FilterExpression +
          ` OR contains(TargetGroups, ${expressionAttribute})`;
      }

      return {
        FilterExpression: filterExpression,
        ExpressionAttributeValues: {
          ...expression.ExpressionAttributeValues,
          [expressionAttribute]: currentGroup,
        },
      };
    },
    initialTargetGroupsExpression,
  );

  return targetGroupsExpression;
};
