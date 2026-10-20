import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../../api.js';

export default function useDirectoryData({ user, page, search, directoryPage, schoolId, signOut }) {
  const [directory, setDirectory] = useState({ people: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user || page === 'overview' || page === 'academic-years' || page === 'terms' || page === 'teaching-assignments' || page === 'assessments' || page === 'report-cards' || page === 'enrollments' || page === 'promotions' || page === 'subscriptions' || page === 'users' || page === 'students' || page === 'subjects' || page === 'class-levels' || page === 'class-subjects' || page === 'class-groups' || page === 'mid-term-report-cards' || page === 'staff') return undefined;
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
