import { apiRequest } from '../../api.js';

// fetchAllPages is shared with the term report cards: import it from './reportCardApi.js'.
const BASE_PATH = '/mid-term-report-cards';

function withOptions(path, { allowIncomplete = false } = {}) {
  return allowIncomplete ? `${path}?allowIncomplete=true` : path;
}

export function fetchMidTermReportCard(enrollmentId, options) {
  return apiRequest(withOptions(`${BASE_PATH}/enrollments/${enrollmentId}`, options));
}

export function saveMidTermReportDetails(enrollmentId, details) {
  return apiRequest(`${BASE_PATH}/enrollments/${enrollmentId}/details`, { method: 'PUT', body: JSON.stringify(details) });
}

// Strict by default: the server answers 409 MID_TERM_RESULTS_INCOMPLETE until every subject is
// graded from approved assessments. Pass { allowIncomplete: true } to see what is missing.
export function fetchClassGroupMidTermReportCards(termId, classGroupId, options) {
  return apiRequest(withOptions(`${BASE_PATH}/terms/${termId}/class-groups/${classGroupId}`, options));
}

export function publishClassGroupMidTermReportCards(termId, classGroupId) {
  return apiRequest(`${BASE_PATH}/terms/${termId}/class-groups/${classGroupId}/publish`, { method: 'POST' });
}

export function fetchFormTutorAttendanceClasses(termId) {
  return apiRequest(`/attendance/classes?${new URLSearchParams({ termId })}`);
}
