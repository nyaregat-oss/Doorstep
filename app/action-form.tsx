'use client';

import { useActionState, type ReactNode } from 'react';

type ActionResult = { error?: string; message?: string };
type FormAction = (formData: FormData) => Promise<ActionResult>;

export function ActionForm({ action, children, className }: {
  action: FormAction;
  children: ReactNode;
  className?: string;
}) {
  const [result, formAction, pending] = useActionState(
    async (_previous: ActionResult, formData: FormData) => action(formData),
    {},
  );

  return <form action={formAction} className={className} aria-busy={pending}>
    {children}
    {result.error && <p className="auth-error" role="alert">{result.error}</p>}
    {result.message && <p className="auth-message" role="status">{result.message}</p>}
  </form>;
}
