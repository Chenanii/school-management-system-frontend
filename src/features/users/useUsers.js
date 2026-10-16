import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../../api.js';

export default function useUsers({ enabled, signOut }) {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
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
        if (role) params.set('role', role);
        if (status) params.set('status', status);
        const result = await apiRequest(`/users?${params}`);
        if (!cancelled) {
          setUsers(result.data || []);
          setPagination(result.pagination || { page, limit: 20, total: 0, totalPages: 0 });
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
  }, [enabled, page, search, role, status, refreshKey, signOut]);

  const refresh = useCallback(() => setRefreshKey((current) => current + 1), []);
  const updateSearch = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);
  const updateRole = useCallback((value) => {
    setRole(value);
    setPage(1);
  }, []);
  const updateStatus = useCallback((value) => {
    setStatus(value);
    setPage(1);
  }, []);

  return {
    users,
    pagination,
    loading,
    error,
    search,
    role,
    status,
    page,
    setPage,
    setSearch: updateSearch,
    setRole: updateRole,
    setStatus: updateStatus,
    refresh
  };
}
