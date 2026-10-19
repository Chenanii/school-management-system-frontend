import { apiRequest } from '../../api.js';

// fetchAllPages is shared with the term report cards: import it from './reportCardApi.js'.
const BASE_PATH = '/mid-term-report-cards';

function withOptions(path, { allowIncomplete = false } = {}) {
  return allowIncomplete ? `${path}?allowIncomplete=true` : path;
}

export function fetchMidTermReportCard(enrollmentId, options) {
  return apiRequest(withOptions(`${BASE_PATH}/enrollments/${enrollmentId}`, options));
}

// Strict by default: the server answers 409 MID_TERM_RESULTS_INCOMPLETE until every subject is
// graded from approved and locked assessments. Pass { allowIncomplete: true } to see what is missing.
export function fetchClassGroupMidTermReportCards(termId, classGroupId, options) {
  return apiRequest(withOptions(`${BASE_PATH}/terms/${termId}/class-groups/${classGroupId}`, options));
}

export function fetchFormTutorAttendanceClasses(termId) {
  return apiRequest(`/attendance/classes?${new URLSearchParams({ termId })}`);
}
