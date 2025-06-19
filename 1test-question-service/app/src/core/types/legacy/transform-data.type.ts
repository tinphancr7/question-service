export interface BuildPathProps {
  subjectId?: string;
  examClassificationId?: string;
  areaId?: string;
  questionTypeId?: string;
  questionFormatId?: string;
  createdAt?: string;
}

export interface TargetGroupsExpression {
  FilterExpression: string;
  ExpressionAttributeValues: Record<string, string>;
}
