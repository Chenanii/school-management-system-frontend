const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1')
  .replace(/\/+$/, '');
export const TOKEN_KEY = 'schoolhouse.accessToken';
export const SCHOOL_CONTEXT_KEY = 'schoolhouse.schoolId';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getAccessToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function saveAccessToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function getSchoolContextId() {
  return window.localStorage.getItem(SCHOOL_CONTEXT_KEY);
}

export function saveSchoolContextId(schoolId) {
  window.localStorage.setItem(SCHOOL_CONTEXT_KEY, schoolId);
}

export function clearSchoolContextId() {
  window.localStorage.removeItem(SCHOOL_CONTEXT_KEY);
}

export async function apiRequest(path, options = {}) {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  const method = (options.method || 'GET').toUpperCase();
  const pathname = path.split('?')[0].replace(/\/+$/, '');
  const isSchoolListBootstrap = pathname === '/schools' && method === 'GET';
  const isAuthRequest = pathname === '/auth' || pathname.startsWith('/auth/');

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const schoolContextId = getSchoolContextId();
  if (schoolContextId && !isSchoolListBootstrap && !isAuthRequest && !headers.has('X-School-ID')) {
    headers.set('X-School-ID', schoolContextId);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError('The server returned an unreadable response.', response.status);
  }

  if (!response.ok || payload.success === false) {
    throw new ApiError(
      payload.error?.message || payload.message || 'The request could not be completed.',
      response.status
    );
  }

  return payload;
}
