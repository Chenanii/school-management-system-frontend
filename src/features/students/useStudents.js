import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../../api.js';

export default function useStudents({ enabled, signOut }) {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        if (search.trim()) params.set('search', search.trim());
        if (status) params.set('status', status);
        const result = await apiRequest(`/students?${params}`);
        if (!cancelled) {
          setStudents(result.data || []);
          setPagination(result.pagination || { page, limit: 20, total: 0, totalPages: 1 });
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
  }, [enabled, page, search, status, refreshKey, signOut]);

  const refresh = useCallback(() => setRefreshKey((current) => current + 1), []);
  const updateSearch = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);
  const updateStatus = useCallback((value) => {
    setStatus(value);
    setPage(1);
  }, []);

  return {
    students,
    pagination,
    loading,
    error,
    search,
    status,
    page,
    setPage,
    setSearch: updateSearch,
    setStatus: updateStatus,
    refresh
  };
}
