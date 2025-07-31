// Inject용 토큰
export const FILE_TYPE_LIST_TOKEN = 'FILE_TYPE_LIST';
export const FILE_LIMIT_SIZE_OBJ_TOKEN = 'FILE_LIMIT_SIZE_OBJ';
export const FILE_VALID_FILE_EXTENSION_OBJ_TOKEN =
  'FILE_VALID_FILE_EXTENSION_OBJ';

// 업로드하는 경우의 수
export const FILE_TYPE_LIST = ['post-image', 'profile-image'] as const;
export type FILE_TYPE = (typeof FILE_TYPE_LIST)[number];
