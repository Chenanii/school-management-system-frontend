import { apiRequest } from '../../api.js';

export const subscriptionStatuses = [
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'PENDING_PAYMENT',
  'CANCELED',
  'EXPIRED'
];

export function getSubscriptionData(path) {
  return apiRequest(path);
}

export function savePlan(id, data) {
  return apiRequest(id ? `/subscriptions/plans/${id}` : '/subscriptions/plans', {
    method: id ? 'PATCH' : 'POST',
    body: JSON.stringify(data)
  });
}

export function requestPlan(planId) {
  return apiRequest('/subscriptions/change-plan', {
    method: 'POST',
    body: JSON.stringify({ planId })
  });
}

export function startCheckout(subscriptionId) {
  return apiRequest(`/subscriptions/${subscriptionId}/checkout`, { method: 'POST' });
}

export function updateSubscription(id, data) {
  return apiRequest(`/subscriptions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export function formatPlanPrice(plan) {
  try {
    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: plan.currency
    });
    const amount = plan.priceMinor / (10 ** formatter.resolvedOptions().maximumFractionDigits);
    const period = 'academic term';
    return plan.priceMinor === 0 ? 'Free' : `${formatter.format(amount)} / ${period}`;
  } catch {
    return `${plan.currency} ${(plan.priceMinor / 100).toFixed(2)}`;
  }
}

export function statusLabel(status) {
  return status.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatSubscriptionDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function datetimeInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function datetimePayloadValue(value) {
  return value ? new Date(value).toISOString() : null;
}
