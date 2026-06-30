export const LEFT_SOURCE_PREFIX = 'left_rel_';
export const RIGHT_SOURCE_PREFIX = 'right_rel_';
export const TARGET_PREFIX = 'target_rel_';

export function isLeftSource(handleId: string) {
  return handleId.startsWith(LEFT_SOURCE_PREFIX);
}
export function isRightSource(handleId: string) {
  return handleId.startsWith(RIGHT_SOURCE_PREFIX);
}
export function isTargetHandle(handleId: string) {
  return handleId.startsWith(TARGET_PREFIX);
}

export function fieldFromSource(handleId: string) {
  if (isLeftSource(handleId)) return handleId.replace(LEFT_SOURCE_PREFIX, '');
  if (isRightSource(handleId)) return handleId.replace(RIGHT_SOURCE_PREFIX, '');
  return handleId;
}

export function fieldFromTarget(handleId: string) {
  return handleId.replace(/^target_rel_\d+_/, '');
}

export function sourceHandle(fieldName: string, side: 'left' | 'right' = 'right') {
  return side === 'left' ? `${LEFT_SOURCE_PREFIX}${fieldName}` : `${RIGHT_SOURCE_PREFIX}${fieldName}`;
}

export function targetHandle(fieldName: string, index = 0) {
  return `${TARGET_PREFIX}${index}_${fieldName}`;
}
