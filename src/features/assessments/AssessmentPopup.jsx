import { useEffect, useRef, useState } from 'react';
import { CircleCheck, CircleX, X } from 'lucide-react';

export default function AssessmentPopup({ message, type = 'error', onDismiss, actionLabel, onAction, duration = 8000 }) {
  const [visible, setVisible] = useState(Boolean(message));
  const dismissRef = useRef(onDismiss);
  const actionRef = useRef(onAction);

  useEffect(() => { dismissRef.current = onDismiss; }, [onDismiss]);
  useEffect(() => { actionRef.current = onAction; }, [onAction]);
  useEffect(() => {
    setVisible(Boolean(message));
    if (!message || duration <= 0) return undefined;
    const timer = window.setTimeout(() => dismissRef.current?.(), duration);
    return () => window.clearTimeout(timer);
  }, [message, duration]);

  if (!message || !visible) return null;
  const success = type === 'success';
  const Icon = success ? CircleCheck : CircleX;
  return (
    <div className={`assessment-popup ${success ? 'assessment-popup-success' : 'assessment-popup-error'}`} role={success ? 'status' : 'alert'} aria-live={success ? 'polite' : 'assertive'}>
      <Icon size={19} aria-hidden="true" />
      <span className="assessment-popup-message">{message}</span>
      {actionLabel && <button className="assessment-popup-action" type="button" onClick={() => { actionRef.current?.(); dismissRef.current?.(); }}>{actionLabel}</button>}
      <button className="assessment-popup-close" type="button" aria-label="Dismiss notification" onClick={() => dismissRef.current?.()}><X size={16} /></button>
    </div>
  );
}
