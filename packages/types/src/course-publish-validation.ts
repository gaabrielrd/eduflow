export const coursePublishValidationErrorCodes = [
  "COURSE_TITLE_REQUIRED",
  "COURSE_ARCHIVED",
  "COURSE_WITHOUT_MODULES",
  "MODULE_WITHOUT_LESSONS",
  "LESSON_TITLE_REQUIRED",
  "LESSON_CONTENT_INVALID",
  "MEDIA_ASSET_MISSING",
  "MEDIA_ASSET_WRONG_ORGANIZATION",
  "MEDIA_ASSET_UNAVAILABLE"
] as const;

export type CoursePublishValidationErrorCode =
  (typeof coursePublishValidationErrorCodes)[number];

export type CoursePublishValidationError = {
  code: CoursePublishValidationErrorCode;
  message: string;
  path: string;
};

export type CoursePublishValidationResult = {
  valid: boolean;
  errors: CoursePublishValidationError[];
};
