import { apiRequest } from '../../api.js';

export async function fetchSchoolTheme() {
  const result = await apiRequest('/school-themes');
  return result.data;
}

export async function saveSchoolTheme(settings) {
  const result = await apiRequest('/school-themes', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
  return result.data;
}