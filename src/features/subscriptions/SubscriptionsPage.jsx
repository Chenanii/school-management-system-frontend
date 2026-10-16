import { useCallback, useEffect, useState } from 'react';
import { Building2, Clock3, CreditCard, LoaderCircle, Pencil, Plus, RefreshCw } from 'lucide-react';
import PlanFormModal from './PlanFormModal.jsx';
import SubscriptionStatusModal from './SubscriptionStatusModal.jsx';
import {
  formatPlanPrice,
  formatSubscriptionDate,
  getSubscriptionData,
  requestPlan,
  statusLabel
} from './subscriptionApi.js';

function PlanLimits({ plan }) {
  return (
    <div className="subscription-plan-limits">
      <span>{plan.maxStudents == null ? 'Unlimited' : plan.maxStudents} students</span>
      <span>{plan.maxStaff == null ? 'Unlimited' : plan.maxStaff} staff</span>
    </div>
  );
}

function PlanManager({ signOut }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [formPlan, setFormPlan] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const result = await getSubscriptionData('/subscriptions/manage/plans');
      setPlans(result.data || []);
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load, refreshKey]);

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  return (
    <>
      <div className="subscription-section-heading">
        <div><h2>Plan catalogue</h2><p>Define billing, trials, capacity limits, and availability.</p></div>
        <button className="primary-button" onClick={() => { setFormPlan(null); setFormOpen(true); }}><Plus size={16} /> Add plan</button>
      </div>
      {error ? (
        <div className="table-message"><p>{error}</p><button className="text-button mt-2" onClick={refresh}>Try again</button></div>
      ) : loading ? (
        <div className="table-message"><LoaderCircle size={20} className="animate-spin text-green-700" /><span className="ml-2">Loading subscription plans…</span></div>
      ) : plans.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><CreditCard size={22} /></div><p className="mt-3 text-sm font-semibold text-ink">No plans configured</p><button className="text-button mt-3" onClick={() => { setFormPlan(null); setFormOpen(true); }}>Create the first plan</button></div>
      ) : (
        <div className="subscription-plan-grid">
          {plans.map((plan) => (
            <article className={`subscription-plan-card ${plan.isActive ? '' : 'subscription-plan-inactive'}`} key={plan.id}>
              <div className="subscription-plan-card-top">
                <div><span className="eyebrow">{plan.code}</span><h3>{plan.name}</h3></div>
                <span className={`subject-status subject-status-${plan.isActive ? 'active' : 'inactive'}`}>{plan.isActive ? 'Available' : 'Inactive'}</span>
              </div>
              <p className="subscription-plan-description">{plan.description || 'No plan description provided.'}</p>
              <strong className="subscription-plan-price">{formatPlanPrice(plan)}</strong>
              <PlanLimits plan={plan} />
              <div className="subscription-plan-meta">{plan.trialDays} day{plan.trialDays === 1 ? '' : 's'} trial · {plan.interval.toLowerCase()}</div>
              <button className="table-action subscription-edit-plan" onClick={() => { setFormPlan(plan); setFormOpen(true); }}><Pencil size={13} /> Edit plan</button>
            </article>
          ))}
        </div>
      )}
      {formOpen && (
        <PlanFormModal plan={formPlan} signOut={signOut} onClose={() => setFormOpen(false)} onSaved={() => {
          setFormOpen(false);
          refresh();
        }} />
      )}
    </>
  );
}

function SubscriptionManager({ signOut }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusSubscription, setStatusSubscription] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const result = await getSubscriptionData('/subscriptions/manage/subscriptions');
      setSubscriptions(result.data || []);
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load, refreshKey]);

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  return (
    <>
      <div className="subscription-section-heading">
        <div><h2>School subscriptions</h2><p>Review subscription history and confirm payment or status changes.</p></div>
        <span className="subscription-record-count">{subscriptions.length} records</span>
      </div>
      {error ? (
        <div className="table-message"><p>{error}</p><button className="text-button mt-2" onClick={refresh}>Try again</button></div>
      ) : loading ? (
        <div className="table-message"><LoaderCircle size={20} className="animate-spin text-green-700" /><span className="ml-2">Loading school subscriptions…</span></div>
      ) : subscriptions.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><Building2 size={22} /></div><p className="mt-3 text-sm font-semibold text-ink">No school subscriptions yet</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="people-table subscription-table">
            <thead><tr><th>School</th><th>Plan</th><th>Status</th><th>Period ends</th><th>Trial ends</th><th>Created</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td><div className="subscription-school-cell"><strong>{subscription.school?.name || 'School'}</strong><span>{subscription.school?.slug}{subscription.school?.email ? ` · ${subscription.school.email}` : ''}</span></div></td>
                  <td><div className="subscription-plan-cell"><strong>{subscription.plan?.name}</strong><span>{formatPlanPrice(subscription.plan)}</span></div></td>
                  <td><span className={`subject-status subject-status-${subscription.status.toLowerCase().replace('_', '-')}`}>{statusLabel(subscription.status)}</span></td>
                  <td className="whitespace-nowrap text-muted">{formatSubscriptionDate(subscription.currentPeriodEnd)}</td>
                  <td className="whitespace-nowrap text-muted">{formatSubscriptionDate(subscription.trialEndsAt)}</td>
                  <td className="whitespace-nowrap text-muted">{formatSubscriptionDate(subscription.createdAt)}</td>
                  <td><button className="table-action" onClick={() => setStatusSubscription(subscription)}>Update</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {statusSubscription && (
        <SubscriptionStatusModal
          subscription={statusSubscription}
          signOut={signOut}
          onClose={() => setStatusSubscription(null)}
          onSaved={() => {
            setStatusSubscription(null);
            refresh();
          }}
        />
      )}
    </>
  );
}

function SchoolSubscription({ signOut }) {
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionIsError, setActionIsError] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setError('');
    try {
      const [subscriptionResult, plansResult] = await Promise.all([
        getSubscriptionData('/subscriptions/current'),
        getSubscriptionData('/subscriptions/plans')
      ]);
      setSubscription(subscriptionResult.data);
      setPlans(plansResult.data || []);
      setSelectedPlan((current) => current || plansResult.data?.[0]?.id || '');
    } catch (cause) {
      setError(cause.message);
      if (cause.status === 401) signOut();
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load, refreshKey]);

  async function submitRequest(event) {
    event.preventDefault();
    if (!selectedPlan) return;
    setRequesting(true);
    setActionMessage('');
    setActionIsError(false);
    try {
      const result = await requestPlan(selectedPlan);
      const status = result.data?.status;
      setActionMessage(status === 'ACTIVE'
        ? 'Your plan has been changed successfully.'
        : 'Plan change requested. Payment confirmation is pending; contact your school platform administrator to complete the change.');
      setRefreshKey((current) => current + 1);
    } catch (cause) {
      setActionMessage(cause.message);
      setActionIsError(true);
      if (cause.status === 401) signOut();
    } finally {
      setRequesting(false);
    }
  }

  const current = subscription?.current;
  const pendingChange = subscription?.pendingChange;
  const selectedIsAlreadyRequested = selectedPlan === current?.planId || selectedPlan === pendingChange?.planId;

  if (loading) {
    return <div className="panel subscription-loading"><LoaderCircle size={20} className="animate-spin text-green-700" /><span>Loading your subscription…</span></div>;
  }
  if (error) {
    return <div className="panel subscription-loading subscription-error"><p>{error}</p><button className="text-button" onClick={() => setRefreshKey((value) => value + 1)}>Try again</button></div>;
  }

  return (
    <div className="school-subscription-content">
      {actionMessage && (
        <div className={actionIsError ? 'notice-error' : 'teaching-assignment-notice'} role={actionIsError ? 'alert' : 'status'}>
          <span>{actionMessage}</span><button className="text-button" onClick={() => setActionMessage('')}>Dismiss</button>
        </div>
      )}
      <section className="panel subscription-current-panel">
        <div className="subscription-current-icon"><CreditCard size={20} /></div>
        <div className="subscription-current-copy">
          <p className="eyebrow">Current subscription</p>
          {current ? (
            <>
              <h2>{current.plan.name}</h2>
              <p>{formatPlanPrice(current.plan)} · {statusLabel(current.status)}</p>
              <PlanLimits plan={current.plan} />
              {current.status === 'TRIALING' && <span className="subscription-renewal">Trial ends {formatSubscriptionDate(current.trialEndsAt)}</span>}
              {current.currentPeriodEnd && <span className="subscription-renewal">Paid through {formatSubscriptionDate(current.currentPeriodEnd)}</span>}
            </>
          ) : (
            <>
              <h2>No active subscription</h2>
              <p>Choose a plan below to request access for your school.</p>
            </>
          )}
        </div>
        {current && <span className={`subject-status subject-status-${current.status.toLowerCase().replace('_', '-')}`}>{statusLabel(current.status)}</span>}
      </section>
      {pendingChange && (
        <section className="subscription-pending-card">
          <Clock3 size={17} />
          <div><strong>Plan change awaiting confirmation</strong><span>{pendingChange.plan?.name} · requested {formatSubscriptionDate(pendingChange.createdAt)}</span></div>
          <span className="subject-status subject-status-pending-payment">Pending payment</span>
        </section>
      )}
      <section className="panel school-plan-selection">
        <div className="subscription-section-heading">
          <div><h2>Available plans</h2><p>Select a plan to apply or send a change request to the platform administrator.</p></div>
        </div>
        {plans.length === 0 ? (
          <div className="plan-message">No plans are available at this time. Please contact the platform administrator.</div>
        ) : (
          <form onSubmit={submitRequest}>
            <div className="subscription-plan-grid">
              {plans.map((plan) => {
                const isCurrent = current?.planId === plan.id;
                const isPending = pendingChange?.planId === plan.id;
                return (
                  <label className={`subscription-plan-card subscription-choice-card ${selectedPlan === plan.id ? 'subscription-choice-selected' : ''}`} key={plan.id}>
                    <input type="radio" name="plan" value={plan.id} checked={selectedPlan === plan.id} onChange={() => setSelectedPlan(plan.id)} disabled={isCurrent || isPending} />
                    <div className="subscription-plan-card-top">
                      <div><span className="eyebrow">{plan.interval.toLowerCase()}</span><h3>{plan.name}</h3></div>
                      {(isCurrent || isPending) && <span className="subject-status subject-status-active">{isCurrent ? 'Current' : 'Requested'}</span>}
                    </div>
                    <p className="subscription-plan-description">{plan.description || `${plan.trialDays} day${plan.trialDays === 1 ? '' : 's'} trial`}</p>
                    <strong className="subscription-plan-price">{formatPlanPrice(plan)}</strong>
                    <PlanLimits plan={plan} />
                    <span className="subscription-plan-meta">{plan.trialDays} day{plan.trialDays === 1 ? '' : 's'} trial</span>
                  </label>
                );
              })}
            </div>
            <div className="subscription-request-footer">
              {pendingChange && <span>Requesting another plan will replace the current pending request.</span>}
              <button className="primary-button" type="submit" disabled={requesting || !selectedPlan || plans.length === 0 || selectedIsAlreadyRequested}>
                {requesting ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={15} />}
                {requesting ? 'Sending request…' : 'Request plan change'}
              </button>
            </div>
          </form>
        )}
      </section>
      {subscription?.recent?.length > 0 && (
        <section className="panel subscription-history-panel">
          <div className="subscription-section-heading"><div><h2>Subscription history</h2><p>Recent subscription records for this school.</p></div></div>
          <div className="subscription-history-list">
            {subscription.recent.map((item) => (
              <div className="subscription-history-row" key={item.id}>
                <div><strong>{item.plan?.name}</strong><span>{formatSubscriptionDate(item.createdAt)} · {formatPlanPrice(item.plan)}</span></div>
                <span className={`subject-status subject-status-${item.status.toLowerCase().replace('_', '-')}`}>{statusLabel(item.status)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function SubscriptionsPage({ user, signOut }) {
  const [view, setView] = useState('subscriptions');

  return (
    <>
      <div className="welcome-row students-welcome">
        <div>
          <p className="eyebrow">{user.role === 'SUPER_ADMIN' ? 'Platform billing' : 'School billing'}</p>
          <h1 className="page-title">Subscriptions<span className="title-dot">.</span></h1>
          <p className="mt-2 text-sm text-muted">{user.role === 'SUPER_ADMIN' ? 'Manage plan offerings and school subscription status.' : 'Review your school’s plan, request changes, and check billing history.'}</p>
        </div>
      </div>
      {user.role === 'SUPER_ADMIN' ? (
        <>
          <div className="subscription-tabs" role="tablist" aria-label="Subscription administration">
            <button className={view === 'subscriptions' ? 'subscription-tab subscription-tab-active' : 'subscription-tab'} role="tab" aria-selected={view === 'subscriptions'} onClick={() => setView('subscriptions')}><Building2 size={15} /> School subscriptions</button>
            <button className={view === 'plans' ? 'subscription-tab subscription-tab-active' : 'subscription-tab'} role="tab" aria-selected={view === 'plans'} onClick={() => setView('plans')}><CreditCard size={15} /> Plan catalogue</button>
          </div>
          <section className="panel subscription-admin-panel">
            {view === 'plans' ? <PlanManager signOut={signOut} /> : <SubscriptionManager signOut={signOut} />}
          </section>
        </>
      ) : (
        <SchoolSubscription signOut={signOut} />
      )}
    </>
  );
}
