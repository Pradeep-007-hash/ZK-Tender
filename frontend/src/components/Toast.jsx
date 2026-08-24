import React from 'react';
import { CheckCircle2, Info } from 'lucide-react';

export default function Toast({ toasts }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast" style={{ borderColor: t.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-gold)' }}>
          {t.type === 'success' ? (
            <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)' }} />
          ) : (
            <Info size={18} style={{ color: 'var(--accent-gold)' }} />
          )}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
