import { AlertTriangle } from 'lucide-react';

export default function ConfirmActionModal({
  title,
  message,
  confirmLabel = 'Delete',
  tone = 'danger',
  onCancel,
  onConfirm,
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section className="user-modal confirm-action-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-action-title" aria-describedby="confirm-action-description">
        <div className="modal-heading confirm-action-heading">
          <span className="confirm-action-icon"><AlertTriangle size={19} /></span>
          <div>
            <p className="eyebrow">Please confirm</p>
            <h2 id="confirm-action-title">{title}</h2>
            <p id="confirm-action-description">{message}</p>
          </div>
        </div>
        <div className="modal-actions confirm-action-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
          <button className={`confirm-action-button confirm-action-button-${tone}`} type="button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
