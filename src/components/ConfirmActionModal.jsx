import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmActionModal({
  title,
  message,
  confirmLabel = 'Delete',
  confirmationText = '',
  tone = 'danger',
  confirmDisabled = false,
  onCancel,
  onConfirm,
}) {
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const confirmationMatches = !confirmationText || typedConfirmation === confirmationText;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section className="user-modal confirm-action-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-action-title" aria-describedby="confirm-action-description">
        <div className="modal-heading confirm-action-heading">
          <span className="confirm-action-icon"><AlertTriangle size={19} /></span>
          <div>
            <p className="eyebrow">Please confirm</p>
            <h2 id="confirm-action-title">{title}</h2>
            <p id="confirm-action-description">{message}</p>
            {confirmationText && <label className="field-label confirm-action-confirmation-field">
              Type <strong>{confirmationText}</strong> to continue
              <input
                className="text-input"
                type="text"
                autoComplete="off"
                autoFocus
                value={typedConfirmation}
                onChange={(event) => setTypedConfirmation(event.target.value)}
              />
            </label>}
          </div>
        </div>
        <div className="modal-actions confirm-action-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
          <button className={`confirm-action-button confirm-action-button-${tone}`} type="button" onClick={onConfirm} disabled={confirmDisabled || !confirmationMatches}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
