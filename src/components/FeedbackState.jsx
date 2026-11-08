import { CircleAlert, LoaderCircle } from 'lucide-react';

export default function FeedbackState({
  status,
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
}) {
  if (status === 'loading') {
    return (
      <div className="table-message" role="status" aria-live="polite">
        <LoaderCircle size={20} className="animate-spin text-green-700" aria-hidden="true" />
        <span className="ml-2">{title}</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="table-message" role="alert">
        <CircleAlert size={19} className="text-red-700" aria-hidden="true" />
        <div>
          <p>{title}</p>
          {description && <p className="mt-1 text-xs text-muted">{description}</p>}
          {onAction && (
            <button className="text-button mt-2" type="button" onClick={onAction}>
              {actionLabel || 'Try again'}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="form-success" role="status" aria-live="polite">
        <span>{title}</span>
      </div>
    );
  }

  return (
    <div className="empty-state">
      {Icon && <div className="empty-state-icon"><Icon size={22} aria-hidden="true" /></div>}
      <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 text-xs text-muted">{description}</p>}
      {onAction && (
        <button className="text-button mt-3" type="button" onClick={onAction}>
          {actionLabel || 'Continue'}
        </button>
      )}
    </div>
  );
}
