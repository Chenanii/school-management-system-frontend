export const userRoles = [
  { value: 'SCHOOL_ADMIN', label: 'School administrator' },
  { value: 'HEADTEACHER', label: 'Headteacher' },
  { value: 'ACADEMIC_ADMIN', label: 'Academic administrator' },
  { value: 'EXAMS_OFFICER', label: 'Exams officer' },
  { value: 'TEACHER', label: 'Teacher' },
  { value: 'FORM_TUTOR', label: 'Form tutor' }
];

export function roleLabel(role) {
  return userRoles.find((item) => item.value === role)?.label || role?.replaceAll('_', ' ') || 'Unknown';
}
