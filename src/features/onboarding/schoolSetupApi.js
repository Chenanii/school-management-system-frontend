import { apiRequest } from '../../api.js';

export async function fetchSchoolSetupStatus() {
  const result = await apiRequest('/schools/setup-status');
  return result.data;
}
