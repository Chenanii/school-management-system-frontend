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
  teacherCount: null,
  classDistribution: null,
  teachingAssignments: [],
  assessments: [],
  terms: []
};

async function fetchAllPages(path) {
  const params = new URLSearchParams({ page: '1', limit: '100' });
  const first = await apiRequest(`${path}?${params}`);
  const records = [...(first.data || [])];
  for (let page = 2; page <= (first.pagination?.totalPages || 1); page += 1) {
    params.set('page', String(page));
    const result = await apiRequest(`${path}?${params}`);
    records.push(...(result.data || []));
  }
  return records;
}

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
        teacherCount: school?._count?.teachers ?? null,
        classDistribution: null
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
          teacherCount: school?._count?.teachers ?? null,
          classDistribution: school ? (await apiRequest('/students/distribution').catch(() => null))?.data || null : null
        });
      } else if (user.role === 'SCHOOL_ADMIN') {
        const [studentsResult, teachersResult, schoolResult, distributionResult] = await Promise.all([
          apiRequest('/students?limit=5'),
          apiRequest('/teachers?limit=5'),
          apiRequest('/schools/current'),
          apiRequest('/students/distribution').catch(() => null)
        ]);
        setSummary({
          user,
          school: schoolResult.data,
          schoolsManaged: null,
          students: studentsResult.data || [],
          teachers: teachersResult.data || [],
          studentCount: studentsResult.pagination?.total ?? 0,
          teacherCount: teachersResult.pagination?.total ?? 0,
          classDistribution: distributionResult?.data || null
        });
      } else if (user.role === 'HEADTEACHER') {
        const [studentsResult, teachersResult, schoolResult, distributionResult, assessments, terms] = await Promise.all([
          apiRequest('/students?limit=5'),
          apiRequest('/teachers?limit=5'),
          apiRequest('/schools/current'),
          apiRequest('/students/distribution').catch(() => null),
          fetchAllPages('/assessments'),
          fetchAllPages('/terms')
        ]);
        setSummary({
          ...emptySummary,
          user,
          school: schoolResult.data,
          students: studentsResult.data || [],
          teachers: teachersResult.data || [],
          studentCount: studentsResult.pagination?.total ?? 0,
          teacherCount: teachersResult.pagination?.total ?? 0,
          classDistribution: distributionResult?.data || null,
          assessments,
          terms
        });
      } else {
        const [schoolResult, teachingAssignments, assessmentRecords] = await Promise.all([
          user.schoolId ? apiRequest('/schools/current') : Promise.resolve(null),
          user.role === 'TEACHER' ? fetchAllPages('/teaching-assignments') : Promise.resolve([]),
          ['TEACHER', 'EXAMS_OFFICER'].includes(user.role) ? fetchAllPages('/assessments') : Promise.resolve([])
        ]);
        setSummary({
          ...emptySummary,
          user,
          school: schoolResult?.data || user.school,
          teachingAssignments,
          assessments: assessmentRecords
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
      teacherCount: school._count?.teachers ?? null,
      classDistribution: null
    }));
    setError('');
    apiRequest('/students/distribution')
      .then((result) => setSummary((current) => current.school?.id === school.id ? { ...current, classDistribution: result.data } : current))
      .catch((cause) => { if (cause.status === 401) signOut(); });
  }, [summary.schools, signOut]);

  const updateCurrentSchool = useCallback((school) => {
    setSummary((current) => ({
      ...current,
      school: { ...current.school, ...school },
      schools: current.schools.map((item) => item.id === school.id ? { ...item, ...school } : item),
    }));
  }, []);

  return { summary, loading, error, loadSummary, selectSchool, updateCurrentSchool };
}
