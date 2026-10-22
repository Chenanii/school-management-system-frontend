import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../../api.js';

// These routes render their own feature pages and do not use the generic
// directory endpoint. Keep this list aligned with the workspace navigation.
const FEATURE_PAGES = new Set([
  'overview',
  'school-profile',
  'report-designer',
  'academic-years',
  'grading-scales',
  'terms',
  'students',
  'enrollments',
  'teaching-assignments',
  'attendance',
  'assessments',
  'class-levels',
  'class-groups',
  'subjects',
  'class-subjects',
  'staff',
  'users',
  'audit-logs',
  'subscriptions',
  'mid-term-report-cards',
  'report-cards',
  'promotions',
  'school-appearance',
]);

export default function useDirectoryData({ user, page, search, directoryPage, schoolId, signOut }) {
  const [directory, setDirectory] = useState({ people: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user || FEATURE_PAGES.has(page)) return undefined;
    if (user.role === 'SUPER_ADMIN' && !schoolId) return undefined;
    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ page: String(directoryPage), limit: '20' });
        if (search.trim()) params.set('search', search.trim());
        if (page === 'students' && status) params.set('status', status);
        const endpoint = page === 'staff' ? 'teachers' : page;
        const result = await apiRequest(`/${endpoint}?${params}`);
        if (!cancelled) {
          setDirectory({
            people: result.data || [],
            total: result.pagination?.total ?? 0,
            totalPages: Math.max(1, result.pagination?.totalPages ?? 1)
          });
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause.message);
          if (cause.status === 401) signOut();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, search ? 250 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [user, page, directoryPage, search, status, schoolId, signOut, refreshKey]);

  const retry = useCallback(() => setRefreshKey((current) => current + 1), []);
  return { ...directory, loading, error, status, setStatus, retry };
}
