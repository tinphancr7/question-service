export interface ValidateRangeNumberProps {
  fieldName: string;
  fieldValue: number;
  min: number;
  max: number;
}

export interface PathProps {
  subjectId?: string;
  examClassificationId?: string;
  areaId?: string;
  questionTypeId?: string;
  questionFormatId?: string;
}
