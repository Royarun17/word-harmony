import React, { useState, useCallback } from 'react';

let toastFn = null;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  toastFn = show;

  return { toasts, show };
}

export function toast(message, type = 'info') {
  if (toastFn) toastFn(message, type);
}

export function ToastContainer({ toasts }) {
  return (
    <>
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type === 'error' ? 'error' : t.type === 'success' ? 'success' : ''}`}>
          {t.message}
        </div>
      ))}
    </>
  );
}
