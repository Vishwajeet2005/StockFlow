import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex gap-3 items-start mb-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-100' : 'bg-yellow-100'}`}>
              <AlertTriangle size={17} className={danger ? 'text-red-600' : 'text-yellow-600'} />
            </div>
            <div>
              <h3 className="font-semibold text-ink-900">{title}</h3>
              <p className="text-sm text-ink-500 mt-1">{message}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
