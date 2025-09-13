export function isDebugEnabled(): boolean {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const debugEnabled = process.env.DEBUG_ENDPOINTS_ENABLED === 'true';
  return isDevelopment || debugEnabled;
}

