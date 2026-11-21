import { useCallback, useEffect, useState } from 'react';
export function useErrorToast() {
  const [toast, setToast] = useState({ message: '', key: 0 });
  const showError = useCallback(
    (message: string) => setToast((previous) => ({ message, key: previous.key + 1 })),
    [],
  );
  const dismiss = useCallback(() => setToast((previous) => ({ ...previous, message: '' })), []);
  useEffect(() => {
    if (!toast.message) return;
    const timer = window.setTimeout(dismiss, 6000);
    return () => window.clearTimeout(timer);
  }, [toast.key, toast.message, dismiss]);
  return { ...toast, showError, dismiss };
}
