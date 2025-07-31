// Inject용 토큰
export const UPLOAD_TYPE_LIST_TOKEN = 'UPLOAD_TYPE_LIST';
export const UPLOAD_LIMIT_SIZE_OBJ_TOKEN = 'UPLOAD_LIMIT_SIZE_OBJ';
export const UPLOAD_VALID_FILE_EXTENSION_OBJ_TOKEN =
  'UPLOAD_VALID_FILE_EXTENSION_OBJ';

// 업로드하는 경우의 수
export const UPLOAD_TYPE_LIST = ['post-image', 'profile-image'] as const;
export type UPLOAD_TYPE = (typeof UPLOAD_TYPE_LIST)[number];
