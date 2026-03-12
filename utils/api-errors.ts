export function getApiErrorCode(error: unknown): string {
  if (error instanceof Error && error.message.startsWith('API_ERROR:')) {
    return error.message.replace('API_ERROR:', '');
  }
  return '';
}
