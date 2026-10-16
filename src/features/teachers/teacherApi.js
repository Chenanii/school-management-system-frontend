import { apiRequest } from '../../api.js';

export async function fetchTeachers({ search, page }) {
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (search.trim()) params.set('search', search.trim());
  return apiRequest(`/teachers?${params}`);
}

export function createTeacher(data) {
  return apiRequest('/teachers', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function updateTeacher(id, data) {
  return apiRequest(`/teachers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export function resendInvitation(id) {
  return apiRequest(`/teachers/${id}/resend-invitation`, { method: 'POST' });
}

export function revokeInvitation(id) {
  return apiRequest(`/teachers/${id}/revoke-invitation`, { method: 'POST' });
}

export function acceptInvitation(token, password) {
  return apiRequest('/teachers/invitations/accept', {
    method: 'POST',
    body: JSON.stringify({ token, password })
  });
}

export function teacherInvitationStatus(teacher) {
  if (teacher.user) {
    return teacher.user.status === 'ACTIVE'
      ? { label: 'Account active', tone: 'active' }
      : { label: `Account ${teacher.user.status.toLowerCase()}`, tone: 'inactive' };
  }

  const invitation = teacher.invitations?.[0];
  if (!invitation) return { label: 'Not invited', tone: 'inactive' };
  if (invitation.acceptedAt) return { label: 'Invitation accepted', tone: 'active' };
  if (invitation.revokedAt) return { label: 'Invitation revoked', tone: 'inactive' };
  if (new Date(invitation.expiresAt) <= new Date()) {
    return { label: 'Invitation expired', tone: 'inactive' };
  }
  return { label: 'Invitation pending', tone: 'pending' };
}
