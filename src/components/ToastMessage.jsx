import { CircleCheck, CircleX, X } from 'lucide-react';

export default function ToastMessage({ type = 'error', children, onDismiss }) {
  const success = type === 'success';
  const Icon = success ? CircleCheck : CircleX;

  return (
    <div className={`app-toast app-toast-${success ? 'success' : 'error'}`} role={success ? 'status' : 'alert'} aria-live={success ? 'polite' : 'assertive'}>
      <Icon className="app-toast-icon" size={19} aria-hidden="true" />
      <div className="app-toast-content">{children}</div>
      <button className="app-toast-dismiss" type="button" onClick={onDismiss} aria-label="Dismiss message">
        <X size={17} />
      </button>
    </div>
  );
}
