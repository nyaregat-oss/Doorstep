'use client';

import { useActionState, useEffect, useRef, type ReactNode } from 'react';
import { useToast } from '@/components/ui/toast';

type ActionResult = { error?: string; message?: string };
type FormAction = (formData: FormData) => Promise<ActionResult>;

export function ActionForm({
  action,
  children,
  className,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
}) {
  const { notify } = useToast();
  const [result, formAction, pending] = useActionState(
    async (_previous: ActionResult, formData: FormData) => action(formData),
    {},
  );
  const lastShown = useRef<ActionResult>({});

  useEffect(() => {
    if (result !== lastShown.current && (result.error || result.message)) {
      lastShown.current = result;
      notify(result.error || result.message || '', result.error ? 'error' : 'success');
    }
  }, [result, notify]);

  return (
    <form action={formAction} className={className} aria-busy={pending}>
      {children}
      {result.error && (
        <p className="ds-alert ds-alert-error" role="alert" style={{ marginTop: 8 }}>
          {result.error}
        </p>
      )}
      {result.message && (
        <p className="ds-alert ds-alert-success" role="status" style={{ marginTop: 8 }}>
          {result.message}
        </p>
      )}
    </form>
  );
}
