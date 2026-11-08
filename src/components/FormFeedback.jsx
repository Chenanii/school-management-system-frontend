import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const feedbackIcons = {
  error: AlertCircle,
  success: CheckCircle2,
  warning: AlertCircle,
  info: Info
};

export default function FormFeedback({ message, type = 'error', actionLabel, onAction, onDismiss }) {
  if (!message) return null;
  const Icon = feedbackIcons[type] || Info;
  const role = type === 'error' ? 'alert' : 'status';

  return (
    <div className={'form-feedback form-feedback-' + type} role={role} aria-live={role === 'alert' ? 'assertive' : 'polite'}>
      <Icon size={17} aria-hidden="true" />
      <span className="form-feedback-message">{message}</span>
      {actionLabel && onAction && <button className="form-feedback-action" type="button" onClick={onAction}>{actionLabel}</button>}
      {onDismiss && <button className="form-feedback-dismiss" type="button" onClick={onDismiss} aria-label="Dismiss message"><X size={15} /></button>}
    </div>
  );
}
