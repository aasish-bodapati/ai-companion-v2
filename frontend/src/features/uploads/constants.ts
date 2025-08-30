export const UPLOAD_CATEGORIES = [
  { value: 'bmi_report', label: 'BMI report' },
  { value: 'medical_report', label: 'Medical report' },
  { value: 'document', label: 'Other' },
] as const;

export type UploadCategory = typeof UPLOAD_CATEGORIES[number]['value'];

export const DEFAULT_UPLOAD_CATEGORY: UploadCategory = 'document';
export const DEFAULT_IMPORTANCE = 1.0;
export const DEFAULT_CONSOLIDATE = true;
