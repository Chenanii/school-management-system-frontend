import { useCallback, useEffect, useState } from 'react';
import {
  SCHOOL_CONTEXT_KEY,
  apiRequest,
  clearSchoolContextId,
  getSchoolContextId,
  saveSchoolContextId
} from '../../api.js';

const emptySummary = {
  user: {},
  school: null,
  schools: [],
  schoolsManaged: null,
  students: [],
  teachers: [],
  studentCount: null,
  teacherCount: null
};

export default function useDashboardData(signOut) {
  const [summary, setSummary] = useState(emptySummary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    function synchronizeSchoolContext(event) {
      if (event.key !== SCHOOL_CONTEXT_KEY) return;
      const school = summary.schools.find((item) => item.id === event.newValue) || null;
      setSummary((current) => ({
        ...current,
        school,
        studentCount: school?._count?.students ?? null,
        teacherCount: school?._count?.teachers ?? null
      }));
    }

    window.addEventListener('storage', synchronizeSchoolContext);
    return () => window.removeEventListener('storage', synchronizeSchoolContext);
  }, [summary.schools]);

  const loadSummary = useCallback(async (user) => {
    setLoading(true);
    setError('');
    try {
      if (user.role === 'SUPER_ADMIN') {
        const result = await apiRequest('/schools');
        const schools = result.data || [];
        const storedSchoolId = getSchoolContextId();
        const school = schools.find((item) => item.id === storedSchoolId) || null;
        if (storedSchoolId && !school) clearSchoolContextId();
        setSummary({
          user,
          school,
          schools,
          schoolsManaged: schools.length,
          students: [],
          teachers: [],
          studentCount: school?._count?.students ?? null,
          teacherCount: school?._count?.teachers ?? null
        });
      } else if (user.role === 'SCHOOL_ADMIN') {
        const [studentsResult, teachersResult] = await Promise.all([
          apiRequest('/students?limit=5'),
          apiRequest('/teachers?limit=5')
        ]);
        setSummary({
          user,
          school: user.school,
          schoolsManaged: null,
          students: studentsResult.data || [],
          teachers: teachersResult.data || [],
          studentCount: studentsResult.pagination?.total ?? 0,
          teacherCount: teachersResult.pagination?.total ?? 0
        });
      } else {
        setSummary({
          ...emptySummary,
          user,
          school: user.school
        });
      }
    } catch (cause) {
      if (cause.status === 401) signOut();
      setSummary({ ...emptySummary, user, school: user.school });
      setError(cause.message);
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  const selectSchool = useCallback((schoolId) => {
    const school = summary.schools.find((item) => item.id === schoolId);
    if (!school) {
      setError('That school is no longer available. Reload the school list and try again.');
      return;
    }

    saveSchoolContextId(school.id);
    setSummary((current) => ({
      ...current,
      school,
      studentCount: school._count?.students ?? null,
      teacherCount: school._count?.teachers ?? null
    }));
    setError('');
  }, [summary.schools]);

  return { summary, loading, error, loadSummary, selectSchool };
}
